<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Setting;
use App\Models\User;
use App\Support\LandingContent;
use App\Support\TrackingSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LandingPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        RateLimiter::clear('leads');
    }

    public function test_landing_page_renders_rtl_with_seo_and_without_internal_settings(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('dir="rtl"', false)
            ->assertSee('<meta name="description"', false)
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing')
                ->has('content.hero.title')
                ->missing('content.notifications'));
    }

    public function test_tracking_pixels_render_only_when_configured(): void
    {
        $this->get('/')->assertDontSee('fbevents.js', false);

        TrackingSettings::save(['meta_pixel_id' => '1234567890']);

        $this->get('/')->assertSee("fbq('init','1234567890')", false);
    }

    public function test_visitor_can_submit_a_lead_with_attribution(): void
    {
        $this->post('/leads', [
            'name' => 'أحمد المنصوري',
            'phone' => '+971 50 123 4567',
            'plot_type' => 'تاون هاوس',
            'payment_method' => 'كاش (خصم 35%)',
            'attribution' => ['utm_source' => 'facebook', 'utm_campaign' => 'eid55', 'fbclid' => 'abc', 'evil' => 'x'],
        ])->assertRedirect()->assertSessionHas('lead_submitted', true);

        $lead = Lead::sole();
        $this->assertSame('facebook', $lead->utm_source);
        $this->assertSame('eid55', $lead->utm_campaign);
        $this->assertSame('abc', $lead->fbclid);
        $this->assertSame('new', $lead->status);
        $this->assertSame('ar', $lead->locale);
    }

    public function test_english_page_renders_ltr_with_hreflang_and_english_copy(): void
    {
        $this->get('/en')
            ->assertOk()
            ->assertSee('<html lang="en" dir="ltr"', false)
            ->assertSee('hreflang="ar"', false)
            ->assertSee('hreflang="en"', false)
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing')
                ->where('locale', 'en')
                ->where('content.hero.cta_label', 'Get prices & plot sizes'));

        $this->get('/')->assertSee('<html lang="ar" dir="rtl"', false);
    }

    public function test_english_lead_gets_english_errors_and_is_tagged_en(): void
    {
        $this->post('/leads', ['locale' => 'en', 'name' => 'John', 'phone' => '12'])
            ->assertSessionHasErrors(['phone' => 'Please enter a valid phone number.']);

        $this->post('/leads', ['locale' => 'en', 'name' => 'John Smith', 'phone' => '+971 50 111 2222'])
            ->assertSessionHas('lead_submitted', true);
        $this->assertSame('en', Lead::sole()->locale);
    }

    public function test_languages_have_separate_text_but_share_images_phone_and_sections(): void
    {
        $this->actingAs(User::factory()->create());

        $en = LandingContent::get('en');
        $en['hero']['title'] = 'English headline';
        $en['brand']['phone'] = '+971 6 123 4567';                       // shared
        $en['sections'][0]['enabled'] = false;                            // shared
        $this->put('/dashboard/content', ['locale' => 'en', 'version' => LandingContent::version(), 'content' => $en])->assertSessionHasNoErrors();

        $ar = LandingContent::get('ar');
        $this->assertNotSame('English headline', $ar['hero']['title']);   // text stays per language
        $this->assertSame('+971 6 123 4567', $ar['brand']['phone']);       // shared value reached Arabic
        $this->assertFalse($ar['sections'][0]['enabled']);

        $ar['campaign']['offer_ends_at'] = '2027-01-15';
        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => LandingContent::version(), 'content' => $ar])->assertSessionHasNoErrors();
        $this->assertSame('2027-01-15', LandingContent::get('en')['campaign']['offer_ends_at']);
        $this->assertSame('English headline', LandingContent::get('en')['hero']['title']);
    }

    public function test_lead_validation_rejects_bad_phone(): void
    {
        $this->post('/leads', ['name' => 'Test', 'phone' => '12'])->assertSessionHasErrors('phone');
        $this->assertSame(0, Lead::count());
    }

    public function test_honeypot_submissions_are_silently_dropped(): void
    {
        $this->post('/leads', ['name' => 'Bot', 'phone' => '+971501234567', 'website' => 'spam.example'])
            ->assertSessionHas('lead_submitted', true);
        $this->assertSame(0, Lead::count());
    }

    public function test_lead_form_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/leads', ['name' => "Visitor {$i}", 'phone' => '+971501234567']);
        }
        $this->post('/leads', ['name' => 'Visitor 6', 'phone' => '+971501234567'])->assertStatus(429);
    }

    public function test_public_registration_is_disabled(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', ['name' => 'x', 'email' => 'x@example.com', 'password' => 'password', 'password_confirmation' => 'password'])->assertNotFound();
    }

    public function test_dashboard_pages_require_login(): void
    {
        foreach (['/dashboard', '/dashboard/leads', '/dashboard/content', '/dashboard/leads/export'] as $url) {
            $this->get($url)->assertRedirect('/login');
        }
    }

    public function test_admin_can_save_text_content_and_it_reaches_the_page(): void
    {
        $this->actingAs(User::factory()->create());
        $content = LandingContent::get();
        $content['hero']['cta_label'] = 'زر جديد';
        $content['brand']['email'] = ''; // empty inputs become null in Laravel — must be stored as ''

        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => LandingContent::version(), 'content' => $content])->assertSessionHasNoErrors();

        $saved = LandingContent::get();
        $this->assertSame('زر جديد', $saved['hero']['cta_label']);
        $this->assertSame('', $saved['brand']['email']);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('content.hero.cta_label', 'زر جديد'));
    }

    public function test_each_language_has_its_own_hero_photo(): void
    {
        $this->actingAs(User::factory()->create());

        $ar = LandingContent::get('ar');
        $ar['hero']['image'] = '/storage/uploads/hero-ar.jpg';
        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => LandingContent::version(), 'content' => $ar])->assertSessionHasNoErrors();

        $en = LandingContent::get('en');
        $this->assertNull($en['hero']['image']); // not copied from Arabic
        $en['hero']['image'] = '/storage/uploads/hero-en.jpg';
        $this->put('/dashboard/content', ['locale' => 'en', 'version' => LandingContent::version(), 'content' => $en])->assertSessionHasNoErrors();

        $this->get('/')->assertInertia(fn (Assert $p) => $p->where('content.hero.image', '/storage/uploads/hero-ar.jpg'))
            ->assertSee('content="'.url('/storage/uploads/hero-ar.jpg').'"', false); // share image follows the language
        $this->get('/en')->assertInertia(fn (Assert $p) => $p->where('content.hero.image', '/storage/uploads/hero-en.jpg'))
            ->assertSee('content="'.url('/storage/uploads/hero-en.jpg').'"', false);
    }

    public function test_plots_background_photo_is_shared_and_only_accepts_uploads(): void
    {
        $this->actingAs(User::factory()->create());

        $en = LandingContent::get('en');
        $en['plots']['image'] = '/storage/uploads/plots-bg-2560w.webp';
        $this->put('/dashboard/content', ['locale' => 'en', 'version' => LandingContent::version(), 'content' => $en])->assertSessionHasNoErrors();
        $this->assertSame('/storage/uploads/plots-bg-2560w.webp', LandingContent::get('ar')['plots']['image']);
        $this->get('/')->assertInertia(fn (Assert $p) => $p->where('content.plots.image', '/storage/uploads/plots-bg-2560w.webp'));

        $en['plots']['image'] = 'https://evil.example/bg.jpg';
        $this->put('/dashboard/content', ['locale' => 'en', 'version' => LandingContent::version(), 'content' => $en])->assertSessionHasErrors('content.plots.image');
    }

    public function test_pasted_tracking_ids_are_cleaned_up_before_saving(): void
    {
        $this->actingAs(User::factory()->create());
        $save = fn (array $values) => $this->put('/dashboard/integrations/tracking', $values);

        // lowercase + spaces
        $save(['gtm_id' => '  gtm-abc1234 '])->assertSessionHasNoErrors();
        $this->assertSame('GTM-ABC1234', TrackingSettings::get()['gtm_id']);

        // Google's full installation snippet, Meta's full pixel snippet
        $gtmSnippet = "<!-- Google Tag Manager --><script>(function(w,d,s,l,i){w[l]=w[l]||[];})(window,document,'script','dataLayer','GTM-XYZ9876');</script>";
        $metaSnippet = "<script>!function(f,b,e,v,n,t,s){n.version='2.0';}(window);fbq('init', '123456789012345');fbq('track', 'PageView');</script>";
        $save(['gtm_id' => $gtmSnippet, 'meta_pixel_id' => $metaSnippet])->assertSessionHasNoErrors();
        $this->assertSame('GTM-XYZ9876', TrackingSettings::get()['gtm_id']);
        $this->assertSame('123456789012345', TrackingSettings::get()['meta_pixel_id']);

        // Saved IDs reach the page on both languages
        $this->get('/en')->assertSee("'dataLayer','GTM-XYZ9876'", false)->assertSee("fbq('init','123456789012345')", false);
        $this->get('/')->assertSee("'dataLayer','GTM-XYZ9876'", false);

        // Values that would break out of the script tag, or aren't an ID at all, are refused
        $save(['gtm_id' => 'my container'])->assertSessionHasErrors('gtm_id');
        $save(['gtm_id' => "GTM-1');alert(1);//"])->assertSessionHasErrors('gtm_id');
    }

    public function test_saving_page_content_never_touches_tracking_settings(): void
    {
        $this->actingAs(User::factory()->create());
        TrackingSettings::save(['gtm_id' => 'GTM-KEEP123', 'lead_alert_email' => 'sales@example.com']);

        $ar = LandingContent::get('ar');
        $ar['hero']['cta_label'] = 'زر';
        $ar['tracking'] = ['gtm_id' => '']; // an old editor tab would still send this
        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => LandingContent::version(), 'content' => $ar])->assertSessionHasNoErrors();

        $this->assertSame('GTM-KEEP123', TrackingSettings::get()['gtm_id']);
        $this->assertSame('sales@example.com', TrackingSettings::get()['lead_alert_email']);
    }

    public function test_a_save_from_an_out_of_date_tab_is_refused_instead_of_overwriting(): void
    {
        $this->actingAs(User::factory()->create());
        $versionWhenTabOpened = LandingContent::version();

        // Meanwhile the English editor saves a shared value…
        $en = LandingContent::get('en');
        $en['brand']['phone'] = '+971 6 111 1111';
        $this->put('/dashboard/content', ['locale' => 'en', 'version' => LandingContent::version(), 'content' => $en])->assertSessionHasNoErrors();

        // …then the old Arabic tab (still holding the old phone) saves.
        $staleAr = LandingContent::defaults('ar');
        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => $versionWhenTabOpened, 'content' => $staleAr])
            ->assertSessionHasErrors('version');
        $this->assertSame('+971 6 111 1111', LandingContent::get('ar')['brand']['phone']);
    }

    public function test_tracking_ids_saved_in_the_old_place_are_recovered(): void
    {
        // Before this change the IDs lived inside the page content (here only in the English copy).
        Setting::create(['key' => 'landing_en', 'value' => ['tracking' => ['gtm_id' => 'GTM-T2RBJ9GM', 'meta_pixel_id' => ''], 'notifications' => ['email' => 'a@b.ae']]]);
        Setting::create(['key' => 'landing', 'value' => ['tracking' => ['gtm_id' => '', 'meta_pixel_id' => '']]]);

        $this->assertSame('GTM-T2RBJ9GM', TrackingSettings::get()['gtm_id']);
        $this->assertSame('a@b.ae', TrackingSettings::get()['lead_alert_email']);
        $this->get('/')->assertSee("'dataLayer','GTM-T2RBJ9GM'", false);
    }

    public function test_mobile_hero_photo_is_per_language_and_only_accepts_uploads(): void
    {
        $this->actingAs(User::factory()->create());

        $ar = LandingContent::get('ar');
        $ar['hero']['image_mobile'] = '/storage/uploads/hero-ar-m-1080w.webp';
        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => LandingContent::version(), 'content' => $ar])->assertSessionHasNoErrors();

        $this->assertSame('/storage/uploads/hero-ar-m-1080w.webp', LandingContent::get('ar')['hero']['image_mobile']);
        $this->assertNull(LandingContent::get('en')['hero']['image_mobile']); // not shared

        $ar['hero']['image_mobile'] = 'https://evil.example/x.jpg';
        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => LandingContent::version(), 'content' => $ar])->assertSessionHasErrors('content.hero.image_mobile');
    }

    public function test_content_cached_before_a_new_field_existed_is_never_served(): void
    {
        // Simulate a deploy: the cache still holds content built with an older set of fields.
        $old = LandingContent::get('ar');
        unset($old['hero']['image_mobile']);
        Cache::forever('landing_content_ar', $old);

        $this->get('/')->assertOk();
        $this->assertArrayHasKey('image_mobile', LandingContent::get('ar')['hero']);
    }

    public function test_lead_form_section_cannot_be_hidden(): void
    {
        $this->actingAs(User::factory()->create());
        $content = LandingContent::get();
        $content['sections'] = array_map(fn ($s) => ['key' => $s['key'], 'enabled' => false], $content['sections']);

        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => LandingContent::version(), 'content' => $content])->assertSessionHasNoErrors();

        $sections = collect(LandingContent::get()['sections'])->keyBy('key');
        $this->assertTrue($sections['final_cta']['enabled']);
        $this->assertFalse($sections['faq']['enabled']);
        $this->assertTrue(collect(LandingContent::get('en')['sections'])->keyBy('key')['final_cta']['enabled']);
    }

    public function test_content_validation_blocks_script_injection_in_tracking_and_map(): void
    {
        $this->actingAs(User::factory()->create());
        $content = LandingContent::get();
        $content['location']['map_embed_url'] = 'javascript:alert(1)';
        $content['hero']['image'] = 'https://evil.example/x.png';

        $this->put('/dashboard/content', ['locale' => 'ar', 'version' => LandingContent::version(), 'content' => $content])
            ->assertSessionHasErrors(['content.location.map_embed_url', 'content.hero.image']);
    }

    public function test_upload_converts_to_webp_with_responsive_copies_and_rejects_svg(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->create());

        $url = $this->postJson('/dashboard/uploads', ['file' => UploadedFile::fake()->image('hero.jpg', 3000, 1500)])
            ->assertOk()->json('url');

        $this->assertMatchesRegularExpression('#^/storage/uploads/[a-z0-9]+-2560w\.webp$#', $url); // capped at 2560px
        $base = substr($url, strlen('/storage/'), -strlen('-2560w.webp'));
        foreach ([640, 1280, 1920] as $w) {
            Storage::disk('public')->assertExists("{$base}-{$w}w.webp");
        }
        [$width] = getimagesizefromstring(Storage::disk('public')->get("{$base}-640w.webp"));
        $this->assertSame(640, $width);

        $this->postJson('/dashboard/uploads', ['file' => UploadedFile::fake()->create('x.svg', 2, 'image/svg+xml')])
            ->assertStatus(422);
    }

    public function test_small_images_are_not_upscaled(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->create());

        $url = $this->postJson('/dashboard/uploads', ['file' => UploadedFile::fake()->image('logo.png', 300, 88)])->json('url');
        $this->assertStringEndsWith('-300w.webp', $url);
        $this->assertCount(1, Storage::disk('public')->files('uploads'));
    }

    public function test_landing_html_is_crawlable_with_structured_data_and_social_tags(): void
    {
        $html = $this->get('/en')->assertOk()->getContent();

        $this->assertStringContainsString('<meta property="og:site_name" content="Al Rasikhoon Real Estate">', $html);
        $this->assertStringContainsString('<link rel="icon" href="/favicon.ico"', $html);
        $this->assertStringNotContainsString('const Ziggy', $html); // route list is not exposed on the public page

        preg_match('#<script type="application/ld\+json">(.+?)</script>#s', $html, $m);
        $schema = json_decode($m[1], true);
        $types = array_column($schema['@graph'], '@type');
        $this->assertSame(['RealEstateAgent', 'WebPage', 'FAQPage'], $types);
        // FAQ entries that still contain "[placeholder]" answers are left out
        $this->assertStringNotContainsString('[Add answer]', $m[1]);
    }

    public function test_robots_blocks_indexing_outside_production_and_sitemap_lists_both_languages(): void
    {
        $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /');

        $this->app['env'] = 'production';
        $this->get('/robots.txt')->assertSee('Disallow: /dashboard')->assertSee('Sitemap: '.url('/sitemap.xml'));

        $this->get('/sitemap.xml')->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
            ->assertSee('<loc>'.url('/en').'</loc>', false)
            ->assertSee('hreflang="ar"', false);
    }

    public function test_admin_can_update_lead_status_and_export_csv(): void
    {
        $this->actingAs(User::factory()->create());
        $lead = Lead::create(['name' => '=HYPERLINK("x")', 'phone' => '+971501234567']);

        $this->patch("/dashboard/leads/{$lead->id}", ['status' => 'contacted', 'notes' => 'Called'])->assertRedirect();
        $this->assertSame('contacted', $lead->fresh()->status);

        $csv = $this->get('/dashboard/leads/export')->assertOk()->streamedContent();
        $this->assertStringContainsString("'=HYPERLINK", $csv); // formula injection neutralised
    }
}

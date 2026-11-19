<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ZapierTest extends TestCase
{
    use RefreshDatabase;

    private const HOOK = 'https://hooks.zapier.com/hooks/catch/1/abc/';

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        RateLimiter::clear('leads');
    }

    private function submitLead(array $extra = []): void
    {
        $this->post('/leads', [
            'name' => 'Sara Al Mansoori',
            'phone' => '+971 50 123 4567',
            'plot_type' => 'تاون هاوس',
            'payment_method' => 'كاش (خصم 35%)',
            'attribution' => ['utm_source' => 'facebook', 'utm_campaign' => 'eid55', 'fbclid' => 'fb-1'],
            ...$extra,
        ])->assertSessionHasNoErrors();
    }

    public function test_new_lead_is_sent_to_zapier_with_ad_attribution_when_enabled(): void
    {
        Http::fake([self::HOOK => Http::response(['status' => 'success'])]);
        Setting::putZapier(self::HOOK, true);

        $this->submitLead(['locale' => 'en']);

        Http::assertSent(fn (Request $r) => $r->url() === self::HOOK
            && $r['name'] === 'Sara Al Mansoori'
            && $r['mobile'] === '+971 50 123 4567'
            && $r['plot_type'] === 'تاون هاوس'
            && $r['language'] === 'en'
            && $r['utm_campaign'] === 'eid55'
            && $r['fbclid'] === 'fb-1'
            && $r['page_url'] === url('/en'));

        $lead = Lead::sole();
        $this->assertSame('sent', $lead->zapier_status);
        $this->assertNotNull($lead->zapier_sent_at);
    }

    public function test_nothing_is_sent_when_disabled(): void
    {
        Http::fake();
        Setting::putZapier(self::HOOK, false);

        $this->submitLead();

        Http::assertNothingSent();
        $this->assertNull(Lead::sole()->zapier_status);
    }

    public function test_failed_delivery_is_recorded_and_can_be_resent_from_the_dashboard(): void
    {
        Setting::putZapier(self::HOOK, true);
        Http::fake([self::HOOK => Http::sequence()->pushStatus(500)->pushStatus(500)->pushStatus(500)->pushStatus(200)]);

        $this->submitLead();
        $lead = Lead::sole();
        $this->assertSame('failed', $lead->zapier_status);
        $this->assertNotEmpty($lead->zapier_error);

        $this->actingAs(User::factory()->create())
            ->post("/dashboard/leads/{$lead->id}/zapier")
            ->assertRedirect()
            ->assertSessionHas('success', 'Lead sent to Zapier.');
        $this->assertSame('sent', $lead->refresh()->zapier_status);
    }

    public function test_admin_can_manage_zapier_settings(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->put('/dashboard/integrations', ['webhook_url' => 'not-a-url', 'enabled' => true])
            ->assertSessionHasErrors('webhook_url');
        $this->actingAs($admin)->put('/dashboard/integrations', ['webhook_url' => 'http://hooks.zapier.com/x', 'enabled' => true])
            ->assertSessionHasErrors('webhook_url'); // https only
        $this->actingAs($admin)->put('/dashboard/integrations', ['webhook_url' => '', 'enabled' => true])
            ->assertSessionHasErrors('webhook_url'); // URL required to switch on

        $this->actingAs($admin)->put('/dashboard/integrations', ['webhook_url' => self::HOOK, 'enabled' => true])
            ->assertSessionHasNoErrors();
        $this->assertSame(self::HOOK, Setting::zapierWebhookUrl());

        $this->actingAs($admin)->get('/dashboard/integrations')->assertInertia(fn (Assert $page) => $page
            ->component('admin/integrations')
            ->where('zapier.webhook_url', self::HOOK)
            ->where('zapier.enabled', true));

        $this->actingAs($admin)->put('/dashboard/integrations', ['webhook_url' => self::HOOK, 'enabled' => false]);
        $this->assertNull(Setting::zapierWebhookUrl());
    }

    public function test_test_button_sends_a_sample_lead_without_saving_anything(): void
    {
        Http::fake([self::HOOK => Http::response(['status' => 'success'])]);

        $this->actingAs(User::factory()->create())
            ->post('/dashboard/integrations/test', ['webhook_url' => self::HOOK])
            ->assertSessionHasNoErrors();

        Http::assertSent(fn (Request $r) => $r['name'] === 'Test Lead' && $r['utm_source'] === 'zapier-test');
        $this->assertSame(0, Lead::count());
    }

    public function test_zapier_pages_require_login(): void
    {
        $this->get('/dashboard/integrations')->assertRedirect('/login');
        $this->put('/dashboard/integrations', ['webhook_url' => self::HOOK, 'enabled' => true])->assertRedirect('/login');
        $this->post('/dashboard/integrations/test', ['webhook_url' => self::HOOK])->assertRedirect('/login');
    }
}

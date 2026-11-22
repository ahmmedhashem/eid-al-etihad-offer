<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * Landing page content, one JSON document per language (settings.key = "landing" for Arabic,
 * "landing_en" for English).
 *
 * - Stored values are merged over the defaults one level deep; lists are replaced as a whole.
 * - SHARED paths (images, phone, dates, pixels, section order...) are language-independent:
 *   Arabic is their source of truth, and saving them from the English editor writes them to Arabic.
 */
class LandingContent
{
    public const LOCALES = ['ar', 'en'];

    /** Sections that can be reordered / hidden from the dashboard (hero and footer are fixed). */
    public const SECTION_KEYS = [
        'trust', 'offers', 'project', 'plots', 'payment', 'gallery',
        'amenities', 'location', 'experience', 'final_cta', 'faq',
    ];

    /** Sections that can be reordered but never hidden: the final section holds the page's only lead form. */
    public const ALWAYS_ON = ['final_cta'];

    public const AMENITY_ICONS = ['store', 'bag', 'clinic', 'mosque', 'tree', 'school', 'gym', 'parking', 'road', 'shield'];

    /** Language-independent values. "*" matches every item of a list (copied by position). */
    public const SHARED = [
        'brand.logo', 'brand.phone', 'brand.email', 'brand.license_no',
        'campaign.offer_ends_at', 'campaign.show_countdown', 'campaign.cobrand_logo',
        'seo.og_image',
        'project.image', 'plots.image', 'gallery.images',
        'location.map_embed_url', 'location.map_link',
        'experience.projects.*.image', 'amenities.items.*.icon', 'payment.plans.*.highlight',
        'sections',
    ];

    /** Fields that are legitimately null when empty; every other empty value is stored as "". */
    private const NULLABLE_KEYS = ['logo', 'cobrand_logo', 'og_image', 'image', 'image_mobile', 'url', 'offer_ends_at'];

    public static function get(string $locale = 'ar'): array
    {
        $locale = self::locale($locale);

        return Cache::rememberForever(self::cacheKey($locale), function () use ($locale) {
            $ar = self::withValidSections(self::merge(self::defaults('ar'), self::stored('ar')));
            if ($locale === 'ar') {
                return $ar;
            }

            return self::applyShared(self::merge(self::defaults($locale), self::stored($locale)), $ar);
        });
    }

    public static function save(array $content, string $locale = 'ar'): array
    {
        $locale = self::locale($locale);
        $merged = self::normalize(self::merge(self::defaults($locale), $content));
        self::store($locale, $merged);

        if ($locale !== 'ar') {
            // Shared values edited from another language are written to the Arabic source of truth.
            $ar = self::merge(self::defaults('ar'), self::stored('ar'));
            self::store('ar', self::applyShared($ar, $merged));
        }

        foreach (self::LOCALES as $l) {
            Cache::forget(self::cacheKey($l));
        }

        return self::get($locale);
    }

    public static function reset(string $locale = 'ar'): array
    {
        Setting::where('key', self::settingKey(self::locale($locale)))->delete();
        foreach (self::LOCALES as $l) {
            Cache::forget(self::cacheKey($l));
        }

        return self::get($locale);
    }

    /** Content for the public page. Tracking IDs and lead alerts live in TrackingSettings. */
    public static function forPublic(string $locale = 'ar'): array
    {
        return self::get($locale);
    }

    /**
     * Fingerprint of everything stored for both languages. The editor sends back the version it loaded,
     * and a save is refused if the content changed since — so an older browser tab (or another admin)
     * can't silently overwrite newer changes, including the fields shared by both languages.
     */
    public static function version(): string
    {
        return md5(json_encode([self::stored('ar'), self::stored('en')]));
    }

    public static function defaults(string $locale = 'ar'): array
    {
        return self::locale($locale) === 'en' ? EnglishContent::defaults() : self::arabicDefaults();
    }

    private static function locale(string $locale): string
    {
        return in_array($locale, self::LOCALES, true) ? $locale : 'ar';
    }

    private static function settingKey(string $locale): string
    {
        return $locale === 'ar' ? 'landing' : "landing_{$locale}";
    }

    /**
     * The key includes a fingerprint of the defaults, so a deploy that adds or changes content fields
     * never serves an older cached shape (which would miss the new keys).
     */
    private static function cacheKey(string $locale): string
    {
        static $fingerprint = [];
        $fingerprint[$locale] ??= substr(md5(serialize([self::defaults('ar'), self::defaults($locale), self::SHARED])), 0, 12);

        return "landing_content_{$locale}_{$fingerprint[$locale]}";
    }

    private static function stored(string $locale): array
    {
        $value = Setting::where('key', self::settingKey($locale))->value('value');

        return is_array($value) ? $value : [];
    }

    private static function store(string $locale, array $value): void
    {
        Setting::updateOrCreate(['key' => self::settingKey($locale)], ['value' => $value]);
    }

    /** Keeps known sections only, appends any missing ones, and forces ALWAYS_ON sections visible. */
    private static function withValidSections(array $content): array
    {
        $seen = [];
        $sections = [];
        foreach ($content['sections'] ?? [] as $s) {
            $key = $s['key'] ?? null;
            if (! in_array($key, self::SECTION_KEYS, true) || isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $sections[] = ['key' => $key, 'enabled' => in_array($key, self::ALWAYS_ON, true) || (bool) ($s['enabled'] ?? true)];
        }
        foreach (self::SECTION_KEYS as $key) {
            if (! isset($seen[$key])) {
                $sections[] = ['key' => $key, 'enabled' => true];
            }
        }
        $content['sections'] = $sections;

        return $content;
    }

    /** Copies every SHARED path from $source into $target. */
    private static function applyShared(array $target, array $source): array
    {
        foreach (self::SHARED as $path) {
            $target = self::copyPath($target, $source, explode('.', $path));
        }

        return $target;
    }

    private static function copyPath(array $target, array $source, array $segments): array
    {
        $seg = array_shift($segments);

        if ($seg === '*') {
            foreach ($target as $i => $item) {
                if (is_array($item) && isset($source[$i]) && is_array($source[$i])) {
                    $target[$i] = self::copyPath($item, $source[$i], $segments);
                }
            }

            return $target;
        }
        if (! array_key_exists($seg, $source)) {
            return $target;
        }
        if ($segments === []) {
            $target[$seg] = $source[$seg];

            return $target;
        }
        if (isset($target[$seg]) && is_array($target[$seg]) && is_array($source[$seg])) {
            $target[$seg] = self::copyPath($target[$seg], $source[$seg], $segments);
        }

        return $target;
    }

    /** Laravel turns empty inputs into null; keep text fields as strings so the page never renders null. */
    private static function normalize(mixed $value, string|int|null $key = null): mixed
    {
        if (is_array($value)) {
            foreach ($value as $k => $v) {
                $value[$k] = self::normalize($v, $k);
            }

            return $value;
        }
        if ($value === null && ! in_array($key, self::NULLABLE_KEYS, true)) {
            return '';
        }

        return $value;
    }

    private static function merge(array $defaults, array $stored): array
    {
        $result = $defaults;
        foreach ($stored as $section => $value) {
            if (! array_key_exists($section, $defaults)) {
                continue; // ignore unknown sections
            }
            if (is_array($value) && is_array($defaults[$section]) && ! array_is_list($defaults[$section])) {
                $result[$section] = array_merge($defaults[$section], array_intersect_key($value, $defaults[$section]));
            } else {
                $result[$section] = $value;
            }
        }

        return $result;
    }

    private static function arabicDefaults(): array
    {
        return [
            'brand' => [
                'name' => 'الراسخون للعقارات',
                'name_en' => 'AL RASIKHOON REAL ESTATE',
                'logo' => null,
                'phone' => '+971 6 000 0000',
                'email' => '',
                'address' => '[عنوان المكتب]، عجمان',
                'license_no' => '[..]',
            ],
            'seo' => [
                'title' => 'قطع أراضي على طريق مليحة بدون دفعة أولى | الراسخون للعقارات',
                'description' => 'قطع سكنية استثمارية وتاون هاوس بتصريح G+2 في الشارقة. خصم 35% عند الدفع كاش أو أقساط مباشرة مع المطوّر بدون بنك — عروض عيد الاتحاد.',
                'og_image' => null,
            ],
            'campaign' => [
                'badge' => 'عروض عيد الاتحاد 55  •  لفترة محدودة',
                'offer_ends_at' => '2026-12-31',
                'show_countdown' => true,
                'cobrand_logo' => null,
            ],
            'hero' => [
                'title' => "امتلك قطعتك على طريق مليحة\nبدون دفعة أولى",
                'subtitle' => 'قطع سكنية استثمارية وتاون هاوس بتصريح بناء G+2 في الشارقة — خصم 35% عند الدفع كاش، أو أقساط مباشرة مع المطوّر بدون بنك.',
                'chips' => ['خصم 35% كاش', 'بدون دفعة أولى', 'تصريح G+2', 'بدون بنك'],
                'cta_label' => 'احصل على الأسعار والمساحات',
                'image' => null, // per language: each page can use its own hero photo
                'image_mobile' => null, // optional portrait version for phones (per language)
            ],
            'stats' => [
                ['value' => 'منذ 2002', 'label' => 'خبرة في السوق العقاري'],
                ['value' => '40+', 'label' => 'مشروعًا في الشارقة وعجمان'],
                ['value' => '5 نجوم', 'label' => 'تصنيف Bliss – دائرة الأراضي'],
                ['value' => 'رخصة [رقم]', 'label' => 'مطوّر مرخّص في عجمان'],
            ],
            'offers' => [
                'eyebrow' => 'عروض عيد الاتحاد',
                'title' => 'اختر العرض الأنسب لك',
                'items' => [
                    ['tag' => 'أفضل سعر', 'big' => 'خصم 35%', 'title' => 'عند الدفع كاش', 'body' => 'وفّر على سعر القطعة بالكامل خلال فترة العرض.'],
                    ['tag' => 'أسهل بداية', 'big' => 'بدون دفعة أولى', 'title' => 'أقساط مباشرة مع المطوّر', 'body' => 'ابدأ بامتلاك قطعتك بدون بنك. مدة السداد: [مدة السداد].'],
                ],
                'urgency_title' => 'العرض ساري حتى نهاية عروض عيد الاتحاد',
                'urgency_body' => 'القطع المتاحة محدودة — الأولوية لمن يسجّل أولًا.',
                'urgency_cta' => 'احجز قطعتك الآن',
            ],
            'project' => [
                'eyebrow' => 'عن المشروع',
                'title' => 'مجتمع متكامل للسكن والاستثمار',
                'body' => 'يقدّم مشروع بساتين البليدة مجموعة متنوعة من القطع المخصصة للتطوير السكني والاستثماري، بتصريح بناء أرضي + طابقين (G+2). يضم المشروع قطعًا سكنية تجارية وقطع تاون هاوس، ضمن مخطط عام متكامل يمنحك أكثر من خيار لبناء منزلك أو الاستثمار العقاري.',
                'features' => [
                    ['title' => 'خيارات تطوير متعددة', 'body' => 'سكني، سكني تجاري أو تاون هاوس، بحسب خطتك.'],
                    ['title' => 'تصريح بناء G+2', 'body' => 'أرضي + طابقين.'],
                    ['title' => 'شبكة طرق داخلية منظمة', 'body' => 'حركة سهلة داخل المشروع.'],
                    ['title' => 'مخطط سكني متكامل', 'body' => 'مجتمع مخطط بعناية.'],
                    ['title' => 'مرافق وخدمات موزعة', 'body' => 'كل ما تحتاجه قريب منك.'],
                ],
                'cta_label' => 'احصل على المخطط العام للمشروع',
                'image' => null,
            ],
            'plots' => [
                'eyebrow' => 'أنواع القطع',
                'title' => 'اختر القطعة المناسبة لخطتك',
                'subtitle' => 'قطعتان بتصريح G+2 — اختر بحسب هدفك: السكن أو العائد الاستثماري.',
                'items' => [
                    ['name' => 'سكني استثماري', 'description' => 'قطع مناسبة لبناء مشروع سكني بغرض العائد.', 'area' => '225 م²', 'permit' => 'G+2', 'count' => '[عدد]'],
                    ['name' => 'تاون هاوس', 'description' => 'قطع مخصصة لبناء وحدات تاون هاوس.', 'area' => '160 م²', 'permit' => 'G+2', 'count' => '[عدد]'],
                ],
                'cta_label' => 'اطلب أسعار هذه القطع',
                'image' => null, // optional section background photo (shared by both languages)
            ],
            'payment' => [
                'eyebrow' => 'خطة الدفع',
                'title' => 'اختر طريقة الدفع التي تناسبك',
                'subtitle' => 'نفس القطعة، طريقتان للدفع — قارن واختر.',
                'plans' => [
                    [
                        'title' => 'الدفع كاش', 'tag' => 'الأوفر', 'highlight' => true, 'cta_label' => 'احجز بخصم 35%',
                        'rows' => [
                            ['label' => 'الدفعة الأولى', 'value' => 'كامل المبلغ'],
                            ['label' => 'العرض', 'value' => 'خصم 35% على سعر القطعة'],
                            ['label' => 'مناسبة لـ', 'value' => 'من يريد أفضل سعر'],
                        ],
                    ],
                    [
                        'title' => 'التقسيط', 'tag' => 'الأسهل', 'highlight' => false, 'cta_label' => 'اطلب جدول الأقساط',
                        'rows' => [
                            ['label' => 'الدفعة الأولى', 'value' => 'بدون دفعة أولى'],
                            ['label' => 'العرض', 'value' => 'أقساط مباشرة مع الشركة بدون بنك — المدة: [مدة السداد]'],
                            ['label' => 'مناسبة لـ', 'value' => 'من يريد البدء بسهولة'],
                        ],
                    ],
                ],
            ],
            'gallery' => [
                'eyebrow' => 'صور المشروع',
                'title' => 'شاهد المشروع عن قرب',
                'cta_label' => 'احجز زيارة للموقع',
                'images' => [],
            ],
            'amenities' => [
                'eyebrow' => 'المرافق',
                'title' => 'مرافق وخدمات داخل المجتمع',
                'subtitle' => 'مرافق وخدمات موزعة في أرجاء المشروع، قريبة من كل قطعة.',
                'items' => [
                    ['label' => 'مناطق خدمات', 'icon' => 'store'],
                    ['label' => 'محلات تجارية', 'icon' => 'bag'],
                    ['label' => 'عيادات', 'icon' => 'clinic'],
                    ['label' => 'مساجد', 'icon' => 'mosque'],
                    ['label' => 'حدائق عامة', 'icon' => 'tree'],
                ],
            ],
            'location' => [
                'eyebrow' => 'الموقع',
                'title' => 'موقع استراتيجي على طريق مليحة',
                'body' => 'يقع المشروع مباشرة على طريق مليحة في إمارة الشارقة، مع سهولة الوصول إلى شارع الإمارات، ما يوفر ربطًا ممتازًا بشبكة الطرق الرئيسية والمناطق المحيطة.',
                'drive_times' => [
                    ['place' => 'شارع الإمارات', 'minutes' => '[..]'],
                    ['place' => 'مطار الشارقة الدولي', 'minutes' => '[..]'],
                    ['place' => 'مدينة الشارقة', 'minutes' => '[..]'],
                    ['place' => 'عجمان', 'minutes' => '[..]'],
                ],
                'map_embed_url' => '',
                'map_link' => '',
                'cta_label' => 'افتح الموقع في خرائط Google',
            ],
            'experience' => [
                'eyebrow' => 'من نحن',
                'title' => '24 عامًا من الخبرة و40+ مشروعًا',
                'body' => 'تأسست الشركة في [10 يونيو 2002]، ونفّذت أكثر من 40 مشروعًا في الشارقة وعجمان، وهي حاصلة على تصنيف 5 نجوم Bliss من دائرة الأراضي والتنظيم العقاري في عجمان. رخصة الشركة رقم [..].',
                'projects' => [
                    ['name' => '[اسم المشروع]', 'meta' => '[المدينة] • [سنة التسليم]', 'image' => null],
                    ['name' => '[اسم المشروع]', 'meta' => '[المدينة] • [سنة التسليم]', 'image' => null],
                    ['name' => '[اسم المشروع]', 'meta' => '[المدينة] • [سنة التسليم]', 'image' => null],
                ],
                'testimonials' => [
                    ['quote' => '[رأي العميل — جملة أو جملتان عن تجربته مع الشركة]', 'name' => '[اسم العميل]', 'project' => '[اسم المشروع]'],
                    ['quote' => '[رأي العميل — جملة أو جملتان عن تجربته مع الشركة]', 'name' => '[اسم العميل]', 'project' => '[اسم المشروع]'],
                    ['quote' => '[رأي العميل — جملة أو جملتان عن تجربته مع الشركة]', 'name' => '[اسم العميل]', 'project' => '[اسم المشروع]'],
                ],
            ],
            'form' => [
                'title' => 'سجّل اهتمامك الآن',
                'subtitle' => 'اترك بياناتك وسيتواصل معك مستشارنا خلال [مدة] بقائمة الأسعار والقطع المتاحة.',
                'final_eyebrow' => 'عروض عيد الاتحاد',
                'final_title' => "سجّل اهتمامك واحجز قطعتك\nقبل انتهاء العرض",
                'final_body' => 'اترك بياناتك وسيتواصل معك أحد مستشارينا خلال [مدة] بقائمة الأسعار والمساحات المتاحة.',
                'final_form_title' => 'احجز قطعتك الآن',
                'benefits' => ['قائمة أسعار ومساحات محدّثة', 'استشارة مجانية بدون أي التزام', 'زيارة للموقع بالموعد الذي يناسبك'],
                'plot_options' => ['سكني استثماري', 'تاون هاوس', 'لم أقرر بعد'],
                'payment_options' => ['كاش (خصم 35%)', 'تقسيط بدون دفعة أولى', 'لم أقرر بعد'],
                'submit_label' => 'أرسل لي الأسعار والمساحات',
                'consent' => 'بإرسال النموذج توافق على سياسة الخصوصية وعلى تواصلنا معك هاتفيًا.',
                'success_title' => 'شكرًا لك! تم استلام طلبك',
                'success_body' => 'سيتواصل معك أحد مستشارينا قريبًا بقائمة الأسعار والمساحات المتاحة.',
            ],
            'faq' => [
                'eyebrow' => 'الأسئلة الشائعة',
                'title' => 'كل ما تريد معرفته قبل الحجز',
                'items' => [
                    ['q' => 'ما معنى تصريح G+2؟', 'a' => 'يعني تصريح البناء أرضي + طابقين، أي يمكنك بناء ثلاثة مستويات على القطعة.'],
                    ['q' => 'هل توجد دفعة أولى في خطة الأقساط؟', 'a' => 'لا، يمكنك البدء بدون دفعة أولى والسداد بأقساط مباشرة مع الشركة.'],
                    ['q' => 'ما الخصم المتاح للدفع كاش؟', 'a' => 'خصم 35% على سعر القطعة عند الدفع كاش خلال فترة العرض.'],
                    ['q' => 'أين يقع المشروع؟', 'a' => 'على طريق مليحة في إمارة الشارقة، بالقرب من شارع الإمارات.'],
                    ['q' => 'ما أنواع القطع المتاحة؟', 'a' => 'قطع سكنية استثمارية وقطع تاون هاوس، جميعها بتصريح G+2.'],
                    ['q' => 'هل الأقساط عبر بنك؟', 'a' => 'لا، الأقساط مباشرة مع الشركة بدون بنك.'],
                    ['q' => 'هل أعرف الأسعار قبل زيارة المشروع؟', 'a' => 'نعم، سجّل بياناتك وسنرسل لك قائمة الأسعار والمساحات المتاحة.'],
                    ['q' => 'هل تُسجَّل القطعة باسمي؟ وما نوع الملكية؟', 'a' => '[أضف الإجابة]'],
                    ['q' => 'هل يحق لغير المواطنين التملّك؟', 'a' => '[أضف الإجابة]'],
                    ['q' => 'هل يشمل خصم 35% جميع القطع؟', 'a' => '[أضف الإجابة]'],
                    ['q' => 'هل توجد رسوم إضافية؟', 'a' => '[أضف الإجابة]'],
                ],
                'more_label' => 'لديك سؤال آخر؟',
                'more_cta' => 'تواصل مع مستشار',
            ],
            'footer' => [
                'about' => 'مطوّر عقاري مرخّص منذ 2002 — أكثر من 40 مشروعًا في الشارقة وعجمان.',
                'disclaimer' => 'العروض والأسعار خاضعة للتوفّر وقد تتغيّر دون إشعار.',
            ],
            'sections' => array_map(fn ($k) => ['key' => $k, 'enabled' => true], self::SECTION_KEYS),
        ];
    }
}

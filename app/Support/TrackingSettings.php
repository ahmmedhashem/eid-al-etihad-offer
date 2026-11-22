<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * Ad-pixel IDs and the lead-alert email, edited on Dashboard → Integrations.
 *
 * Kept in their own setting (not in the per-language page content) so that saving page text — possibly
 * from an older browser tab — can never wipe them. Values previously saved inside the page content are
 * picked up automatically the first time this is read.
 */
class TrackingSettings
{
    public const FIELDS = ['gtm_id', 'meta_pixel_id', 'tiktok_pixel_id', 'snap_pixel_id', 'lead_alert_email'];

    private const KEY = 'tracking';

    private const CACHE_KEY = 'tracking_settings';

    /** @return array<string, string> */
    public static function get(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            $stored = Setting::where('key', self::KEY)->value('value');

            return self::complete(is_array($stored) ? $stored : self::fromLegacyContent());
        });
    }

    public static function save(array $values): array
    {
        $values = self::complete($values);
        Setting::updateOrCreate(['key' => self::KEY], ['value' => $values]);
        Cache::forget(self::CACHE_KEY);

        return $values;
    }

    /**
     * People paste tracking IDs in many shapes: lowercase, with spaces, or the whole installation
     * snippet from Google/Meta/TikTok/Snap. Keep just the ID so the strict rules accept it.
     */
    public static function normalize(array $input): array
    {
        $extract = function (mixed $value, string $pattern, bool $upper = false): mixed {
            if (! is_string($value) || trim($value) === '') {
                return $value;
            }
            $value = trim($upper ? strtoupper($value) : $value);

            return preg_match($pattern, $value, $m) ? ($m[1] ?? $m[0]) : $value;
        };

        $input['gtm_id'] = $extract($input['gtm_id'] ?? null, '/GTM-[A-Z0-9]{4,12}/', upper: true);
        $input['meta_pixel_id'] = $extract($input['meta_pixel_id'] ?? null, '/\d{6,20}/');
        $input['tiktok_pixel_id'] = is_string($input['tiktok_pixel_id'] ?? null) && str_contains($input['tiktok_pixel_id'], 'ttq.load')
            ? $extract($input['tiktok_pixel_id'], "/ttq\\.load\\(\\s*['\"]([A-Za-z0-9]+)['\"]/")
            : $extract($input['tiktok_pixel_id'] ?? null, '/^[A-Z0-9]+$/', upper: true);
        $input['snap_pixel_id'] = $extract($input['snap_pixel_id'] ?? null, '/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i');
        $input['lead_alert_email'] = is_string($input['lead_alert_email'] ?? null) ? trim($input['lead_alert_email']) : ($input['lead_alert_email'] ?? null);

        return $input;
    }

    /** Values injected into <script> tags are strictly validated. */
    public static function rules(): array
    {
        return [
            'gtm_id' => ['nullable', 'regex:/^GTM-[A-Z0-9]{4,12}$/'],
            'meta_pixel_id' => ['nullable', 'regex:/^[0-9]{6,20}$/'],
            'tiktok_pixel_id' => ['nullable', 'regex:/^[A-Z0-9]{10,30}$/'],
            'snap_pixel_id' => ['nullable', 'regex:/^[a-f0-9\-]{20,40}$/i'],
            'lead_alert_email' => ['nullable', 'email', 'max:190'],
        ];
    }

    public static function messages(): array
    {
        return [
            'gtm_id.regex' => 'Couldn’t find a Google Tag Manager ID here. Paste the ID shown at the top of GTM, e.g. GTM-ABC1234.',
            'meta_pixel_id.regex' => 'Couldn’t find a Meta Pixel ID here (digits only, e.g. 123456789012345).',
            'tiktok_pixel_id.regex' => 'Couldn’t find a TikTok Pixel ID here (letters and digits, e.g. C1A2B3C4D5E6F7G8H9).',
            'snap_pixel_id.regex' => 'Couldn’t find a Snapchat Pixel ID here (e.g. 1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e6f).',
        ];
    }

    /** First non-empty value per field from the old place (inside the Arabic, then English page content). */
    private static function fromLegacyContent(): array
    {
        $values = [];
        foreach (['landing', 'landing_en'] as $key) {
            $doc = Setting::where('key', $key)->value('value');
            if (! is_array($doc)) {
                continue;
            }
            $legacy = [...(is_array($doc['tracking'] ?? null) ? $doc['tracking'] : []), 'lead_alert_email' => $doc['notifications']['email'] ?? ''];
            foreach (self::FIELDS as $field) {
                if (($values[$field] ?? '') === '' && is_string($legacy[$field] ?? null) && $legacy[$field] !== '') {
                    $values[$field] = $legacy[$field];
                }
            }
        }

        return $values;
    }

    private static function complete(array $values): array
    {
        $out = [];
        foreach (self::FIELDS as $field) {
            $out[$field] = is_string($values[$field] ?? null) ? $values[$field] : '';
        }

        return $out;
    }
}

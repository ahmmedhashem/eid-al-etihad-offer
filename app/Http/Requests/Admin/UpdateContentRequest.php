<?php

namespace App\Http\Requests\Admin;

use App\Support\LandingContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * People paste tracking IDs in many shapes: lowercase, with spaces, or Google's/Meta's whole
     * installation snippet. Keep just the ID so the strict rules below accept it.
     */
    protected function prepareForValidation(): void
    {
        $content = $this->input('content');
        if (! is_array($content) || ! is_array($content['tracking'] ?? null)) {
            return;
        }
        $t = $content['tracking'];
        $extract = function (mixed $value, string $pattern, bool $upper = false): mixed {
            if (! is_string($value) || trim($value) === '') {
                return $value;
            }
            $value = trim($upper ? strtoupper($value) : $value);

            return preg_match($pattern, $value, $m) ? ($m[1] ?? $m[0]) : $value;
        };

        $t['gtm_id'] = $extract($t['gtm_id'] ?? null, '/GTM-[A-Z0-9]{4,12}/', upper: true);
        $t['meta_pixel_id'] = $extract($t['meta_pixel_id'] ?? null, '/\d{6,20}/');
        $t['tiktok_pixel_id'] = is_string($t['tiktok_pixel_id'] ?? null) && str_contains($t['tiktok_pixel_id'], 'ttq.load')
            ? $extract($t['tiktok_pixel_id'], "/ttq\.load\(\s*['\"]([A-Za-z0-9]+)['\"]/")
            : $extract($t['tiktok_pixel_id'] ?? null, '/^[A-Z0-9]+$/', upper: true);
        $t['snap_pixel_id'] = $extract($t['snap_pixel_id'] ?? null, '/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i');

        $content['tracking'] = $t;
        $this->merge(['content' => $content]);
    }

    public function rules(): array
    {
        $image = ['nullable', 'string', 'max:500', 'regex:#^/storage/uploads/[A-Za-z0-9._-]+$#'];

        return [
            'locale' => ['required', Rule::in(LandingContent::LOCALES)],
            'content' => ['required', 'array'],
            'content.*' => ['array'],

            // Values injected into <script>/<iframe> tags are strictly validated.
            'content.tracking.gtm_id' => ['nullable', 'regex:/^GTM-[A-Z0-9]{4,12}$/'],
            'content.tracking.meta_pixel_id' => ['nullable', 'regex:/^[0-9]{6,20}$/'],
            'content.tracking.tiktok_pixel_id' => ['nullable', 'regex:/^[A-Z0-9]{10,30}$/'],
            'content.tracking.snap_pixel_id' => ['nullable', 'regex:/^[a-f0-9\-]{20,40}$/i'],
            'content.location.map_embed_url' => ['nullable', 'url', 'starts_with:https://www.google.com/maps/embed'],
            'content.location.map_link' => ['nullable', 'url', 'starts_with:https://'],
            'content.notifications.email' => ['nullable', 'email'],
            'content.brand.email' => ['nullable', 'email'],
            'content.campaign.offer_ends_at' => ['nullable', 'date_format:Y-m-d'],
            'content.campaign.show_countdown' => ['boolean'],

            'content.brand.logo' => $image,
            'content.campaign.cobrand_logo' => $image,
            'content.seo.og_image' => $image,
            'content.hero.image' => $image,
            'content.project.image' => $image,
            'content.plots.image' => $image,
            'content.gallery.images' => ['array', 'max:24'],
            'content.gallery.images.*.url' => ['required', ...array_slice($image, 1)],
            'content.gallery.images.*.alt' => ['nullable', 'string', 'max:200'],
            'content.experience.projects.*.image' => $image,

            'content.amenities.items.*.icon' => [Rule::in(LandingContent::AMENITY_ICONS)],
            'content.payment.plans.*.highlight' => ['boolean'],

            'content.sections' => ['array'],
            'content.sections.*.key' => ['required', Rule::in(LandingContent::SECTION_KEYS)],
            'content.sections.*.enabled' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'content.tracking.gtm_id.regex' => 'Couldn’t find a Google Tag Manager ID here. Paste the ID shown at the top of GTM, e.g. GTM-ABC1234.',
            'content.tracking.meta_pixel_id.regex' => 'Meta Pixel ID must be digits only.',
            'content.tracking.tiktok_pixel_id.regex' => 'TikTok Pixel ID must be uppercase letters and digits.',
            'content.location.map_embed_url.starts_with' => 'Use the Google Maps "Embed a map" URL (https://www.google.com/maps/embed?...).',
        ];
    }
}

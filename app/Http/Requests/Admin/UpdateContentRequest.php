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
            'content.tracking.gtm_id.regex' => 'GTM ID must look like GTM-XXXXXXX.',
            'content.tracking.meta_pixel_id.regex' => 'Meta Pixel ID must be digits only.',
            'content.tracking.tiktok_pixel_id.regex' => 'TikTok Pixel ID must be uppercase letters and digits.',
            'content.location.map_embed_url.starts_with' => 'Use the Google Maps "Embed a map" URL (https://www.google.com/maps/embed?...).',
        ];
    }
}

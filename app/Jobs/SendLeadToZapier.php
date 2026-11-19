<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Models\Setting;
use App\Support\LandingContent;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * Posts a lead to the Zapier "Catch Hook" webhook set in Dashboard → Integrations.
 * Same approach as the al-qasimia project: dispatched after the response so visitors never wait,
 * retried on failure, and the outcome is stored on the lead so it can be resent from the dashboard.
 */
class SendLeadToZapier
{
    use Dispatchable;

    public function __construct(public Lead $lead) {}

    public function handle(): void
    {
        $url = Setting::zapierWebhookUrl();

        if (! $url) {
            return;
        }

        try {
            Http::timeout(10)->retry(2, 500, throw: false)->asJson()
                ->post($url, static::payload($this->lead))
                ->throw();

            $this->lead->forceFill(['zapier_status' => 'sent', 'zapier_sent_at' => now(), 'zapier_error' => null])->save();
        } catch (Throwable $e) {
            report($e);
            $this->lead->forceFill(['zapier_status' => 'failed', 'zapier_error' => Str::limit($e->getMessage(), 250, '')])->save();
        }
    }

    /**
     * The JSON body Zapier receives for a lead (field list is shown on the Integrations page).
     *
     * @return array<string, mixed>
     */
    public static function payload(Lead $lead): array
    {
        $locale = $lead->locale === 'en' ? 'en' : 'ar';
        $content = LandingContent::get($locale);

        return [
            'id' => $lead->id,
            'name' => $lead->name,
            'mobile' => $lead->phone,
            'plot_type' => $lead->plot_type,
            'payment_method' => $lead->payment_method,
            'language' => $locale,
            'status' => $lead->status ?? 'new',
            'utm_source' => $lead->utm_source,
            'utm_medium' => $lead->utm_medium,
            'utm_campaign' => $lead->utm_campaign,
            'utm_content' => $lead->utm_content,
            'utm_term' => $lead->utm_term,
            'gclid' => $lead->gclid,
            'fbclid' => $lead->fbclid,
            'ttclid' => $lead->ttclid,
            'landing_url' => $lead->landing_url,
            'referrer' => $lead->referrer,
            'page_title' => $content['seo']['title'],
            'page_url' => url($locale === 'en' ? '/en' : '/'),
            'ip_address' => $lead->ip,
            'submitted_at' => $lead->created_at?->toIso8601String(),
        ];
    }
}

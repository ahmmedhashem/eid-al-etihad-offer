<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendLeadToZapier;
use App\Models\Lead;
use App\Models\Setting;
use App\Support\TrackingSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class IntegrationController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/integrations', [
            'zapier' => Setting::zapier(),
            'tracking' => TrackingSettings::get(),
            'stats' => [
                'sent' => Lead::where('zapier_status', 'sent')->count(),
                'failed' => Lead::where('zapier_status', 'failed')->count(),
                'unsent' => Lead::whereNull('zapier_status')->count(),
            ],
            'fields' => array_keys(SendLeadToZapier::payload(new Lead)),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'webhook_url' => ['nullable', 'required_if:enabled,true', 'url:https', 'max:500'],
            'enabled' => ['boolean'],
        ], [
            'webhook_url.required_if' => 'Add the webhook URL before turning sending on.',
            'webhook_url.url' => 'Enter a valid https:// webhook URL.',
        ]);

        Setting::putZapier($validated['webhook_url'] ?? null, $request->boolean('enabled'));

        return back()->with('success', 'Zapier settings saved.');
    }

    /** Ad pixels + lead-alert email: their own form, so page-content saves can never wipe them. */
    public function updateTracking(Request $request): RedirectResponse
    {
        $input = TrackingSettings::normalize($request->only(TrackingSettings::FIELDS));
        $validated = Validator::make($input, TrackingSettings::rules(), TrackingSettings::messages())->validate();

        TrackingSettings::save($validated);

        return back()->with('success', 'Tracking settings saved.');
    }

    public function test(Request $request): RedirectResponse
    {
        $validated = $request->validate(['webhook_url' => ['required', 'url:https', 'max:500']]);

        $lead = new Lead([
            'name' => 'Test Lead',
            'phone' => '+971 50 000 0000',
            'plot_type' => 'سكني استثماري',
            'payment_method' => 'كاش (خصم 35%)',
            'locale' => 'ar',
            'utm_source' => 'zapier-test',
            'utm_campaign' => 'test',
        ]);
        $lead->id = 0;
        $lead->ip = $request->ip();
        $lead->created_at = now();

        try {
            Http::timeout(10)->asJson()->post($validated['webhook_url'], SendLeadToZapier::payload($lead))->throw();
        } catch (Throwable $e) {
            return back()->withErrors(['webhook_url' => 'Zapier did not accept the test: '.$e->getMessage()]);
        }

        return back()->with('success', Setting::zapierWebhookUrl()
            ? 'Test lead sent to Zapier.'
            : 'Test lead sent to Zapier. Sending is still off, so real leads won’t be sent until you tick "Send leads to Zapier" and save.');
    }
}

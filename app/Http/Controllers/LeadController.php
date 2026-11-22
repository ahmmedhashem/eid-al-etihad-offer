<?php

namespace App\Http\Controllers;

use App\Jobs\SendLeadToZapier;
use App\Models\Lead;
use App\Support\LandingContent;
use App\Support\TrackingSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class LeadController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        // Honeypot: real visitors never see or fill this field.
        if (filled($request->input('website'))) {
            return back()->with('lead_submitted', true);
        }

        $locale = $request->input('locale') === 'en' ? 'en' : 'ar';
        $content = LandingContent::get($locale);

        $messages = $locale === 'en' ? [
            'name.required' => 'Please enter your name.',
            'name.min' => 'Please enter your full name.',
            'phone.required' => 'Please enter your phone number.',
            'phone.regex' => 'Please enter a valid phone number.',
        ] : [
            'name.required' => 'يرجى إدخال الاسم.',
            'name.min' => 'يرجى إدخال الاسم الكامل.',
            'phone.required' => 'يرجى إدخال رقم الهاتف.',
            'phone.regex' => 'يرجى إدخال رقم هاتف صحيح.',
        ];

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'max:32', 'regex:/^\+?[0-9\s\-()]{7,20}$/'],
            'plot_type' => ['nullable', 'string', 'max:120'],
            'payment_method' => ['nullable', 'string', 'max:120'],
            'attribution' => ['nullable', 'array'],
            'attribution.*' => ['nullable', 'string', 'max:2000'],
        ], $messages);

        $attribution = array_intersect_key($data['attribution'] ?? [], array_flip(Lead::ATTRIBUTION_FIELDS));

        $lead = Lead::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'plot_type' => $data['plot_type'] ?? null,
            'payment_method' => $data['payment_method'] ?? null,
            'locale' => $locale,
            ...array_map(fn ($v) => $v === null ? null : mb_substr($v, 0, 1000), $attribution),
            'ip' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 1000),
        ]);

        // Sent after the response so the visitor never waits on Zapier.
        SendLeadToZapier::dispatchAfterResponse($lead);

        $notify = TrackingSettings::get()['lead_alert_email'];
        if ($notify && filter_var($notify, FILTER_VALIDATE_EMAIL)) {
            try {
                Mail::raw(
                    "طلب جديد من صفحة الهبوط\n\nالاسم: {$lead->name}\nالهاتف: {$lead->phone}\nنوع القطعة: {$lead->plot_type}\nطريقة الدفع: {$lead->payment_method}\nاللغة: {$lead->locale}\nالحملة: {$lead->utm_campaign}\n\n".route('admin.leads.index'),
                    fn ($m) => $m->to($notify)->subject('Lead جديد: '.$lead->name)
                );
            } catch (\Throwable $e) {
                Log::warning('Lead notification failed', ['lead' => $lead->id, 'error' => $e->getMessage()]);
            }
        }

        return back()->with('lead_submitted', true);
    }
}

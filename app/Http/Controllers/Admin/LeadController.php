<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendLeadToZapier;
use App\Models\Lead;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'source', 'locale', 'from', 'to']);

        $leads = $this->query($filters)->latest()->paginate(20)->withQueryString();

        return Inertia::render('admin/leads/index', [
            'leads' => $leads,
            'filters' => (object) $filters,
            'statuses' => Lead::STATUSES,
            'sources' => Lead::whereNotNull('utm_source')->distinct()->orderBy('utm_source')->pluck('utm_source'),
            'zapierEnabled' => Setting::zapierWebhookUrl() !== null,
        ]);
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        $lead->update($request->validate([
            'status' => ['sometimes', Rule::in(Lead::STATUSES)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]));

        return back();
    }

    public function sendToZapier(Lead $lead): RedirectResponse
    {
        if (! Setting::zapierWebhookUrl()) {
            return back()->with('success', 'Turn on Zapier and add a webhook URL first (Integrations).');
        }

        SendLeadToZapier::dispatchSync($lead);

        return back()->with('success', $lead->refresh()->zapier_status === 'sent'
            ? 'Lead sent to Zapier.'
            : 'Zapier rejected the lead: '.$lead->zapier_error);
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $lead->delete();

        return back();
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $request->only(['search', 'status', 'source', 'locale', 'from', 'to']);
        $columns = ['id', 'created_at', 'name', 'phone', 'plot_type', 'payment_method', 'locale', 'status', 'notes', 'zapier_status',
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'ttclid', 'landing_url', 'referrer'];

        return response()->streamDownload(function () use ($filters, $columns) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel shows Arabic correctly
            fputcsv($out, $columns);
            $this->query($filters)->latest()->chunk(500, function ($rows) use ($out, $columns) {
                foreach ($rows as $lead) {
                    fputcsv($out, array_map(function ($c) use ($lead) {
                        $v = (string) $lead->{$c};

                        // Neutralise spreadsheet formula injection.
                        return preg_match('/^[=+\-@\t\r]/', $v) && $c !== 'phone' ? "'".$v : $v;
                    }, $columns));
                }
            });
            fclose($out);
        }, 'leads-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function query(array $filters): Builder
    {
        return Lead::query()
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%")->orWhere('utm_campaign', 'like', "%{$s}%")))
            ->when($filters['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($filters['source'] ?? null, fn ($q, $s) => $q->where('utm_source', $s))
            ->when($filters['locale'] ?? null, fn ($q, $l) => $q->where('locale', $l))
            ->when($filters['from'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($filters['to'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
    }
}

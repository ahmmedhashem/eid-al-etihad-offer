<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Support\LandingContent;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $byStatus = Lead::select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status');

        $since = now()->subDays(13)->startOfDay();
        $daily = Lead::where('created_at', '>=', $since)->get(['created_at'])
            ->groupBy(fn ($l) => $l->created_at->toDateString())->map->count();
        $series = collect(range(13, 0))->map(function ($d) use ($daily) {
            $date = now()->subDays($d)->toDateString();

            return ['date' => $date, 'total' => $daily[$date] ?? 0];
        })->values();

        $campaigns = Lead::select(DB::raw("coalesce(utm_source, 'direct') as source"), DB::raw('count(*) as total'))
            ->groupBy('source')->orderByDesc('total')->limit(6)->get();

        $content = LandingContent::get();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total' => Lead::count(),
                'today' => Lead::whereDate('created_at', today())->count(),
                'week' => Lead::where('created_at', '>=', now()->subDays(7))->count(),
                'new' => (int) ($byStatus['new'] ?? 0),
            ],
            'byStatus' => collect(Lead::STATUSES)->map(fn ($s) => ['status' => $s, 'total' => (int) ($byStatus[$s] ?? 0)]),
            'series' => $series,
            'sources' => $campaigns,
            'latest' => Lead::latest()->limit(6)->get(['id', 'name', 'phone', 'plot_type', 'status', 'utm_source', 'created_at']),
            'campaign' => [
                'offer_ends_at' => $content['campaign']['offer_ends_at'],
                'hidden_sections' => collect($content['sections'])->where('enabled', false)->pluck('key')->values(),
            ],
        ]);
    }
}

import { STATUS_LABELS, STATUS_STYLES, formatDate } from '@/admin/status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CalendarClock, EyeOff } from 'lucide-react';

interface Props {
    stats: { total: number; today: number; week: number; new: number };
    byStatus: { status: string; total: number }[];
    series: { date: string; total: number }[];
    sources: { source: string; total: number }[];
    latest: { id: number; name: string; phone: string; plot_type: string | null; status: string; utm_source: string | null; created_at: string }[];
    campaign: { offer_ends_at: string | null; hidden_sections: string[] };
}

function daysLeft(date: string | null) {
    if (!date) return null;
    const diff = new Date(`${date}T23:59:59+04:00`).getTime() - Date.now();
    return Math.ceil(diff / 86_400_000);
}

export default function Dashboard({ stats, byStatus, series, sources, latest, campaign }: Props) {
    const max = Math.max(1, ...series.map((s) => s.total));
    const left = daysLeft(campaign.offer_ends_at);
    const sourceMax = Math.max(1, ...sources.map((s) => s.total));

    return (
        <AppLayout breadcrumbs={[{ title: 'Overview', href: '/dashboard' }]}>
            <Head title="Overview" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Leads today', value: stats.today },
                        { label: 'Last 7 days', value: stats.week },
                        { label: 'All leads', value: stats.total },
                        { label: 'Waiting for first contact', value: stats.new, href: '/dashboard/leads?status=new' },
                    ].map((s) => (
                        <Card key={s.label} className="gap-2 py-5">
                            <CardHeader className="px-5">
                                <CardDescription>{s.label}</CardDescription>
                                <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
                            </CardHeader>
                            {s.href && (
                                <CardContent className="px-5">
                                    <Link
                                        href={s.href}
                                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
                                    >
                                        Open list <ArrowRight className="size-3.5" />
                                    </Link>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Leads per day</CardTitle>
                            <CardDescription>Last 14 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Leads per day, last 14 days">
                                {series.map((d) => (
                                    <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                                        <span className="text-muted-foreground text-[11px] tabular-nums opacity-0 group-hover:opacity-100">
                                            {d.total}
                                        </span>
                                        <div
                                            className="bg-primary/80 group-hover:bg-primary w-full rounded-t-sm transition-colors"
                                            style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }}
                                            title={`${d.date}: ${d.total}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                                <span>{series[0]?.date.slice(5)}</span>
                                <span>{series[series.length - 1]?.date.slice(5)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign</CardTitle>
                            <CardDescription>Eid Al Etihad offer</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 text-sm">
                            <div className="flex items-center gap-3">
                                <CalendarClock className="text-muted-foreground size-5" />
                                <div>
                                    <p className="font-medium">Offer ends {campaign.offer_ends_at ?? '—'}</p>
                                    {left !== null && (
                                        <p className={cn('text-muted-foreground', left <= 0 && 'text-destructive')}>
                                            {left > 0
                                                ? `${left} day${left === 1 ? '' : 's'} left`
                                                : 'Offer date has passed — update it in Page content'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {campaign.hidden_sections.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <EyeOff className="text-muted-foreground size-5" />
                                    <p>Hidden sections: {campaign.hidden_sections.join(', ')}</p>
                                </div>
                            )}
                            <div className="border-t pt-4">
                                <p className="mb-2 font-medium">By status</p>
                                <ul className="flex flex-col gap-1.5">
                                    {byStatus.map((s) => (
                                        <li key={s.status} className="flex items-center justify-between">
                                            <Link
                                                href={`/dashboard/leads?status=${s.status}`}
                                                className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[s.status])}
                                            >
                                                {STATUS_LABELS[s.status]}
                                            </Link>
                                            <span className="tabular-nums">{s.total}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Latest leads</CardTitle>
                            <Link href="/dashboard/leads" className="text-muted-foreground hover:text-foreground text-sm">
                                View all
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {latest.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No leads yet. They appear here as soon as someone submits the form.</p>
                            ) : (
                                <ul className="divide-y">
                                    {latest.map((l) => (
                                        <li key={l.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium" dir="auto">
                                                    {l.name}
                                                </p>
                                                <p className="text-muted-foreground" dir="ltr">
                                                    {l.phone}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-3">
                                                <span className="text-muted-foreground hidden sm:inline">{l.utm_source ?? 'direct'}</span>
                                                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[l.status])}>
                                                    {STATUS_LABELS[l.status]}
                                                </span>
                                                <span className="text-muted-foreground w-28 text-right tabular-nums">{formatDate(l.created_at)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Lead sources</CardTitle>
                            <CardDescription>From utm_source</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="flex flex-col gap-3 text-sm">
                                {sources.map((s) => (
                                    <li key={s.source}>
                                        <div className="mb-1 flex justify-between">
                                            <span>{s.source}</span>
                                            <span className="tabular-nums">{s.total}</span>
                                        </div>
                                        <div className="bg-muted h-2 rounded-full">
                                            <div className="bg-primary h-2 rounded-full" style={{ width: `${(s.total / sourceMax) * 100}%` }} />
                                        </div>
                                    </li>
                                ))}
                                {sources.length === 0 && <li className="text-muted-foreground">No data yet.</li>}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

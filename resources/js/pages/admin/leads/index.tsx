import { STATUS_LABELS, STATUS_STYLES, formatDate } from '@/admin/status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, LoaderCircle, Search, Send, StickyNote, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface Lead {
    id: number;
    name: string;
    phone: string;
    plot_type: string | null;
    payment_method: string | null;
    locale: 'ar' | 'en';
    status: string;
    notes: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    gclid: string | null;
    fbclid: string | null;
    ttclid: string | null;
    zapier_status: 'sent' | 'failed' | null;
    zapier_error: string | null;
    created_at: string;
}

function ZapierBadge({ lead }: { lead: Lead }) {
    if (lead.zapier_status === 'sent')
        return (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                Sent
            </span>
        );
    if (lead.zapier_status === 'failed')
        return (
            <span
                title={lead.zapier_error ?? ''}
                className="cursor-help rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-500/20 dark:text-red-200"
            >
                Failed
            </span>
        );
    return <span className="text-muted-foreground text-xs">—</span>;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
}

interface Filters {
    search?: string;
    status?: string;
    source?: string;
    locale?: string;
    from?: string;
    to?: string;
}

const selectCls =
    'border-input bg-background h-10 rounded-md border px-3 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-hidden';

function clickId(l: Lead) {
    if (l.gclid) return 'Google click';
    if (l.fbclid) return 'Meta click';
    if (l.ttclid) return 'TikTok click';
    return null;
}

export default function LeadsIndex({
    leads,
    filters,
    statuses,
    sources,
    zapierEnabled,
}: {
    leads: Paginated<Lead>;
    filters: Filters;
    statuses: string[];
    sources: string[];
    zapierEnabled: boolean;
}) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [sendingId, setSendingId] = useState<number | null>(null);
    const sendToZapier = (lead: Lead) =>
        router.post(
            `/dashboard/leads/${lead.id}/zapier`,
            {},
            { preserveScroll: true, preserveState: true, onStart: () => setSendingId(lead.id), onFinish: () => setSendingId(null) },
        );
    const [f, setF] = useState<Filters>({ search: '', status: '', source: '', locale: '', from: '', to: '', ...filters });
    const [noteLead, setNoteLead] = useState<Lead | null>(null);
    const [noteText, setNoteText] = useState('');
    const [deleteLead, setDeleteLead] = useState<Lead | null>(null);

    const apply = (next: Filters) => {
        const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
        router.get('/dashboard/leads', clean, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        apply(f);
    };

    const setStatus = (lead: Lead, status: string) =>
        router.patch(`/dashboard/leads/${lead.id}`, { status }, { preserveScroll: true, preserveState: true });

    const saveNote = () => {
        if (!noteLead) return;
        router.patch(
            `/dashboard/leads/${noteLead.id}`,
            { notes: noteText },
            { preserveScroll: true, preserveState: true, onSuccess: () => setNoteLead(null) },
        );
    };

    const exportUrl = '/dashboard/leads/export?' + new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

    return (
        <AppLayout breadcrumbs={[{ title: 'Leads', href: '/dashboard/leads' }]}>
            <Head title="Leads" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Leads</h1>
                        <p className="text-muted-foreground text-sm">{leads.total} total from the landing page form</p>
                        {flash?.success && <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">{flash.success}</p>}
                    </div>
                    <Button variant="outline" asChild>
                        <a href={exportUrl}>
                            <Download className="size-4" /> Export CSV
                        </a>
                    </Button>
                </div>

                <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-56 flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            className="pl-9"
                            placeholder="Search name, phone or campaign"
                            value={f.search}
                            onChange={(e) => setF({ ...f, search: e.target.value })}
                        />
                    </div>
                    <select
                        className={selectCls}
                        value={f.status}
                        onChange={(e) => {
                            const next = { ...f, status: e.target.value };
                            setF(next);
                            apply(next);
                        }}
                        aria-label="Status"
                    >
                        <option value="">All statuses</option>
                        {statuses.map((s) => (
                            <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                            </option>
                        ))}
                    </select>
                    <select
                        className={selectCls}
                        value={f.source}
                        onChange={(e) => {
                            const next = { ...f, source: e.target.value };
                            setF(next);
                            apply(next);
                        }}
                        aria-label="Source"
                    >
                        <option value="">All sources</option>
                        {sources.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <select
                        className={selectCls}
                        value={f.locale}
                        onChange={(e) => {
                            const next = { ...f, locale: e.target.value };
                            setF(next);
                            apply(next);
                        }}
                        aria-label="Language"
                    >
                        <option value="">All languages</option>
                        <option value="ar">Arabic page</option>
                        <option value="en">English page</option>
                    </select>
                    <Input
                        type="date"
                        className="w-40"
                        value={f.from}
                        onChange={(e) => setF({ ...f, from: e.target.value })}
                        aria-label="From date"
                    />
                    <Input type="date" className="w-40" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} aria-label="To date" />
                    <Button type="submit">Apply</Button>
                    {Object.values(filters).some(Boolean) && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setF({ search: '', status: '', source: '', locale: '', from: '', to: '' });
                                apply({});
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </form>

                <Card className="overflow-hidden py-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Received</th>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Phone</th>
                                    <th className="px-4 py-3 font-medium">Interest</th>
                                    <th className="px-4 py-3 font-medium">Source</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Zapier</th>
                                    <th className="px-4 py-3 font-medium">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {leads.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-muted-foreground px-4 py-10 text-center">
                                            No leads match these filters.
                                        </td>
                                    </tr>
                                )}
                                {leads.data.map((l) => (
                                    <tr key={l.id} className="hover:bg-muted/30 align-top">
                                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap tabular-nums">{formatDate(l.created_at)}</td>
                                        <td className="px-4 py-3 font-medium">
                                            <span dir="auto">{l.name}</span>
                                            <span
                                                className="bg-muted text-muted-foreground ml-2 rounded px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase"
                                                title={l.locale === 'en' ? 'Came from the English page' : 'Came from the Arabic page'}
                                            >
                                                {l.locale}
                                            </span>
                                            {l.notes && (
                                                <p className="text-muted-foreground mt-1 line-clamp-2 max-w-56 text-xs font-normal">{l.notes}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`} dir="ltr" className="hover:underline">
                                                {l.phone}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3" dir="auto">
                                            <p>{l.plot_type ?? '—'}</p>
                                            <p className="text-muted-foreground text-xs">{l.payment_method}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p>{l.utm_source ?? 'direct'}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {[l.utm_campaign, l.utm_content, clickId(l)].filter(Boolean).join(' · ')}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={l.status}
                                                onChange={(e) => setStatus(l, e.target.value)}
                                                className={cn('rounded-full border-0 px-2.5 py-1 text-xs font-medium', STATUS_STYLES[l.status])}
                                                aria-label={`Status for ${l.name}`}
                                            >
                                                {statuses.map((s) => (
                                                    <option key={s} value={s}>
                                                        {STATUS_LABELS[s]}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ZapierBadge lead={l} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {zapierEnabled && l.zapier_status !== 'sent' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={sendingId === l.id}
                                                        onClick={() => sendToZapier(l)}
                                                        className="text-xs"
                                                    >
                                                        {sendingId === l.id ? (
                                                            <LoaderCircle className="size-3.5 animate-spin" />
                                                        ) : (
                                                            <Send className="size-3.5" />
                                                        )}
                                                        {l.zapier_status === 'failed' ? 'Resend' : 'Send to Zapier'}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setNoteLead(l);
                                                        setNoteText(l.notes ?? '');
                                                    }}
                                                    aria-label="Edit notes"
                                                >
                                                    <StickyNote className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteLead(l)} aria-label="Delete lead">
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {leads.links.length > 3 && (
                    <nav className="flex flex-wrap items-center justify-between gap-2 text-sm" aria-label="Pagination">
                        <span className="text-muted-foreground">
                            Showing {leads.from}–{leads.to} of {leads.total}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {leads.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={cn(
                                        'rounded-md border px-3 py-1.5',
                                        link.active && 'bg-primary text-primary-foreground',
                                        !link.url && 'pointer-events-none opacity-40',
                                    )}
                                >
                                    {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                </Link>
                            ))}
                        </div>
                    </nav>
                )}
            </div>

            <Dialog open={!!noteLead} onOpenChange={(o) => !o && setNoteLead(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Notes</DialogTitle>
                        <DialogDescription dir="auto">{noteLead?.name}</DialogDescription>
                    </DialogHeader>
                    <textarea
                        className="border-input bg-background min-h-36 w-full rounded-md border p-3 text-sm"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        dir="auto"
                        placeholder="Call outcome, budget, preferred plot…"
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setNoteLead(null)}>
                            Cancel
                        </Button>
                        <Button onClick={saveNote}>Save notes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteLead} onOpenChange={(o) => !o && setDeleteLead(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this lead?</DialogTitle>
                        <DialogDescription>
                            <span dir="auto">{deleteLead?.name}</span> will be removed permanently. This can’t be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteLead(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                deleteLead &&
                                router.delete(`/dashboard/leads/${deleteLead.id}`, { preserveScroll: true, onSuccess: () => setDeleteLead(null) })
                            }
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

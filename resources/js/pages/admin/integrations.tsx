import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, LoaderCircle, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type Tracking = { gtm_id: string; meta_pixel_id: string; tiktok_pixel_id: string; snap_pixel_id: string; lead_alert_email: string };

interface Props {
    zapier: { webhook_url: string; enabled: boolean };
    tracking: Tracking;
    stats: { sent: number; failed: number; unsent: number };
    fields: string[];
}

export default function Integrations({ zapier, tracking, stats, fields }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [testing, setTesting] = useState(false);
    const { data, setData, put, processing, errors, isDirty } = useForm({
        webhook_url: zapier.webhook_url ?? '',
        enabled: zapier.enabled,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put('/dashboard/integrations', { preserveScroll: true });
    };

    const sendTest = () =>
        router.post(
            '/dashboard/integrations/test',
            { webhook_url: data.webhook_url },
            { preserveScroll: true, preserveState: true, onStart: () => setTesting(true), onFinish: () => setTesting(false) },
        );

    return (
        <AppLayout breadcrumbs={[{ title: 'Integrations', href: '/dashboard/integrations' }]}>
            <Head title="Integrations" />
            <div className="flex max-w-3xl flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="text-xl font-semibold">Integrations</h1>
                    <p className="text-muted-foreground text-sm">Send new leads to other tools automatically.</p>
                </div>

                {flash?.success && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {zapier.webhook_url && !zapier.enabled && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                            <strong>Sending is off.</strong> New leads from the form are not sent to Zapier (the test button works either way). Tick
                            “Send leads to Zapier” below and click Save.
                        </p>
                    </div>
                )}

                <TrackingCard tracking={tracking} />

                <form onSubmit={submit}>
                    <Card>
                        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                                <CardTitle>Zapier</CardTitle>
                                <CardDescription>Every new lead from the Arabic and English forms is sent to this webhook.</CardDescription>
                            </div>
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                                <Checkbox checked={data.enabled} onCheckedChange={(c) => setData('enabled', c === true)} />
                                Send leads to Zapier
                            </label>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="webhook_url">Webhook URL</Label>
                                <Input
                                    id="webhook_url"
                                    type="url"
                                    dir="ltr"
                                    placeholder="https://hooks.zapier.com/hooks/catch/123456/abcdef/"
                                    value={data.webhook_url}
                                    onChange={(e) => setData('webhook_url', e.target.value)}
                                    aria-invalid={!!errors.webhook_url}
                                />
                                <p className="text-muted-foreground text-xs">
                                    In Zapier, create a Zap with the trigger <strong>Webhooks by Zapier → Catch Hook</strong> and paste its URL here.
                                </p>
                                {errors.webhook_url && <p className="text-destructive text-xs font-medium">{errors.webhook_url}</p>}
                                {errors.enabled && <p className="text-destructive text-xs font-medium">{errors.enabled}</p>}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                                    {isDirty ? 'Save changes' : 'Save'}
                                </Button>
                                <Button type="button" variant="outline" onClick={sendTest} disabled={testing || !data.webhook_url}>
                                    {testing ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    Send test lead
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle>Delivery</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 text-sm">
                        <p>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{stats.sent}</span> sent ·{' '}
                            <span className="font-semibold text-red-600 dark:text-red-400">{stats.failed}</span> failed ·{' '}
                            <span className="text-muted-foreground">{stats.unsent} not sent</span>
                        </p>
                        <p className="text-muted-foreground">
                            Failed leads (and leads that arrived while sending was off) can be sent from the Leads page. Fields sent to Zapier:
                        </p>
                        <div className="flex flex-wrap gap-1.5" dir="ltr">
                            {fields.map((f) => (
                                <code key={f} className="bg-muted rounded px-1.5 py-0.5 text-xs">
                                    {f}
                                </code>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

const TRACKING_FIELDS: { key: keyof Tracking; label: string; placeholder: string; help: string }[] = [
    {
        key: 'gtm_id',
        label: 'Google Tag Manager ID',
        placeholder: 'GTM-XXXXXXX',
        help: 'Sends lead_submitted and phone_call_click events to GTM (see README).',
    },
    { key: 'meta_pixel_id', label: 'Meta (Facebook/Instagram) Pixel ID', placeholder: '123456789012345', help: 'Fires PageView and Lead.' },
    { key: 'tiktok_pixel_id', label: 'TikTok Pixel ID', placeholder: 'C1A2B3C4D5E6F7G8H9', help: 'Fires page and SubmitForm.' },
    { key: 'snap_pixel_id', label: 'Snapchat Pixel ID', placeholder: '1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e6f', help: 'Fires PAGE_VIEW and SIGN_UP.' },
];

/** Ad pixels + new-lead email. Saved on their own, so editing page content can never wipe them. */
function TrackingCard({ tracking }: { tracking: Tracking }) {
    const { data, setData, put, processing, errors, isDirty, recentlySuccessful } = useForm<Tracking>({ ...tracking });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put('/dashboard/integrations/tracking', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit}>
            <Card>
                <CardHeader>
                    <CardTitle>Tracking pixels & lead alerts</CardTitle>
                    <CardDescription>
                        Used by both the Arabic and English pages. You can paste just the ID or the whole installation code — only the ID is kept.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                    {TRACKING_FIELDS.map((f) => (
                        <div key={f.key} className="flex flex-col gap-1.5">
                            <Label htmlFor={f.key}>{f.label}</Label>
                            <Input
                                id={f.key}
                                dir="ltr"
                                placeholder={f.placeholder}
                                value={data[f.key]}
                                onChange={(e) => setData(f.key, e.target.value)}
                                aria-invalid={!!errors[f.key]}
                            />
                            <p className="text-muted-foreground text-xs">{f.help}</p>
                            {errors[f.key] && <p className="text-destructive text-xs font-medium">{errors[f.key]}</p>}
                        </div>
                    ))}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="lead_alert_email">Email new leads to</Label>
                        <Input
                            id="lead_alert_email"
                            type="email"
                            dir="ltr"
                            placeholder="sales@alrasikhoon.ae"
                            value={data.lead_alert_email}
                            onChange={(e) => setData('lead_alert_email', e.target.value)}
                            aria-invalid={!!errors.lead_alert_email}
                        />
                        <p className="text-muted-foreground text-xs">
                            Leave empty to disable. Needs the mail settings (MAIL_*) in the server’s .env.
                        </p>
                        {errors.lead_alert_email && <p className="text-destructive text-xs font-medium">{errors.lead_alert_email}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing || !isDirty}>
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Save tracking settings
                        </Button>
                        {recentlySuccessful && (
                            <span className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="size-4" /> Saved
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

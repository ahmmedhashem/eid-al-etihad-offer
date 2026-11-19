import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, LoaderCircle, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface Props {
    zapier: { webhook_url: string; enabled: boolean };
    stats: { sent: number; failed: number; unsent: number };
    fields: string[];
}

export default function Integrations({ zapier, stats, fields }: Props) {
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
            <form onSubmit={submit} className="flex max-w-3xl flex-col gap-4 p-4 md:p-6">
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
            </form>
        </AppLayout>
    );
}

import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, LoaderCircle } from 'lucide-react';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { useLandingI18n } from './i18n';
import type { LandingContent } from './types';
import { CtaButton } from './ui';

const ATTR_KEY = 'lp_attribution';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'ttclid'] as const;

type Attribution = Partial<Record<(typeof PARAMS)[number] | 'landing_url' | 'referrer', string>>;

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
        ttq?: { track: (event: string, data?: object) => void };
        snaptr?: (...args: unknown[]) => void;
        dataLayer?: object[];
    }
}

/**
 * Ad attribution for this browser session. A visit that carries ad parameters (UTM / click IDs)
 * always wins; a plain reload or direct visit keeps what the session already captured.
 */
function readAttribution(): Attribution {
    const params = new URLSearchParams(window.location.search);
    const attr: Attribution = {};
    PARAMS.forEach((p) => {
        const v = params.get(p);
        if (v) attr[p] = v.slice(0, 250);
    });
    if (Object.keys(attr).length === 0) {
        try {
            const saved = sessionStorage.getItem(ATTR_KEY);
            if (saved) return JSON.parse(saved);
        } catch {
            /* storage unavailable (private mode) — fall through */
        }
    }
    attr.landing_url = window.location.href.slice(0, 1000);
    if (document.referrer) attr.referrer = document.referrer.slice(0, 1000);
    try {
        sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
    } catch {
        /* ignore */
    }
    return attr;
}

function fireLeadEvents(location: string) {
    window.fbq?.('track', 'Lead');
    window.ttq?.track('SubmitForm');
    window.snaptr?.('track', 'SIGN_UP');
    window.dataLayer?.push({ event: 'lead_submitted', form_location: location });
}

function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: React.ReactNode; htmlFor: string }) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={htmlFor} className="text-ink text-sm font-semibold">
                {label}
            </label>
            {children}
            {error && (
                <p className="text-flag-red text-sm font-medium" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

const inputCls =
    'h-[52px] w-full rounded-[10px] border border-line bg-white px-4 text-[15px] text-ink placeholder:text-soft/70 focus:border-slate focus:ring-2 focus:ring-slate/25 focus:outline-none aria-[invalid=true]:border-flag-red';

export function LeadForm({
    content,
    title,
    location,
    anchorId,
    className,
}: {
    content: LandingContent;
    title: string;
    location: 'final';
    anchorId?: string;
    className?: string;
}) {
    const f = content.form;
    const { locale, ui } = useLandingI18n();
    const uid = useId();
    const [done, setDone] = useState(false);
    const { data, setData, post, processing, errors, transform, reset } = useForm({
        name: '',
        phone: '+971 ',
        plot_type: f.plot_options[0] ?? '',
        payment_method: f.payment_options[0] ?? '',
        locale,
        website: '', // honeypot
        attribution: {} as Attribution,
    });

    useEffect(() => {
        setData('attribution', readAttribution());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    transform((d) => ({ ...d, phone: d.phone.trim() }));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/leads', {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as { flash?: { lead_submitted?: boolean } }).flash;
                if (flash?.lead_submitted) {
                    setDone(true);
                    fireLeadEvents(location);
                    reset('name');
                }
            },
        });
    };

    return (
        <div
            id={anchorId}
            className={cn('w-full max-w-[460px] scroll-mt-24 rounded-[18px] bg-white p-6 shadow-[0_24px_48px_rgba(0,0,0,0.18)] sm:p-9', className)}
        >
            {done ? (
                <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
                    <CheckCircle2 className="text-flag-green size-14" aria-hidden />
                    <h3 className="text-ink text-2xl font-bold">{f.success_title}</h3>
                    <p className="text-soft text-[15px] leading-relaxed">{f.success_body}</p>
                </div>
            ) : (
                <form onSubmit={submit} noValidate className="flex flex-col gap-[18px]">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-ink text-[26px] leading-tight font-bold">{title}</h3>
                        <p className="text-soft text-[15px] leading-relaxed">{f.subtitle}</p>
                    </div>

                    <Field label={ui.fullName} error={errors.name} htmlFor={`${uid}-name`}>
                        <input
                            id={`${uid}-name`}
                            className={inputCls}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={ui.namePlaceholder}
                            autoComplete="name"
                            aria-invalid={!!errors.name}
                            required
                        />
                    </Field>

                    <Field label={ui.phone} error={errors.phone} htmlFor={`${uid}-phone`}>
                        <input
                            id={`${uid}-phone`}
                            className={cn(inputCls, 'rtl:text-right')}
                            dir="ltr"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="+971 5X XXX XXXX"
                            aria-invalid={!!errors.phone}
                            required
                        />
                    </Field>

                    <Field label={ui.plotType} error={errors.plot_type} htmlFor={`${uid}-plot`}>
                        <div className="relative">
                            <select
                                id={`${uid}-plot`}
                                className={cn(inputCls, 'appearance-none pe-10')}
                                value={data.plot_type}
                                onChange={(e) => setData('plot_type', e.target.value)}
                            >
                                {f.plot_options.map((o) => (
                                    <option key={o}>{o}</option>
                                ))}
                            </select>
                            <ChevronDown className="text-soft pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                        </div>
                    </Field>

                    <Field label={ui.paymentMethod} error={errors.payment_method} htmlFor={`${uid}-pay`}>
                        <div className="relative">
                            <select
                                id={`${uid}-pay`}
                                className={cn(inputCls, 'appearance-none pe-10')}
                                value={data.payment_method}
                                onChange={(e) => setData('payment_method', e.target.value)}
                            >
                                {f.payment_options.map((o) => (
                                    <option key={o}>{o}</option>
                                ))}
                            </select>
                            <ChevronDown className="text-soft pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                        </div>
                    </Field>

                    {/* Honeypot — hidden from people, bots fill it */}
                    <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0 [clip:rect(0,0,0,0)]">
                        <label>
                            Website
                            <input tabIndex={-1} autoComplete="off" value={data.website} onChange={(e) => setData('website', e.target.value)} />
                        </label>
                    </div>

                    <CtaButton type="submit" disabled={processing} className="w-full">
                        {processing && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
                        {f.submit_label}
                    </CtaButton>

                    <p className="text-soft text-xs leading-relaxed">{f.consent}</p>
                </form>
            )}
        </div>
    );
}

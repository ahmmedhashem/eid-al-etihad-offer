import { cn } from '@/lib/utils';
import { Building2, Check, Clock, MapPin, Minus, Phone, Plus, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLandingI18n, type UiText } from './i18n';
import { LeadForm } from './lead-form';
import type { LandingContent, SectionKey } from './types';
import {
    AmenityGlyph,
    BRAND_CONFETTI as C,
    Confetti,
    Container,
    CtaButton,
    FORM_ANCHOR,
    Lines,
    Section,
    SectionHeading,
    goToForm,
    srcSetFor,
} from './ui';

type P = { content: LandingContent };

const NAV_KEYS = ['project', 'plots', 'payment', 'location', 'faq'] as const satisfies readonly SectionKey[];

const navItems = (ui: UiText, enabled: Set<SectionKey>) => NAV_KEYS.filter((k) => enabled.has(k)).map((k) => ({ key: k, label: ui.nav[k] }));

/** Switches language with a full page load (direction and fonts change) and keeps ad parameters in the URL. */
function LanguageSwitch({ className }: { className?: string }) {
    const { ui, otherUrl, locale } = useLandingI18n();
    return (
        <a
            href={otherUrl}
            hrefLang={locale === 'ar' ? 'en' : 'ar'}
            lang={locale === 'ar' ? 'en' : 'ar'}
            aria-label={ui.switchAria}
            onClick={(e) => {
                e.preventDefault();
                window.location.href = otherUrl + window.location.search;
            }}
            className={cn('text-ink/80 hover:text-ink rounded-md px-2 py-1 text-[15px] font-semibold underline-offset-4 hover:underline', className)}
        >
            {ui.switchLabel}
        </a>
    );
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

function BrandLogo({ content, light }: P & { light?: boolean }) {
    const b = content.brand;
    if (b.logo) return <img src={b.logo} alt={b.name} className="h-11 w-auto" />;
    return (
        <div className="flex flex-col leading-tight">
            <span className={cn('text-xl font-extrabold sm:text-[26px]', light ? 'text-white' : 'text-ink')}>{b.name}</span>
            <span className={cn('font-en text-[10px] font-semibold tracking-wide', light ? 'text-ochre' : 'text-terra-dark')}>{b.name_en}</span>
        </div>
    );
}

/* ---------------- Header + Hero ---------------- */

export function Header({ content }: P) {
    const { ui } = useLandingI18n();
    const enabled = new Set(content.sections.filter((s) => s.enabled).map((s) => s.key));
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className={cn('border-line bg-cream/95 sticky top-0 z-40 border-b backdrop-blur transition-shadow', scrolled && 'shadow-md')}>
            <Container className="flex h-[76px] items-center justify-between gap-6">
                {/* Co-branding lock-up: company logo | divider | official Eid Al Etihad logo (uploaded in the dashboard) */}
                <div className="flex items-center gap-4">
                    <BrandLogo content={content} />
                    {content.campaign.cobrand_logo && (
                        <>
                            <span className="bg-ink/30 h-10 w-px" aria-hidden />
                            <img src={content.campaign.cobrand_logo} alt={ui.cobrandAlt} className="h-11 w-auto" />
                        </>
                    )}
                </div>
                <nav className="hidden items-center gap-8 lg:flex" aria-label={ui.navLabel}>
                    {navItems(ui, enabled).map((n) => (
                        <a key={n.key} href={`#${n.key}`} className="text-ink/80 hover:text-ink text-base font-medium">
                            {n.label}
                        </a>
                    ))}
                </nav>
                <div className="flex items-center gap-3 sm:gap-5">
                    <a href={telHref(content.brand.phone)} dir="ltr" className="text-ink hover:text-terra hidden font-bold xl:inline">
                        {content.brand.phone}
                    </a>
                    <LanguageSwitch />
                    <CtaButton onClick={goToForm} className="hidden min-h-11 px-5 py-2 text-[15px] sm:inline-flex">
                        {ui.book}
                    </CtaButton>
                </div>
            </Container>
        </header>
    );
}

export function Hero({ content }: P) {
    const h = content.hero;
    return (
        // Full-bleed background photo filling the first screen (below the sticky header).
        <section className="bg-slate relative isolate flex overflow-hidden md:min-h-[calc(100svh-76px)]">
            {h.image ? (
                <img
                    src={h.image}
                    srcSet={srcSetFor(h.image)}
                    sizes="100vw"
                    alt=""
                    className="absolute inset-0 -z-10 size-full object-cover"
                    fetchPriority="high"
                    decoding="async"
                />
            ) : (
                <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#3f6a80_0%,#3e8b87_55%,#a9563f_100%)]" />
            )}
            {/* Light shade on the frame side only, so the photo stays the hero */}
            <div aria-hidden className="from-ink/45 via-ink/15 absolute inset-0 -z-10 bg-gradient-to-r to-transparent rtl:bg-gradient-to-l" />

            <Container className="flex items-center py-16 md:py-24">
                <div className="relative w-full max-w-[680px]">
                    <div className="brand-frame bg-cream flex flex-col items-start gap-6 px-6 pt-16 pb-20 sm:px-14">
                        {/* Campaign hook — the first thing visitors read, so it is styled as a headline, not a tag */}
                        <p className="brand-display bg-terra rounded-2xl px-5 py-2.5 text-xl leading-snug font-extrabold text-white shadow-sm sm:px-6 sm:py-3 sm:text-[28px]">
                            {content.campaign.badge}
                        </p>
                        <h1 className="text-ink text-[34px] leading-[1.25] font-extrabold sm:text-[46px]">
                            <Lines text={h.title} />
                        </h1>
                        <p className="text-ink/80 max-w-[600px] text-lg leading-[1.7] sm:text-xl">{h.subtitle}</p>
                        <ul className="flex flex-wrap gap-3">
                            {h.chips.filter(Boolean).map((c) => (
                                <li key={c} className="border-line bg-stone text-ink rounded-lg border px-4 py-2 text-[15px] font-semibold">
                                    {c}
                                </li>
                            ))}
                        </ul>
                        <CtaButton onClick={goToForm}>{h.cta_label}</CtaButton>
                    </div>
                    <Confetti
                        pieces={[
                            { top: '-12px', left: '190px', w: 10, h: 24, r: 25, c: C.red },
                            { top: '-4px', left: '240px', w: 8, h: 8, r: 0, c: C.ochre },
                            { top: '8px', left: '290px', w: 10, h: 20, r: -30, c: C.green },
                            { top: '60px', right: '-14px', w: 8, h: 18, r: 15, c: C.slate },
                            { top: '110px', right: '-18px', w: 9, h: 9, r: 45, c: C.red },
                            { top: '30px', left: '140px', w: 9, h: 20, r: -20, c: C.teal },
                            { bottom: '70px', left: '-14px', w: 10, h: 22, r: 30, c: C.ochre },
                            { bottom: '-10px', left: '130px', w: 10, h: 20, r: -15, c: C.red },
                            { bottom: '20px', right: '40px', w: 9, h: 18, r: 20, c: C.teal },
                        ]}
                    />
                </div>
            </Container>
        </section>
    );
}

/* ---------------- Sections ---------------- */

export function TrustBar({ content }: P) {
    return (
        <section className="border-line border-b bg-white py-8 md:py-10">
            <Container>
                <ul className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
                    {content.stats.map((s, i) => (
                        <li key={i} className="flex flex-col items-center gap-1 text-center">
                            <span className="brand-display text-terra text-2xl font-extrabold md:text-[34px]">{s.value}</span>
                            <span className="text-soft text-sm md:text-[15px]">{s.label}</span>
                        </li>
                    ))}
                </ul>
            </Container>
        </section>
    );
}

function useCountdown(endsAt: string | null) {
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        setNow(Date.now());
        const t = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(t);
    }, []);
    if (!endsAt || now === null) return null;
    // Offer ends at the end of the day, UAE time.
    const end = new Date(`${endsAt}T23:59:59+04:00`).getTime();
    const diff = end - now;
    if (Number.isNaN(end) || diff <= 0) return null;
    return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
    };
}

function Countdown({ endsAt }: { endsAt: string | null }) {
    const { ui } = useLandingI18n();
    const left = useCountdown(endsAt);
    if (!left) return null;
    const cells = [
        { v: left.days, l: ui.days },
        { v: left.hours, l: ui.hours },
        { v: left.minutes, l: ui.mins },
    ];
    return (
        <div className="flex gap-2" aria-label={ui.countdownLabel}>
            {cells.map((c) => (
                <div key={c.l} className="bg-ink/25 flex min-w-16 flex-col items-center rounded-lg px-3 py-2">
                    <span className="font-en text-2xl font-semibold text-white tabular-nums">{String(c.v).padStart(2, '0')}</span>
                    <span className="text-xs text-white/90">{c.l}</span>
                </div>
            ))}
        </div>
    );
}

export function Offers({ content }: P) {
    const o = content.offers;
    return (
        <Section id="offers" className="bg-cream">
            <div className="flex flex-col gap-10">
                <SectionHeading eyebrow={o.eyebrow} title={o.title} />
                <div className="grid gap-6 md:grid-cols-2">
                    {o.items.map((it, i) => (
                        <article key={i} className="border-terra flex flex-col gap-2.5 rounded-2xl border-s-[5px] bg-white px-8 py-9 sm:px-10">
                            <span className="text-terra-dark text-sm font-bold">{it.tag}</span>
                            <p className="brand-display text-ink text-4xl leading-tight font-extrabold sm:text-[52px]">{it.big}</p>
                            <h3 className="text-ink text-[22px] font-bold">{it.title}</h3>
                            <p className="text-soft text-[17px] leading-relaxed">{it.body}</p>
                        </article>
                    ))}
                </div>
                <div className="bg-slate flex flex-col items-start justify-between gap-6 rounded-2xl px-8 py-7 md:flex-row md:items-center md:px-10">
                    <div className="flex flex-col gap-1">
                        <p className="text-[22px] font-bold text-white">{o.urgency_title}</p>
                        <p className="text-base text-white/90">{o.urgency_body}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-5">
                        {content.campaign.show_countdown && <Countdown endsAt={content.campaign.offer_ends_at} />}
                        <CtaButton onClick={goToForm}>{o.urgency_cta}</CtaButton>
                    </div>
                </div>
            </div>
        </Section>
    );
}

function CheckBadge({ className }: { className?: string }) {
    return (
        <span
            className={cn('bg-terra/15 text-terra mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full', className)}
            aria-hidden
        >
            <Check className="size-4" strokeWidth={2.6} />
        </span>
    );
}

function ImageOrPlaceholder({ src, alt, className, sizes }: { src: string | null; alt: string; className?: string; sizes: string }) {
    if (src)
        return (
            <img
                src={src}
                srcSet={srcSetFor(src)}
                sizes={sizes}
                alt={alt}
                loading="lazy"
                decoding="async"
                className={cn('object-cover', className)}
            />
        );
    return (
        <div className={cn('bg-stone text-soft flex items-center justify-center', className)} aria-hidden>
            <Building2 className="size-12 opacity-50" strokeWidth={1.4} />
        </div>
    );
}

export function Project({ content }: P) {
    const p = content.project;
    return (
        <Section id="project" className="bg-white">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_520px]">
                <div className="flex flex-col items-start gap-7">
                    <SectionHeading eyebrow={p.eyebrow} title={p.title} />
                    <p className="text-soft text-lg leading-[1.75]">{p.body}</p>
                    <ul className="flex flex-col gap-5">
                        {p.features.map((f, i) => (
                            <li key={i} className="flex gap-3.5">
                                <CheckBadge />
                                <div>
                                    <p className="text-ink text-lg font-bold">{f.title}</p>
                                    <p className="text-soft text-base">{f.body}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <CtaButton variant="dark" onClick={goToForm}>
                        {p.cta_label}
                    </CtaButton>
                </div>
                <ImageOrPlaceholder
                    src={p.image}
                    alt={p.title}
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="aspect-[13/16] w-full rounded-[20px]"
                />
            </div>
        </Section>
    );
}

export function Plots({ content }: P) {
    const p = content.plots;
    const { ui } = useLandingI18n();
    return (
        <Section id="plots" className="bg-slate">
            <div className="flex flex-col gap-10">
                <SectionHeading eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} light />
                <div className="grid gap-6 md:grid-cols-2">
                    {p.items.map((it, i) => (
                        <article key={i} className="flex flex-col gap-5 rounded-[18px] border border-white/15 bg-white/[0.06] p-8 sm:p-10">
                            <h3 className="text-ochre text-[32px] leading-tight font-extrabold">{it.name}</h3>
                            <p className="text-[17px] text-white">{it.description}</p>
                            <dl className="flex flex-col">
                                {[
                                    [ui.areaFrom, it.area],
                                    [ui.permit, it.permit],
                                    [ui.available, it.count],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between border-t border-white/10 py-3.5">
                                        <dt className="text-base text-white">{k}</dt>
                                        <dd className="text-[17px] font-bold text-white">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                            <CtaButton variant="outline-light" onClick={goToForm} className="w-full">
                                {p.cta_label}
                            </CtaButton>
                        </article>
                    ))}
                </div>
            </div>
        </Section>
    );
}

export function Payment({ content }: P) {
    const p = content.payment;
    return (
        <Section id="payment" className="bg-white">
            <div className="flex flex-col gap-10">
                <SectionHeading eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} />
                <div className="grid gap-6 md:grid-cols-2">
                    {p.plans.map((pl, i) => (
                        <article
                            key={i}
                            className={cn(
                                'flex flex-col gap-6 rounded-[18px] p-8 sm:p-10',
                                pl.highlight ? 'border-terra bg-sand border-2' : 'border-line border bg-white',
                            )}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="text-ink text-[30px] font-extrabold">{pl.title}</h3>
                                {pl.tag && (
                                    <span
                                        className={cn(
                                            'rounded-full px-3.5 py-1 text-sm font-bold',
                                            pl.highlight ? 'bg-terra text-white' : 'bg-cream text-ink',
                                        )}
                                    >
                                        {pl.tag}
                                    </span>
                                )}
                            </div>
                            <ul className="flex flex-1 flex-col gap-[18px]">
                                {pl.rows.map((r, j) => (
                                    <li key={j} className="flex gap-3.5">
                                        <CheckBadge />
                                        <div>
                                            <p className="text-soft text-sm">{r.label}</p>
                                            <p className="text-ink text-lg font-bold">{r.value}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <CtaButton variant={pl.highlight ? 'primary' : 'dark'} onClick={goToForm} className="w-full">
                                {pl.cta_label}
                            </CtaButton>
                        </article>
                    ))}
                </div>
            </div>
        </Section>
    );
}

export function Gallery({ content }: P) {
    const g = content.gallery;
    if (!g.images.length) return null; // nothing to show until photos are uploaded
    const [first, ...rest] = g.images;
    return (
        <Section id="gallery" className="bg-cream">
            <div className="flex flex-col gap-10">
                <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                    <SectionHeading eyebrow={g.eyebrow} title={g.title} />
                    <CtaButton variant="dark" onClick={goToForm}>
                        {g.cta_label}
                    </CtaButton>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                    <img
                        src={first.url}
                        srcSet={srcSetFor(first.url)}
                        sizes="(min-width: 768px) 792px, 100vw"
                        decoding="async"
                        alt={first.alt}
                        loading="lazy"
                        className="col-span-2 aspect-[16/9] size-full rounded-2xl object-cover md:row-span-2 md:aspect-auto"
                    />
                    {rest.map((im, i) => (
                        <img
                            key={i}
                            src={im.url}
                            srcSet={srcSetFor(im.url)}
                            sizes="(min-width: 768px) 384px, 50vw"
                            decoding="async"
                            alt={im.alt}
                            loading="lazy"
                            className="aspect-[4/3] size-full rounded-2xl object-cover"
                        />
                    ))}
                </div>
            </div>
        </Section>
    );
}

export function Amenities({ content }: P) {
    const a = content.amenities;
    return (
        <Section id="amenities" className="bg-white">
            <div className="flex flex-col gap-10">
                <SectionHeading eyebrow={a.eyebrow} title={a.title} subtitle={a.subtitle} />
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
                    {a.items.map((it, i) => (
                        <li key={i} className="bg-cream flex flex-col items-center gap-4 rounded-2xl px-4 py-8 text-center">
                            <span className="bg-sand text-terra flex size-16 items-center justify-center rounded-full">
                                <AmenityGlyph icon={it.icon} className="size-7" />
                            </span>
                            <span className="text-ink text-lg font-bold">{it.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Section>
    );
}

export function Location({ content }: P) {
    const l = content.location;
    const { ui } = useLandingI18n();
    return (
        <Section id="location" className="bg-cream">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_560px]">
                <div className="flex flex-col items-start gap-6">
                    <SectionHeading eyebrow={l.eyebrow} title={l.title} />
                    <p className="text-soft text-lg leading-[1.75]">{l.body}</p>
                    <ul className="w-full">
                        {l.drive_times.map((d, i) => (
                            <li key={i} className="border-line flex items-center justify-between border-b py-3.5">
                                <span className="text-ink flex items-center gap-3 text-[17px] font-semibold">
                                    <Clock className="text-terra size-5" aria-hidden />
                                    {d.place}
                                </span>
                                <span className="text-terra-dark text-[17px] font-bold">
                                    {d.minutes} {ui.minutes}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {l.map_link && (
                        <CtaButton variant="dark" href={l.map_link}>
                            <MapPin className="size-5" aria-hidden />
                            {l.cta_label}
                        </CtaButton>
                    )}
                </div>
                {l.map_embed_url ? (
                    <iframe
                        src={l.map_embed_url}
                        title={l.title}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="aspect-[14/13] w-full rounded-[20px] border-0"
                        allowFullScreen
                    />
                ) : (
                    <div className="bg-stone flex aspect-[14/13] w-full flex-col items-center justify-center gap-3 rounded-[20px] text-center">
                        <MapPin className="text-terra size-11" aria-hidden />
                        <p className="text-ink text-[17px] font-bold">{l.title}</p>
                    </div>
                )}
            </div>
        </Section>
    );
}

export function Experience({ content }: P) {
    const e = content.experience;
    const { ui } = useLandingI18n();
    const testimonials = e.testimonials.filter((t) => t.quote.trim());
    return (
        <Section id="experience" className="bg-white">
            <div className="flex flex-col gap-10">
                <SectionHeading eyebrow={e.eyebrow} title={e.title} subtitle={e.body} />
                {e.projects.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-3">
                        {e.projects.map((p, i) => (
                            <article key={i} className="flex flex-col gap-3.5">
                                <ImageOrPlaceholder
                                    src={p.image}
                                    alt={p.name}
                                    sizes="(min-width: 768px) 384px, 100vw"
                                    className="aspect-[4/3] w-full rounded-2xl"
                                />
                                <h3 className="text-ink text-xl font-bold">{p.name}</h3>
                                <p className="text-soft text-[15px]">{p.meta}</p>
                            </article>
                        ))}
                    </div>
                )}
                {testimonials.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-3">
                        {testimonials.map((t, i) => (
                            <figure key={i} className="bg-cream flex flex-col gap-4 rounded-2xl p-8">
                                <span className="font-en text-terra text-5xl leading-none" aria-hidden>
                                    ”
                                </span>
                                <blockquote className="text-ink flex-1 text-[17px] leading-[1.7]">{t.quote}</blockquote>
                                <figcaption className="flex items-end justify-between gap-3">
                                    <div>
                                        <p className="text-ink font-bold">{t.name}</p>
                                        <p className="text-soft text-sm">{t.project}</p>
                                    </div>
                                    <span className="text-terra flex gap-0.5" role="img" aria-label={ui.fiveStars}>
                                        {Array.from({ length: 5 }).map((_, k) => (
                                            <Star key={k} className="size-4 fill-current" aria-hidden />
                                        ))}
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                )}
            </div>
        </Section>
    );
}

export function FinalCta({ content }: P) {
    const f = content.form;
    return (
        <section id="register" className="bg-terra py-16 md:py-28">
            <Container className="grid items-center gap-12 lg:grid-cols-[1fr_460px]">
                <div className="flex flex-col items-start gap-7">
                    <p className="text-[15px] font-bold text-white">{f.final_eyebrow}</p>
                    <h2 className="text-3xl leading-[1.3] font-extrabold text-white md:text-[44px]">
                        <Lines text={f.final_title} />
                    </h2>
                    <p className="max-w-[560px] text-lg leading-[1.7] text-white">{f.final_body}</p>
                    <ul className="flex flex-col gap-3.5">
                        {f.benefits.filter(Boolean).map((b) => (
                            <li key={b} className="flex items-center gap-3 text-[17px] font-semibold text-white">
                                <CheckBadge className="bg-ochre/25 text-ochre mt-0" />
                                {b}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex justify-center lg:justify-end">
                    <LeadForm content={content} title={f.final_form_title} location="final" anchorId={FORM_ANCHOR} />
                </div>
            </Container>
        </section>
    );
}

export function Faq({ content }: P) {
    const q = content.faq;
    const [open, setOpen] = useState<number | null>(0);
    return (
        <Section id="faq" className="bg-cream">
            <div className="mx-auto flex max-w-[840px] flex-col items-center gap-10">
                <SectionHeading eyebrow={q.eyebrow} title={q.title} center />
                <ul className="flex w-full flex-col gap-3">
                    {q.items.map((it, i) => {
                        const isOpen = open === i;
                        return (
                            <li key={i} className={cn('rounded-[14px] border bg-white', isOpen ? 'border-terra' : 'border-line')}>
                                <h3>
                                    <button
                                        type="button"
                                        className="text-ink flex w-full items-center justify-between gap-4 px-6 py-5 text-start text-[19px] font-bold sm:px-7"
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-${i}`}
                                        onClick={() => setOpen(isOpen ? null : i)}
                                    >
                                        {it.q}
                                        {isOpen ? (
                                            <Minus className="text-terra size-5 shrink-0" aria-hidden />
                                        ) : (
                                            <Plus className="text-terra size-5 shrink-0" aria-hidden />
                                        )}
                                    </button>
                                </h3>
                                <div id={`faq-${i}`} hidden={!isOpen} className="text-soft px-6 pb-6 text-[17px] leading-[1.7] sm:px-7">
                                    {it.a}
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <div className="flex flex-wrap items-center justify-center gap-5">
                    <span className="text-soft text-[17px]">{q.more_label}</span>
                    <CtaButton variant="dark" onClick={goToForm}>
                        {q.more_cta}
                    </CtaButton>
                </div>
            </div>
        </Section>
    );
}

export function Footer({ content }: P) {
    const b = content.brand;
    const { ui } = useLandingI18n();
    const enabled = new Set(content.sections.filter((s) => s.enabled).map((s) => s.key));
    return (
        <footer className="bg-ink pt-14 pb-28 text-white md:pb-14">
            <Container className="flex flex-col gap-8">
                <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
                    <div className="flex flex-col gap-3">
                        <BrandLogo content={content} light />
                        <p className="max-w-[360px] text-[15px] leading-relaxed text-white/65">{content.footer.about}</p>
                    </div>
                    <nav className="flex flex-col gap-2.5" aria-label={ui.quickLinks}>
                        <p className="text-ochre font-bold">{ui.quickLinks}</p>
                        {navItems(ui, enabled).map((n) => (
                            <a key={n.key} href={`#${n.key}`} className="text-[15px] text-white/75 hover:text-white">
                                {n.label}
                            </a>
                        ))}
                    </nav>
                    <div className="flex flex-col gap-2.5 text-[15px] text-white/75">
                        <p className="text-ochre font-bold">{ui.contactUs}</p>
                        <a href={telHref(b.phone)} className="hover:text-white">
                            {ui.phoneLabel} <span dir="ltr">{b.phone}</span>
                        </a>
                        {b.email && (
                            <a href={`mailto:${b.email}`} className="hover:text-white">
                                {ui.emailLabel} {b.email}
                            </a>
                        )}
                        {b.address && (
                            <p>
                                {ui.addressLabel} {b.address}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-white/55 md:flex-row">
                    <p>
                        © {new Date().getFullYear()} {b.name}. {ui.rights}
                        {b.license_no && ` ${ui.licence} ${b.license_no}`}
                    </p>
                    <p>{content.footer.disclaimer}</p>
                </div>
            </Container>
        </footer>
    );
}

/** Mobile-only bottom bar so the call / register actions are always one tap away. */
export function MobileCtaBar({ content }: P) {
    const { ui } = useLandingI18n();
    return (
        <div className="border-line bg-cream/95 fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t p-3 backdrop-blur md:hidden">
            <a
                href={telHref(content.brand.phone)}
                className="border-ink/30 text-ink inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-5 font-bold"
                aria-label={ui.callAria}
            >
                <Phone className="size-5" aria-hidden />
                {ui.call}
            </a>
            <CtaButton onClick={goToForm} className="flex-1 px-4 text-base whitespace-nowrap">
                {ui.getPrices}
            </CtaButton>
        </div>
    );
}

export const SECTION_COMPONENTS: Record<SectionKey, (p: P) => React.ReactNode> = {
    trust: TrustBar,
    offers: Offers,
    project: Project,
    plots: Plots,
    payment: Payment,
    gallery: Gallery,
    amenities: Amenities,
    location: Location,
    experience: Experience,
    final_cta: FinalCta,
    faq: Faq,
};

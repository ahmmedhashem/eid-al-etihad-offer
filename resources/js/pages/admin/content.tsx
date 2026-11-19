import { EditorDir, Field, SharedBadge, getPath, setPath, type FieldDef } from '@/admin/fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LandingContent } from '@/landing/types';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ExternalLink, LoaderCircle, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const SECTION_NAMES: Record<string, string> = {
    trust: 'Trust bar (stats)',
    offers: 'Offers + countdown',
    project: 'About the project',
    plots: 'Plot types',
    payment: 'Payment plans',
    gallery: 'Gallery (hidden until photos are uploaded)',
    amenities: 'Amenities',
    location: 'Location',
    experience: 'Experience & testimonials',
    final_cta: 'Lead form section',
    faq: 'FAQ',
};

const heading = (prefix: string): FieldDef[] => [
    { type: 'text', key: `${prefix}.eyebrow`, label: 'Eyebrow (small label above the title)' },
    { type: 'text', key: `${prefix}.title`, label: 'Title' },
];

function buildTabs(amenityIcons: string[]): { key: string; title: string; fields: FieldDef[] }[] {
    return [
        {
            key: 'hero',
            title: 'Campaign & hero',
            fields: [
                { type: 'text', key: 'campaign.badge', label: 'Campaign badge' },
                {
                    type: 'date',
                    key: 'campaign.offer_ends_at',
                    shared: true,
                    label: 'Offer end date',
                    help: 'Drives the countdown. Ends at 23:59 UAE time.',
                },
                { type: 'toggle', key: 'campaign.show_countdown', shared: true, label: 'Show countdown in the offers section' },
                {
                    type: 'image',
                    key: 'campaign.cobrand_logo',
                    shared: true,
                    label: 'Eid Al Etihad logo (co-branding)',
                    size: { h: 88, note: 'transparent PNG; shown 44 px tall in the header' },
                    help: 'Upload the official logo file from the brand guidelines asset link only (PNG/WebP). Do not edit, recolour or redraw it.',
                },
                { type: 'textarea', key: 'hero.title', label: 'Headline', help: 'Press Enter for a line break.' },
                { type: 'textarea', key: 'hero.subtitle', label: 'Sub-headline' },
                { type: 'list', key: 'hero.chips', label: 'Highlight chips', addLabel: 'Add chip' },
                { type: 'text', key: 'hero.cta_label', label: 'Main button label' },
                {
                    type: 'image',
                    key: 'hero.image',
                    label: 'Hero background photo (this language)',
                    size: { w: 2560, h: 1440, note: '16:9 landscape, JPG or WebP under 500 KB' },
                    help: 'Each language has its own photo — upload the Arabic version while editing العربية and the English version while editing English. Fills the whole first screen behind the cream frame, so keep any text in the photo away from the frame side (right in Arabic, left in English). Also used as this language’s share image if none is set.',
                },
            ],
        },
        {
            key: 'stats',
            title: 'Trust bar',
            fields: [
                {
                    type: 'repeater',
                    key: 'stats',
                    label: 'Stats',
                    itemTitle: 'Stat',
                    max: 4,
                    newItem: { value: '', label: '' },
                    fields: [
                        { type: 'text', key: 'value', label: 'Value' },
                        { type: 'text', key: 'label', label: 'Label' },
                    ],
                },
            ],
        },
        {
            key: 'offers',
            title: 'Offers',
            fields: [
                ...heading('offers'),
                {
                    type: 'repeater',
                    key: 'offers.items',
                    label: 'Offer cards',
                    itemTitle: 'Offer',
                    newItem: { tag: '', big: '', title: '', body: '' },
                    fields: [
                        { type: 'text', key: 'tag', label: 'Tag' },
                        { type: 'text', key: 'big', label: 'Big text' },
                        { type: 'text', key: 'title', label: 'Title' },
                        { type: 'textarea', key: 'body', label: 'Description' },
                    ],
                },
                { type: 'text', key: 'offers.urgency_title', label: 'Urgency bar title' },
                { type: 'text', key: 'offers.urgency_body', label: 'Urgency bar text' },
                { type: 'text', key: 'offers.urgency_cta', label: 'Urgency bar button' },
            ],
        },
        {
            key: 'project',
            title: 'About the project',
            fields: [
                ...heading('project'),
                { type: 'textarea', key: 'project.body', label: 'Paragraph' },
                {
                    type: 'repeater',
                    key: 'project.features',
                    label: 'Features',
                    itemTitle: 'Feature',
                    newItem: { title: '', body: '' },
                    fields: [
                        { type: 'text', key: 'title', label: 'Title' },
                        { type: 'text', key: 'body', label: 'Description' },
                    ],
                },
                { type: 'text', key: 'project.cta_label', label: 'Button label' },
                { type: 'image', key: 'project.image', shared: true, label: 'Project image', size: { w: 1040, h: 1280, note: 'portrait 13:16' } },
            ],
        },
        {
            key: 'plots',
            title: 'Plot types',
            fields: [
                ...heading('plots'),
                { type: 'textarea', key: 'plots.subtitle', label: 'Subtitle' },
                {
                    type: 'repeater',
                    key: 'plots.items',
                    label: 'Plots',
                    itemTitle: 'Plot',
                    newItem: { name: '', description: '', area: '', permit: 'G+2', count: '' },
                    fields: [
                        { type: 'text', key: 'name', label: 'Name' },
                        { type: 'text', key: 'description', label: 'Description' },
                        { type: 'text', key: 'area', label: 'Area from' },
                        { type: 'text', key: 'permit', label: 'Building permit' },
                        { type: 'text', key: 'count', label: 'Plots available' },
                    ],
                },
                { type: 'text', key: 'plots.cta_label', label: 'Card button label' },
                {
                    type: 'image',
                    key: 'plots.image',
                    shared: true,
                    label: 'Section background photo',
                    size: { w: 2560, h: 1440, note: 'wide landscape; shown behind a blue tint, so busy photos are fine' },
                    help: 'Optional. Leave empty for the plain blue background.',
                },
            ],
        },
        {
            key: 'payment',
            title: 'Payment plans',
            fields: [
                ...heading('payment'),
                { type: 'textarea', key: 'payment.subtitle', label: 'Subtitle' },
                {
                    type: 'repeater',
                    key: 'payment.plans',
                    label: 'Plans',
                    itemTitle: 'Plan',
                    newItem: { title: '', tag: '', highlight: false, cta_label: '', rows: [] },
                    fields: [
                        { type: 'text', key: 'title', label: 'Title' },
                        { type: 'text', key: 'tag', label: 'Tag' },
                        { type: 'text', key: 'cta_label', label: 'Button label' },
                        { type: 'toggle', key: 'highlight', label: 'Highlight this plan', shared: true },
                        {
                            type: 'repeater',
                            key: 'rows',
                            label: 'Rows',
                            itemTitle: 'Row',
                            newItem: { label: '', value: '' },
                            fields: [
                                { type: 'text', key: 'label', label: 'Label' },
                                { type: 'text', key: 'value', label: 'Value' },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            key: 'gallery',
            title: 'Gallery',
            fields: [
                ...heading('gallery'),
                { type: 'text', key: 'gallery.cta_label', label: 'Button label' },
                {
                    type: 'repeater',
                    key: 'gallery.images',
                    shared: true,
                    label: 'Photos',
                    help: 'The first photo is shown large. The section stays hidden until at least one photo is added.',
                    itemTitle: 'Photo',
                    max: 24,
                    newItem: { url: null, alt: '' },
                    fields: [
                        {
                            type: 'image',
                            key: 'url',
                            label: 'Photo',
                            size: { w: 1600, h: 1200, note: '4:3 landscape; the first photo is shown large' },
                        },
                        { type: 'text', key: 'alt', label: 'Description (for accessibility)' },
                    ],
                },
            ],
        },
        {
            key: 'amenities',
            title: 'Amenities',
            fields: [
                ...heading('amenities'),
                { type: 'textarea', key: 'amenities.subtitle', label: 'Subtitle' },
                {
                    type: 'repeater',
                    key: 'amenities.items',
                    label: 'Amenities',
                    itemTitle: 'Amenity',
                    newItem: { label: '', icon: 'store' },
                    fields: [
                        { type: 'text', key: 'label', label: 'Label' },
                        { type: 'select', key: 'icon', label: 'Icon', options: amenityIcons, shared: true },
                    ],
                },
            ],
        },
        {
            key: 'location',
            title: 'Location',
            fields: [
                ...heading('location'),
                { type: 'textarea', key: 'location.body', label: 'Paragraph' },
                {
                    type: 'repeater',
                    key: 'location.drive_times',
                    label: 'Drive times',
                    itemTitle: 'Place',
                    newItem: { place: '', minutes: '' },
                    fields: [
                        { type: 'text', key: 'place', label: 'Place' },
                        { type: 'text', key: 'minutes', label: 'Minutes' },
                    ],
                },
                {
                    type: 'url',
                    key: 'location.map_embed_url',
                    shared: true,
                    label: 'Google Maps embed URL',
                    help: 'Google Maps → Share → Embed a map → copy only the src link (starts with https://www.google.com/maps/embed).',
                },
                { type: 'url', key: 'location.map_link', shared: true, label: 'Google Maps link (button)', help: 'Leave empty to hide the button.' },
                { type: 'text', key: 'location.cta_label', label: 'Button label' },
            ],
        },
        {
            key: 'experience',
            title: 'Experience',
            fields: [
                ...heading('experience'),
                { type: 'textarea', key: 'experience.body', label: 'Paragraph' },
                {
                    type: 'repeater',
                    key: 'experience.projects',
                    label: 'Past projects',
                    itemTitle: 'Project',
                    newItem: { name: '', meta: '', image: null },
                    fields: [
                        { type: 'text', key: 'name', label: 'Name' },
                        { type: 'text', key: 'meta', label: 'City • year' },
                        { type: 'image', key: 'image', label: 'Photo', shared: true, size: { w: 1200, h: 900, note: '4:3 landscape' } },
                    ],
                },
                {
                    type: 'repeater',
                    key: 'experience.testimonials',
                    label: 'Testimonials',
                    help: 'Testimonials with an empty quote are hidden.',
                    itemTitle: 'Testimonial',
                    newItem: { quote: '', name: '', project: '' },
                    fields: [
                        { type: 'textarea', key: 'quote', label: 'Quote' },
                        { type: 'text', key: 'name', label: 'Client name' },
                        { type: 'text', key: 'project', label: 'Project' },
                    ],
                },
            ],
        },
        {
            key: 'form',
            title: 'Lead form',
            fields: [
                { type: 'text', key: 'form.final_form_title', label: 'Form title' },
                { type: 'textarea', key: 'form.subtitle', label: 'Form subtitle' },
                { type: 'list', key: 'form.plot_options', label: 'Plot type options', addLabel: 'Add option' },
                { type: 'list', key: 'form.payment_options', label: 'Payment options', addLabel: 'Add option' },
                { type: 'text', key: 'form.submit_label', label: 'Submit button' },
                { type: 'textarea', key: 'form.consent', label: 'Consent text under the button' },
                { type: 'text', key: 'form.success_title', label: 'Success title' },
                { type: 'textarea', key: 'form.success_body', label: 'Success message' },
                { type: 'text', key: 'form.final_eyebrow', label: 'Final section eyebrow' },
                { type: 'textarea', key: 'form.final_title', label: 'Final section title', help: 'Press Enter for a line break.' },
                { type: 'textarea', key: 'form.final_body', label: 'Final section paragraph' },
                { type: 'list', key: 'form.benefits', label: 'Final section benefits', addLabel: 'Add benefit' },
            ],
        },
        {
            key: 'faq',
            title: 'FAQ',
            fields: [
                ...heading('faq'),
                {
                    type: 'repeater',
                    key: 'faq.items',
                    label: 'Questions',
                    itemTitle: 'Question',
                    newItem: { q: '', a: '' },
                    fields: [
                        { type: 'text', key: 'q', label: 'Question' },
                        { type: 'textarea', key: 'a', label: 'Answer' },
                    ],
                },
                { type: 'text', key: 'faq.more_label', label: '“More questions” text' },
                { type: 'text', key: 'faq.more_cta', label: '“More questions” button' },
            ],
        },
        {
            key: 'brand',
            title: 'Brand & footer',
            fields: [
                { type: 'text', key: 'brand.name', label: 'Company name' },
                { type: 'text', key: 'brand.name_en', label: 'Second name line (small, under the name)' },
                {
                    type: 'image',
                    key: 'brand.logo',
                    shared: true,
                    label: 'Company logo',
                    size: { h: 88, note: 'transparent PNG; shown 44 px tall in the header' },
                    help: 'Optional. If empty, the company name is shown as text.',
                },
                { type: 'text', key: 'brand.phone', shared: true, label: 'Phone', ltr: true },
                { type: 'email', key: 'brand.email', shared: true, label: 'Email' },
                { type: 'text', key: 'brand.address', label: 'Address' },
                { type: 'text', key: 'brand.license_no', shared: true, label: 'License number' },
                { type: 'textarea', key: 'footer.about', label: 'Footer about text' },
                { type: 'text', key: 'footer.disclaimer', label: 'Footer disclaimer' },
            ],
        },
        {
            key: 'seo',
            title: 'SEO, pixels & alerts',
            fields: [
                { type: 'text', key: 'seo.title', label: 'Page title (Google & share previews)' },
                { type: 'textarea', key: 'seo.description', label: 'Meta description' },
                {
                    type: 'image',
                    key: 'seo.og_image',
                    shared: true,
                    label: 'Share image',
                    size: { w: 1200, h: 630, note: 'the standard size for WhatsApp, Facebook and X previews' },
                    help: 'Shown when the link is shared on WhatsApp, Facebook, X…',
                },
                { type: 'text', key: 'tracking.gtm_id', shared: true, label: 'Google Tag Manager ID', help: 'e.g. GTM-ABC1234', ltr: true },
                {
                    type: 'text',
                    key: 'tracking.meta_pixel_id',
                    shared: true,
                    label: 'Meta (Facebook/Instagram) Pixel ID',
                    help: 'Digits only. Fires PageView and Lead.',
                    ltr: true,
                },
                {
                    type: 'text',
                    key: 'tracking.tiktok_pixel_id',
                    shared: true,
                    label: 'TikTok Pixel ID',
                    help: 'Fires page and SubmitForm.',
                    ltr: true,
                },
                {
                    type: 'text',
                    key: 'tracking.snap_pixel_id',
                    shared: true,
                    label: 'Snapchat Pixel ID',
                    help: 'Fires PAGE_VIEW and SIGN_UP.',
                    ltr: true,
                },
                {
                    type: 'email',
                    key: 'notifications.email',
                    shared: true,
                    label: 'Email new leads to',
                    help: 'Leave empty to disable. Needs mail settings in .env (MAIL_*).',
                },
            ],
        },
    ];
}

/** Laravel turns empty strings into null, so compare the two as equal when checking for unsaved changes. */
const snapshot = (o: unknown) => JSON.stringify(o, (_k, v) => (v === '' ? null : v));

/** Finds admin-facing "[...]" placeholders that still need real values. */
function findPlaceholders(obj: unknown, path = ''): string[] {
    if (typeof obj === 'string') return /\[[^\]]*\]/.test(obj) ? [path] : [];
    if (Array.isArray(obj)) return obj.flatMap((v, i) => findPlaceholders(v, `${path}.${i}`));
    if (obj && typeof obj === 'object') return Object.entries(obj).flatMap(([k, v]) => findPlaceholders(v, path ? `${path}.${k}` : k));
    return [];
}

type Locale = 'ar' | 'en';

const LOCALE_NAMES: Record<Locale, string> = { ar: 'العربية', en: 'English' };

interface Props {
    locale: Locale;
    content: LandingContent;
    sectionKeys: string[];
    alwaysOn: string[];
    amenityIcons: string[];
}

export default function ContentEditor({ locale, content: initial, amenityIcons, alwaysOn }: Props) {
    const { errors, flash } = usePage<{ errors: Record<string, string>; flash: { success?: string } }>().props;
    const tabs = useMemo(() => buildTabs(amenityIcons), [amenityIcons]);
    const [content, setContent] = useState<LandingContent>(initial);
    const [saved, setSaved] = useState<string>(snapshot(initial));
    const [tab, setTab] = useState<string>(() => (typeof window !== 'undefined' && window.location.hash.slice(1)) || 'hero');
    const [saving, setSaving] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    const dirty = snapshot(content) !== saved;
    const placeholders = useMemo(() => findPlaceholders(content).filter((p) => !p.startsWith('seo') && !p.startsWith('tracking')), [content]);

    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (dirty) e.preventDefault();
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    // Jump to the tab that holds the first validation error.
    useEffect(() => {
        const first = Object.keys(errors)[0];
        if (!first) return;
        const path = first.replace(/^content\./, '');
        const owner = tabs.find((t) => t.fields.some((f) => path === f.key || path.startsWith(`${f.key}.`)));
        if (owner) setTab(owner.key);
    }, [errors, tabs]);

    const save = () => {
        setSaving(true);
        router.put(
            '/dashboard/content',
            // Inertia's payload type doesn't model nested unknown objects; the shape is validated server-side.
            { locale, content: content as never },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as Props).content;
                    setContent(fresh);
                    setSaved(snapshot(fresh));
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    const reset = () =>
        router.post(
            '/dashboard/content/reset',
            { locale },
            {
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as Props).content;
                    setContent(fresh);
                    setSaved(snapshot(fresh));
                    setConfirmReset(false);
                },
            },
        );

    const active = tabs.find((t) => t.key === tab);
    const moveSection = (i: number, d: number) => {
        const next = [...content.sections];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        setContent({ ...content, sections: next });
    };

    const tabErrorCount = (t: { fields: FieldDef[] }) =>
        Object.keys(errors).filter((k) => {
            const p = k.replace(/^content\./, '');
            return t.fields.some((f) => p === f.key || p.startsWith(`${f.key}.`));
        }).length;

    return (
        <AppLayout breadcrumbs={[{ title: 'Page content', href: '/dashboard/content' }]}>
            <Head title="Page content" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="bg-background/95 sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-muted inline-flex rounded-lg p-1" role="group" aria-label="Language being edited">
                            {(['ar', 'en'] as Locale[]).map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    aria-pressed={locale === l}
                                    onClick={() => {
                                        if (l === locale) return;
                                        if (dirty && !window.confirm('You have unsaved changes. Switch language and discard them?')) return;
                                        router.get('/dashboard/content', { locale: l }, { preserveScroll: true });
                                    }}
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        locale === l ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {LOCALE_NAMES[l]}
                                </button>
                            ))}
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Page content</h1>
                            <p className="text-muted-foreground text-sm">
                                {dirty ? 'You have unsaved changes.' : flash?.success ? flash.success : 'Everything is saved.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" onClick={() => setConfirmReset(true)}>
                            <RotateCcw className="size-4" /> Reset to defaults
                        </Button>
                        <Button variant="outline" asChild>
                            <a href={locale === 'en' ? '/en' : '/'} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-4" /> Preview page
                            </a>
                        </Button>
                        <Button onClick={save} disabled={!dirty || saving}>
                            {saving ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                            Save changes
                        </Button>
                    </div>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
                        Some fields need attention — they’re marked in red. Nothing was saved.
                    </div>
                )}

                {placeholders.length > 0 && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <div>
                            <p className="font-medium">
                                {placeholders.length} field{placeholders.length === 1 ? '' : 's'} still contain a [placeholder] visitors will see.
                            </p>
                            <p className="mt-1 opacity-80">
                                In:{' '}
                                {[
                                    ...new Set(
                                        placeholders.map(
                                            (p) => tabs.find((t) => t.fields.some((f) => p === f.key || p.startsWith(`${f.key}.`)))?.title ?? p,
                                        ),
                                    ),
                                ].join(', ')}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Content sections">
                        {[{ key: 'sections', title: 'Section order', fields: [] as FieldDef[] }, ...tabs].map((t) => {
                            const errs = tabErrorCount(t);
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => {
                                        setTab(t.key);
                                        history.replaceState(null, '', `#${t.key}`);
                                    }}
                                    className={cn(
                                        'flex shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm whitespace-nowrap transition-colors',
                                        tab === t.key ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                    )}
                                >
                                    {t.title}
                                    {errs > 0 && <span className="bg-destructive rounded-full px-1.5 text-[11px] text-white">{errs}</span>}
                                </button>
                            );
                        })}
                    </nav>

                    <EditorDir.Provider value={locale === 'ar' ? 'rtl' : 'ltr'}>
                        <Card className="p-5 md:p-6">
                            {tab === 'sections' ? (
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <h2 className="font-semibold">Section order & visibility</h2>
                                        <p className="text-muted-foreground text-sm">
                                            The header, hero form and footer are always shown. Untick a section to hide it. Order and visibility apply
                                            to both languages.
                                            <SharedBadge />
                                        </p>
                                    </div>
                                    <ul className="flex flex-col gap-2">
                                        {content.sections.map((s, i) => (
                                            <li key={s.key} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                                                <label className="flex items-center gap-3 text-sm">
                                                    <Checkbox
                                                        checked={s.enabled}
                                                        disabled={alwaysOn.includes(s.key)}
                                                        onCheckedChange={(c) =>
                                                            setContent({
                                                                ...content,
                                                                sections: content.sections.map((x, j) =>
                                                                    j === i ? { ...x, enabled: c === true } : x,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                    <span className={cn(!s.enabled && 'text-muted-foreground line-through')}>
                                                        {SECTION_NAMES[s.key] ?? s.key}
                                                    </span>
                                                    {alwaysOn.includes(s.key) && (
                                                        <span className="text-muted-foreground text-xs">
                                                            Always shown — every button scrolls to this form
                                                        </span>
                                                    )}
                                                </label>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled={i === 0}
                                                        onClick={() => moveSection(i, -1)}
                                                        aria-label="Move up"
                                                    >
                                                        <ArrowUp className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled={i === content.sections.length - 1}
                                                        onClick={() => moveSection(i, 1)}
                                                        aria-label="Move down"
                                                    >
                                                        <ArrowDown className="size-4" />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                active && (
                                    <div className="flex flex-col gap-5">
                                        <h2 className="font-semibold">
                                            {active.title} <span className="text-muted-foreground font-normal">· {LOCALE_NAMES[locale]}</span>
                                        </h2>
                                        {active.fields.map((f) => (
                                            <Field
                                                key={f.key}
                                                def={f}
                                                value={getPath(content, f.key)}
                                                onChange={(v) => setContent((c) => setPath(c, f.key, v))}
                                                errors={errors}
                                                errorPath={`content.${f.key}`}
                                            />
                                        ))}
                                    </div>
                                )
                            )}
                        </Card>
                    </EditorDir.Provider>
                </div>
            </div>

            <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset the {LOCALE_NAMES[locale]} content?</DialogTitle>
                        <DialogDescription>
                            Every {locale === 'en' ? 'English' : 'Arabic'} text goes back to the original copy.
                            {locale === 'ar' && ' Shared settings (images, phone, offer date, pixels, section order) are reset too.'} Leads are not
                            affected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={reset}>
                            Reset content
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

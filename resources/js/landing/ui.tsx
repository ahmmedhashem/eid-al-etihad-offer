import { cn } from '@/lib/utils';
import { Dumbbell, Moon, Route, School, ShieldCheck, ShoppingBag, SquareParking, Stethoscope, Store, TreePine, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLandingI18n } from './i18n';
import type { AmenityIcon } from './types';

export const FORM_ANCHOR = 'lead-form';

/**
 * Element IDs and dataLayer events used by Google Tag Manager (see README → "Tracking with Google Tag Manager").
 * Keep these stable: GTM triggers depend on them.
 */
export const TRACKING_IDS = {
    submit: 'lead-form-submit',
    callHeader: 'call-header',
    callMobileBar: 'call-mobile-bar',
    callFooter: 'call-footer',
} as const;

declare global {
    interface Window {
        dataLayer?: object[];
    }
}

/** Tells GTM a phone link was tapped (event "phone_call_click"). */
export function trackCall(callLocation: 'header' | 'mobile_bar' | 'footer', language: string) {
    window.dataLayer?.push({ event: 'phone_call_click', call_location: callLocation, language });
}

const VARIANT_WIDTHS = [640, 1280, 1920];

/**
 * Optimized uploads are named "{id}-{width}w.webp" with 640/1280/1920px copies (see app/Support/ImageOptimizer.php).
 * Returns the srcset for those, or undefined for older/other images.
 */
export function srcSetFor(url: string | null | undefined): string | undefined {
    const m = url?.match(/^(.*)-(\d+)w\.webp$/);
    if (!m) return undefined;
    const full = Number(m[2]);
    return [...VARIANT_WIDTHS.filter((w) => w < full), full].map((w) => `${m[1]}-${w}w.webp ${w}w`).join(', ');
}

/** Scroll to the hero form and focus its first field. */
export function goToForm() {
    const el = document.getElementById(FORM_ANCHOR);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => el.querySelector<HTMLInputElement>('input:not([type=hidden])')?.focus({ preventScroll: true }), 450);
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-0', className)}>{children}</div>;
}

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
    return (
        <section id={id} className={cn('scroll-mt-20 py-16 md:py-24', className)}>
            <Container>{children}</Container>
        </section>
    );
}

export function SectionHeading({
    eyebrow,
    title,
    subtitle,
    light,
    center,
    className,
}: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    light?: boolean;
    center?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-3', center && 'items-center text-center', className)}>
            {eyebrow && <p className={cn('text-[15px] font-bold', light ? 'text-sand' : 'text-terra-dark')}>{eyebrow}</p>}
            <h2 className={cn('text-3xl leading-[1.3] font-extrabold md:text-[40px]', light ? 'text-white' : 'text-ink')}>{title}</h2>
            {subtitle && <p className={cn('max-w-[760px] text-lg leading-relaxed', light ? 'text-white/90' : 'text-soft')}>{subtitle}</p>}
        </div>
    );
}

type ButtonVariant = 'primary' | 'dark' | 'outline-light' | 'outline';

export function CtaButton({
    children,
    variant = 'primary',
    className,
    onClick,
    type = 'button',
    disabled,
    href,
    id,
}: {
    children: ReactNode;
    id?: string;
    variant?: ButtonVariant;
    className?: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
    href?: string;
}) {
    const styles: Record<ButtonVariant, string> = {
        primary: 'bg-flag-red text-white hover:bg-flag-red-dark',
        dark: 'bg-ink text-white hover:bg-black',
        'outline-light': 'border-[1.5px] border-white/70 text-white hover:bg-white/10',
        outline: 'border-[1.5px] border-ink/30 text-ink hover:bg-ink/5',
    };
    const cls = cn(
        'focus-visible:outline-ochre inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] px-7 py-3 text-[17px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60',
        styles[variant],
        className,
    );
    if (href) {
        return (
            <a id={id} href={href} className={cls} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                {children}
            </a>
        );
    }
    return (
        <button id={id} type={type} onClick={onClick} disabled={disabled} className={cls}>
            {children}
        </button>
    );
}

/** Celebration accents — per the brand rules they are only placed around frames/containers. */
type ConfettiPiece = { top?: string; bottom?: string; left?: string; right?: string; w: number; h: number; r: number; c: string };

export function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
    const { dir } = useLandingI18n();
    // Positions are authored for RTL; mirror them for LTR so they follow the mirrored frame.
    const placed = dir === 'rtl' ? pieces : pieces.map((p) => ({ ...p, left: p.right, right: p.left, r: -p.r }));
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
            {placed.map((p, i) => (
                <span
                    key={i}
                    className="absolute rounded-[1.5px]"
                    style={{
                        top: p.top,
                        bottom: p.bottom,
                        left: p.left,
                        right: p.right,
                        width: p.w,
                        height: p.h,
                        transform: `rotate(${p.r}deg)`,
                        background: p.c,
                    }}
                />
            ))}
        </div>
    );
}

export const BRAND_CONFETTI = {
    red: '#a93a3d',
    green: '#4e8a4e',
    ochre: '#e4ca7c',
    slate: '#3f6a80',
    teal: '#3e8b87',
};

const AMENITY_ICONS: Record<AmenityIcon, LucideIcon> = {
    store: Store,
    bag: ShoppingBag,
    clinic: Stethoscope,
    mosque: Moon,
    tree: TreePine,
    school: School,
    gym: Dumbbell,
    parking: SquareParking,
    road: Route,
    shield: ShieldCheck,
};

export function AmenityGlyph({ icon, className }: { icon: AmenityIcon; className?: string }) {
    const Icon = AMENITY_ICONS[icon] ?? Store;
    return <Icon className={className} strokeWidth={1.8} aria-hidden />;
}

/** Renders "\n" in admin-entered text as line breaks without using innerHTML. */
export function Lines({ text }: { text: string }) {
    const parts = text.split('\n');
    return (
        <>
            {parts.map((p, i) => (
                <span key={i}>
                    {p}
                    {i < parts.length - 1 && <br />}
                </span>
            ))}
        </>
    );
}

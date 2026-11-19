import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Plus, Ruler, Trash2, X } from 'lucide-react';
import { createContext, useContext, useId, useState } from 'react';

/** Text direction of the language being edited (Arabic = rtl, English = ltr). */
export const EditorDir = createContext<'rtl' | 'ltr'>('rtl');

/* ---------- Schema ---------- */

/**
 * Recommended upload size in px (2× the displayed size so it stays sharp on phones/retina screens).
 * Omit `h` when only the width matters (or `w` when only the height matters, e.g. logos).
 */
export interface ImageSize {
    w?: number;
    h?: number;
    note?: string;
}

function formatSize(size: ImageSize) {
    if (size.w && size.h) return `${size.w} × ${size.h} px`;
    if (size.h) return `${size.h} px tall (width follows the file)`;
    return `${size.w} px wide`;
}

/** `shared`: the value is language-independent — editing it changes both Arabic and English. */
export type FieldDef = (
    | { type: 'text' | 'textarea' | 'date' | 'email' | 'url'; key: string; label: string; help?: string; ltr?: boolean }
    | { type: 'image'; key: string; label: string; help?: string; size?: ImageSize }
    | { type: 'toggle'; key: string; label: string; help?: string }
    | { type: 'select'; key: string; label: string; options: string[]; help?: string }
    | { type: 'list'; key: string; label: string; help?: string; addLabel?: string }
    | {
          type: 'repeater';
          key: string;
          label: string;
          help?: string;
          fields: FieldDef[];
          newItem: Record<string, unknown>;
          itemTitle?: string;
          max?: number;
      }
) & { shared?: boolean };

export function SharedBadge() {
    return (
        <span
            className="ml-2 rounded-full bg-sky-100 px-1.5 py-0.5 align-middle text-[10px] font-medium text-sky-800 dark:bg-sky-500/20 dark:text-sky-200"
            title="Used by both the Arabic and English pages"
        >
            Shared
        </span>
    );
}

/* ---------- Path helpers ---------- */

export function getPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}

export function setPath<T>(obj: T, path: string, value: unknown): T {
    const [head, ...rest] = path.split('.');
    const src = (obj ?? {}) as Record<string, unknown>;
    const copy = (Array.isArray(src) ? [...src] : { ...src }) as Record<string, unknown>;
    copy[head] = rest.length ? setPath(src[head], rest.join('.'), value) : value;
    return copy as T;
}

/* ---------- Upload ---------- */

function xsrfToken() {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

async function uploadImage(file: File): Promise<string> {
    if (file.size > 15 * 1024 * 1024) throw new Error('This file is over 15 MB. Please export a smaller version (see the recommended size).');
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/dashboard/uploads', {
        method: 'POST',
        body,
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrfToken() },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.errors?.file?.[0] ?? json?.message ?? 'Upload failed');
    return json.url as string;
}

/* ---------- Field components ---------- */

const textareaCls =
    'border-input bg-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-hidden';

function FieldShell({
    label,
    help,
    error,
    htmlFor,
    shared,
    children,
}: {
    label: string;
    help?: string;
    error?: string;
    htmlFor?: string;
    shared?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={htmlFor}>
                {label}
                {shared && <SharedBadge />}
            </Label>
            {children}
            {help && <p className="text-muted-foreground text-xs">{help}</p>}
            {error && <p className="text-destructive text-xs font-medium">{error}</p>}
        </div>
    );
}

function ImageField({
    value,
    onChange,
    label,
    help,
    error,
    shared,
    size,
}: {
    value: string | null;
    onChange: (v: string | null) => void;
    label: string;
    help?: string;
    error?: string;
    shared?: boolean;
    size?: ImageSize;
}) {
    const id = useId();
    const [busy, setBusy] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [actual, setActual] = useState<{ w: number; h: number } | null>(null);
    // Warn when the uploaded file is clearly smaller than recommended (it would look blurry).
    const tooSmall = !!(actual && size && ((size.w && actual.w < size.w * 0.75) || (size.h && actual.h < size.h * 0.75)));
    return (
        <FieldShell label={label} help={help} error={error ?? uploadError ?? undefined} htmlFor={id} shared={shared}>
            {size && (
                <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
                    <Ruler className="size-3.5" aria-hidden />
                    <span>
                        Recommended size: <strong className="text-foreground font-semibold">{formatSize(size)}</strong>
                        {size.note && ` — ${size.note}`}
                    </span>
                </p>
            )}
            <div className="flex items-center gap-3">
                <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                    {value ? (
                        <img
                            src={value}
                            alt=""
                            className="size-full object-cover"
                            onLoad={(e) => setActual({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                        />
                    ) : (
                        <ImagePlus className="text-muted-foreground size-6" />
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" asChild disabled={busy}>
                        <label htmlFor={id} className="cursor-pointer">
                            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                            {value ? 'Replace' : 'Upload'}
                        </label>
                    </Button>
                    {value && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                            <X className="size-4" /> Remove
                        </Button>
                    )}
                    <input
                        id={id}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            setBusy(true);
                            setUploadError(null);
                            try {
                                onChange(await uploadImage(file));
                            } catch (err) {
                                setUploadError((err as Error).message);
                            } finally {
                                setBusy(false);
                            }
                        }}
                    />
                </div>
            </div>
            {value && actual && (
                <p className={cn('flex items-center gap-1.5 text-xs', tooSmall ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>
                    {tooSmall && <AlertTriangle className="size-3.5" aria-hidden />}
                    Current image: {actual.w} × {actual.h} px{tooSmall && ' — smaller than recommended, it may look blurry'}
                </p>
            )}
        </FieldShell>
    );
}

function ListField({
    value,
    onChange,
    label,
    help,
    error,
    addLabel,
}: {
    value: string[];
    onChange: (v: string[]) => void;
    label: string;
    help?: string;
    error?: string;
    addLabel?: string;
}) {
    const dir = useContext(EditorDir);
    const items = value ?? [];
    return (
        <FieldShell label={label} help={help} error={error}>
            <div className="flex flex-col gap-2">
                {items.map((v, i) => (
                    <div key={i} className="flex gap-2">
                        <Input value={v} dir={dir} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onChange(items.filter((_, j) => j !== i))}
                            aria-label="Remove"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...items, ''])}>
                    <Plus className="size-4" /> {addLabel ?? 'Add'}
                </Button>
            </div>
        </FieldShell>
    );
}

function RepeaterField({
    def,
    value,
    onChange,
    errors,
    errorPrefix,
}: {
    def: Extract<FieldDef, { type: 'repeater' }>;
    value: Record<string, unknown>[];
    onChange: (v: Record<string, unknown>[]) => void;
    errors: Record<string, string>;
    errorPrefix: string;
}) {
    const items = value ?? [];
    const move = (i: number, d: number) => {
        const next = [...items];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        onChange(next);
    };
    return (
        <div className="flex flex-col gap-2">
            <div>
                <Label>
                    {def.label}
                    {def.shared && <SharedBadge />}
                </Label>
                {def.help && <p className="text-muted-foreground mt-1 text-xs">{def.help}</p>}
            </div>
            <div className="flex flex-col gap-3">
                {items.map((item, i) => (
                    <div key={i} className="bg-muted/30 rounded-lg border p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                {def.itemTitle ?? 'Item'} {i + 1}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    disabled={i === 0}
                                    onClick={() => move(i, -1)}
                                    aria-label="Move up"
                                >
                                    <ArrowUp className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    disabled={i === items.length - 1}
                                    onClick={() => move(i, 1)}
                                    aria-label="Move down"
                                >
                                    <ArrowDown className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                                    aria-label="Remove item"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {def.fields.map((f) => (
                                <div
                                    key={f.key}
                                    className={cn((f.type === 'textarea' || f.type === 'repeater' || f.type === 'list') && 'md:col-span-2')}
                                >
                                    <Field
                                        def={f}
                                        value={item[f.key]}
                                        onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, [f.key]: v } : x)))}
                                        errors={errors}
                                        errorPath={`${errorPrefix}.${i}.${f.key}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {(!def.max || items.length < def.max) && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => onChange([...items, structuredClone(def.newItem)])}
                >
                    <Plus className="size-4" /> Add {def.itemTitle?.toLowerCase() ?? 'item'}
                </Button>
            )}
        </div>
    );
}

export function Field({
    def,
    value,
    onChange,
    errors,
    errorPath,
}: {
    def: FieldDef;
    value: unknown;
    onChange: (v: unknown) => void;
    errors: Record<string, string>;
    errorPath: string;
}) {
    const id = useId();
    const dir = useContext(EditorDir);
    const error = errors[errorPath];
    switch (def.type) {
        case 'text':
        case 'email':
        case 'url':
        case 'date':
            return (
                <FieldShell label={def.label} help={def.help} error={error} htmlFor={id} shared={def.shared}>
                    <Input
                        id={id}
                        type={def.type === 'text' ? 'text' : def.type}
                        dir={def.ltr || def.type !== 'text' ? 'ltr' : dir}
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        aria-invalid={!!error}
                    />
                </FieldShell>
            );
        case 'textarea':
            return (
                <FieldShell label={def.label} help={def.help} error={error} htmlFor={id} shared={def.shared}>
                    <textarea id={id} dir={dir} className={textareaCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
                </FieldShell>
            );
        case 'toggle':
            return (
                <div className="flex items-start gap-3 pt-6">
                    <Checkbox id={id} checked={!!value} onCheckedChange={(c) => onChange(c === true)} />
                    <div className="grid gap-1">
                        <Label htmlFor={id}>
                            {def.label}
                            {def.shared && <SharedBadge />}
                        </Label>
                        {def.help && <p className="text-muted-foreground text-xs">{def.help}</p>}
                    </div>
                </div>
            );
        case 'select':
            return (
                <FieldShell label={def.label} help={def.help} error={error} htmlFor={id} shared={def.shared}>
                    <select
                        id={id}
                        className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                    >
                        {def.options.map((o) => (
                            <option key={o}>{o}</option>
                        ))}
                    </select>
                </FieldShell>
            );
        case 'image':
            return (
                <ImageField
                    label={def.label}
                    help={def.help}
                    error={error}
                    shared={def.shared}
                    size={def.size}
                    value={(value as string) ?? null}
                    onChange={onChange}
                />
            );
        case 'list':
            return (
                <ListField
                    label={def.label}
                    help={def.help}
                    error={error}
                    addLabel={def.addLabel}
                    value={(value as string[]) ?? []}
                    onChange={onChange}
                />
            );
        case 'repeater':
            return (
                <RepeaterField
                    def={def}
                    value={(value as Record<string, unknown>[]) ?? []}
                    onChange={onChange}
                    errors={errors}
                    errorPrefix={errorPath}
                />
            );
    }
}

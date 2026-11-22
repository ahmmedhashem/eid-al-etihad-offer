import { cn } from '@/lib/utils';

/** Accessible on/off toggle (role="switch"). */
export function Switch({
    checked,
    onCheckedChange,
    disabled,
    id,
    label,
    className,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
    /** Accessible name when there's no visible <label htmlFor>. */
    label?: string;
    className?: string;
}) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'focus-visible:ring-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-60',
                checked ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700',
                className,
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'inline-block size-5 rounded-full bg-white shadow transition-transform',
                    checked ? 'translate-x-[22px]' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}

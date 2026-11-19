export const STATUS_LABELS: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    won: 'Won',
    lost: 'Lost',
};

export const STATUS_STYLES: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
    contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    qualified: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
    won: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    lost: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-300',
};

export function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' });
}

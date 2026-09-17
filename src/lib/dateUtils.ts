// Shared helpers for the Due Time field, which now stores a native
// datetime-local value ('YYYY-MM-DDTHH:mm') instead of free text.

// Matches the convention already used when tasks are created (date column
// in the sheet) — used both client-side (dashboard) and server-side (EOD
// lock check) so "today" means the same thing on both ends.
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function defaultDueDateTime(): string {
  const d = new Date();
  d.setHours(17, 0, 0, 0); // default to 5:00 PM today
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDueTime(value: string): string {
  if (!value) return '';
  // Legacy free-text values (e.g. "5:00 PM", "before 6") predate the datetime-local
  // picker and aren't parseable as a date — show them as-is rather than mangling them.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

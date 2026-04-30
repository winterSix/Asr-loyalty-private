/** Capitalises the first letter of every word; safe for null/undefined. */
export function toTitleCase(str?: string | null): string {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

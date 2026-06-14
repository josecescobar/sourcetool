// Display formatters that degrade to an em dash when data is missing, so the
// analysis panels render cleanly regardless of what the API returns.

const DASH = '—';

export function money(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return DASH;
  return `$${value.toFixed(2)}`;
}

export function percent(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return DASH;
  return `${value.toFixed(digits)}%`;
}

export function integer(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return DASH;
  return value.toLocaleString();
}

export const dash = DASH;

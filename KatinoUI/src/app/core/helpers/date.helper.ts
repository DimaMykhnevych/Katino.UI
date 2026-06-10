export function toUtcStartOfDay(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  ).toISOString();
}

export function toUtcEndOfDay(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  ).toISOString();
}

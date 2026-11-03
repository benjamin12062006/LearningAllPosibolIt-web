const DATE_FORMAT = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const SIZE_UNITS = ['B', 'KB', 'MB'] as const;

export function formatDate(isoDate: string) {
  return DATE_FORMAT.format(new Date(isoDate));
}

/** 1 KB = 1024 B, como cuenta la API sus límites (10 MiB). */
export function formatBytes(bytes: number) {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${SIZE_UNITS[unit]}`;
}

const dateOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
} as const;

const dateTimeOptions = {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
} as const;

const dateFormats = {
  en: new Intl.DateTimeFormat('en-US', dateOptions),
  es: new Intl.DateTimeFormat('es', dateOptions),
};
const dateTimeFormats = {
  en: new Intl.DateTimeFormat('en-US', dateTimeOptions),
  es: new Intl.DateTimeFormat('es', dateTimeOptions),
};

const SIZE_UNITS = ['B', 'KB', 'MB'] as const;

export function formatDate(isoDate: string, language: 'en' | 'es' = 'en') {
  return dateFormats[language].format(new Date(isoDate));
}

export function formatDateTime(isoDate: string, language: 'en' | 'es' = 'en') {
  return dateTimeFormats[language].format(new Date(isoDate));
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

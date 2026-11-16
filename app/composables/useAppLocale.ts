import messages from '../locales/en';
import { formatDate, formatDateTime } from '../utils/format';

export type AppLanguage = 'en' | 'es';

export function useAppLocale() {
  const language = useState<AppLanguage>('app-language', () => 'en');

  function t(spanish: string, values: readonly unknown[] = []) {
    const text =
      language.value === 'en' && Object.hasOwn(messages, spanish)
        ? (messages[spanish] ?? spanish)
        : spanish;
    return values.length
      ? text.replace(/\{(\d+)\}/gu, (_, index: string) =>
          String(values[Number(index)] ?? ''),
        )
      : text;
  }

  return {
    language,
    t,
    formatDate: (date: string) => formatDate(date, language.value),
    formatDateTime: (date: string) => formatDateTime(date, language.value),
  };
}

export function useAppLocaleSetup() {
  const stored = useCookie<AppLanguage>('ktsu-language', {
    default: () => 'en',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    path: '/',
  });
  const { language, t } = useAppLocale();
  language.value = stored.value === 'es' ? 'es' : 'en';
  watch(language, (value) => {
    stored.value = value;
  });
  return { language, t };
}

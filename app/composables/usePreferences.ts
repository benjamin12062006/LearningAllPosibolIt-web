import {
  DEFAULT_PREFERENCES,
  effectiveMascot,
  readPreferences,
  type MascotPreference,
  type MotionPreference,
  type Preferences,
} from '../utils/preferences';

const STORAGE_KEY = 'preferencias';

/**
 * Preferencias de movimiento y de mascota. Se guardan en el navegador y el
 * movimiento reducido se marca en `<html data-motion>`, que es donde lo lee
 * `main.css`. No llevan datos de la cuenta: sobreviven al cierre de sesión.
 */
export function usePreferences() {
  const preferences = useState<Preferences>(
    'preferences',
    () => DEFAULT_PREFERENCES,
  );
  const systemPrefersLessMotion = useState('system-less-motion', () => false);

  const mascot = computed(() =>
    effectiveMascot(preferences.value, systemPrefersLessMotion.value),
  );
  const hasLessMotion = computed(
    () =>
      preferences.value.motion === 'reduced' || systemPrefersLessMotion.value,
  );

  function setMotion(motion: MotionPreference) {
    save({ ...preferences.value, motion });
  }

  function setMascot(choice: MascotPreference) {
    save({ ...preferences.value, mascot: choice });
  }

  function save(next: Preferences) {
    preferences.value = next;
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  return { preferences, mascot, hasLessMotion, setMotion, setMascot };
}

/**
 * Lee lo guardado y sigue la preferencia del sistema. Se llama una vez, desde
 * `app.vue`: el resto de la app solo usa `usePreferences`.
 */
export function usePreferencesSetup() {
  const preferences = useState<Preferences>(
    'preferences',
    () => DEFAULT_PREFERENCES,
  );
  const systemPrefersLessMotion = useState('system-less-motion', () => false);

  useHead({
    htmlAttrs: { 'data-motion': computed(() => preferences.value.motion) },
  });

  onMounted(() => {
    preferences.value = readPreferences(localStorage.getItem(STORAGE_KEY));

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    systemPrefersLessMotion.value = query.matches;
    const follow = (event: MediaQueryListEvent) => {
      systemPrefersLessMotion.value = event.matches;
    };
    query.addEventListener('change', follow);
    onBeforeUnmount(() => query.removeEventListener('change', follow));
  });
}

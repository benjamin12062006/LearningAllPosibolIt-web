/**
 * Ajustes de la persona que solo viven en su navegador (plan ui 04, §6 y §8):
 * cuánto movimiento quiere y cómo quiere ver la mascota del asistente.
 */
export const MOTION_PREFERENCES = ['full', 'reduced'] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export const MASCOT_PREFERENCES = ['animated', 'still', 'hidden'] as const;
export type MascotPreference = (typeof MASCOT_PREFERENCES)[number];

export interface Preferences {
  motion: MotionPreference;
  mascot: MascotPreference;
}

export const DEFAULT_PREFERENCES: Preferences = {
  motion: 'full',
  mascot: 'animated',
};

export const MOTION_LABELS: Record<MotionPreference, string> = {
  full: 'Completo',
  reduced: 'Reducido',
};

export const MASCOT_LABELS: Record<MascotPreference, string> = {
  animated: 'Animada',
  still: 'Quieta',
  hidden: 'Oculta',
};

/** Lo guardado puede estar roto o ser de otra versión: lo que no valga, por defecto. */
export function readPreferences(stored: string | null): Preferences {
  const saved = parseJson(stored);
  if (typeof saved !== 'object' || saved === null) return DEFAULT_PREFERENCES;
  const { motion, mascot } = saved as Record<string, unknown>;
  return {
    motion: isMotionPreference(motion) ? motion : DEFAULT_PREFERENCES.motion,
    mascot: isMascotPreference(mascot) ? mascot : DEFAULT_PREFERENCES.mascot,
  };
}

/**
 * Cómo se muestra la mascota de verdad: con menos movimiento (del sistema o
 * del ajuste) nunca viaja, aunque la persona la tenga «animada» (WCAG 2.3.3).
 */
export function effectiveMascot(
  preferences: Preferences,
  systemPrefersLessMotion: boolean,
): MascotPreference {
  if (preferences.mascot === 'hidden') return 'hidden';
  const hasLessMotion =
    preferences.motion === 'reduced' || systemPrefersLessMotion;
  return hasLessMotion ? 'still' : preferences.mascot;
}

function isMotionPreference(value: unknown): value is MotionPreference {
  return MOTION_PREFERENCES.some((option) => option === value);
}

function isMascotPreference(value: unknown): value is MascotPreference {
  return MASCOT_PREFERENCES.some((option) => option === value);
}

function parseJson(text: string | null): unknown {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Ancho de un panel que la persona puede cambiar, en rem y dentro de sus límites. */
export interface WidthLimits {
  min: number;
  max: number;
  initial: number;
}

/** Paso de las flechas del teclado sobre el separador. */
export const WIDTH_KEY_STEP = 1;

export function clampWidth(width: number, { min, max }: WidthLimits): number {
  return Math.min(max, Math.max(min, width));
}

/** Lo guardado puede no ser un número o venir de otros límites. */
export function readStoredWidth(
  stored: string | null,
  limits: WidthLimits,
): number {
  const width = Number(stored);
  if (stored === null || !Number.isFinite(width)) return limits.initial;
  return clampWidth(width, limits);
}

/**
 * El ancho nuevo según la tecla pulsada, o `null` si la tecla no es del
 * separador. El panel está a la derecha: la flecha izquierda lo ensancha.
 */
export function widthAfterKey(
  key: string,
  width: number,
  limits: WidthLimits,
): number | null {
  if (key === 'ArrowLeft') return clampWidth(width + WIDTH_KEY_STEP, limits);
  if (key === 'ArrowRight') return clampWidth(width - WIDTH_KEY_STEP, limits);
  if (key === 'Home') return limits.max;
  if (key === 'End') return limits.min;
  return null;
}

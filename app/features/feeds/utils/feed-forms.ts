import { z } from 'zod';

/**
 * Esquemas de los formularios de la actualización diaria, con los mismos
 * límites que los DTO de la API (`src/feeds/feeds.dto.ts`). La API vuelve a
 * validar; aquí se avisa antes de enviar.
 */

/** `SOURCE_URL_MAX_LENGTH` y `IMPORT_LIMITS.rows` de la API. */
const SOURCE_URL_MAX_LENGTH = 2048;
const MAX_ROWS = 5000;
/** `TIME_ZONE_MAX_LENGTH` de la API. */
const TIME_ZONE_MAX_LENGTH = 64;
const REFRESH_TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export const feedSourceSchema = z.object({
  url: z
    .string()
    .trim()
    .max(SOURCE_URL_MAX_LENGTH, 'La URL es demasiado larga.')
    .refine(isSourceUrl, 'Usa una URL https:// sin usuario ni contraseña.'),
  idColumn: z
    .string()
    .trim()
    .min(1, 'Escribe la columna con el identificador.')
    .max(128, 'Usa como máximo 128 caracteres.'),
  delimiter: z.enum(['comma', 'semicolon']),
});

export const feedPolicySchema = z.object({
  rulesetRevision: z
    .number({ error: 'Elige una revisión de reglas.' })
    .int()
    .min(1, 'Elige una revisión de reglas.'),
  maxInvalid: countSchema('inválidos'),
  maxExcluded: countSchema('excluidos'),
  maxDropPercent: z
    .number({ error: 'Escribe un porcentaje.' })
    .int('Usa un número entero.')
    .min(0, 'No puede ser negativo.')
    .max(100, 'Como máximo 100 %.'),
});

export const feedScheduleSchema = z.object({
  enabled: z.boolean(),
  refreshTime: z
    .string()
    .regex(REFRESH_TIME_PATTERN, 'Usa una hora con formato HH:MM.'),
  timeZone: z
    .string()
    .max(TIME_ZONE_MAX_LENGTH)
    .refine(isValidTimeZone, 'Elige una zona horaria de la lista.'),
});

/**
 * Lo mismo que `parseSourceUrl` de la API: solo `https:`, sin credenciales y
 * con servidor. Si el servidor es público lo comprueba la API al descargar.
 */
export function isSourceUrl(raw: string) {
  if (!URL.canParse(raw)) return false;
  const url = new URL(raw);
  return (
    url.protocol === 'https:' &&
    url.username === '' &&
    url.password === '' &&
    url.hostname !== ''
  );
}

/** La misma comprobación que `isValidTimeZone` de la API. */
export function isValidTimeZone(timeZone: string) {
  if (timeZone.length === 0) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Zonas para elegir, con la del navegador primero. */
export function timeZoneOptions() {
  const own = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const all = Intl.supportedValuesOf('timeZone');
  return [own, ...all.filter((zone) => zone !== own)];
}

function countSchema(what: string) {
  return z
    .number({ error: `Escribe cuántos ${what} admites.` })
    .int('Usa un número entero.')
    .min(0, 'No puede ser negativo.')
    .max(MAX_ROWS, `Como máximo ${MAX_ROWS.toLocaleString('es')}.`);
}

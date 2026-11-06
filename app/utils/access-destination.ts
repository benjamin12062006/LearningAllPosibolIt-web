import type { AccessState } from '../types/access';
import { accessRoute, isWorkspacePath } from './access-route';

/**
 * Volver a donde ibas después de iniciar sesión. Si el acceso te manda a
 * `/auth` desde una página del espacio de trabajo (por ejemplo, el enlace de
 * una invitación con su `#token`), se recuerda la URL completa y, al quedar la
 * sesión lista, se vuelve a ella una sola vez.
 */
const DESTINATION_KEY = 'acceso:destino';

/** Un destino viejo ya no es lo que la persona quería abrir. */
const DESTINATION_TTL_MS = 30 * 60_000;

/** Lo que se necesita de `sessionStorage`; en las pruebas se sustituye. */
export interface DestinationStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface CurrentRoute {
  path: string;
  /** Con consulta y `#fragmento`. */
  fullPath: string;
}

/** Ruta a la que hay que ir con este estado (o la actual si ya vale). */
export function accessDestination(
  state: AccessState,
  route: CurrentRoute,
  storage: DestinationStorage | null = sessionStorageOrNull(),
  now = Date.now(),
): string {
  const destination = accessRoute(state, route.path);

  if (destination === '/auth' && isWorkspacePath(route.path)) {
    rememberDestination(storage, route.fullPath, now);
  }
  if (state.status === 'ready' && !isWorkspacePath(route.path)) {
    return takeDestination(storage, now) ?? destination;
  }
  return destination;
}

/** `true` si la ruta navegable coincide con la actual (con o sin fragmento). */
export function isCurrentRoute(destination: string, route: CurrentRoute) {
  return destination === route.path || destination === route.fullPath;
}

/**
 * Solo rutas de esta web y del espacio de trabajo: un valor manipulado no
 * puede llevar a otro sitio (`//otro.com`, `https://…`).
 */
export function isSafeDestination(value: string) {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\')
  ) {
    return false;
  }
  const base = 'https://web.invalid';
  const url = new URL(value, base);
  return url.origin === base && isWorkspacePath(url.pathname);
}

function rememberDestination(
  storage: DestinationStorage | null,
  fullPath: string,
  now: number,
) {
  if (!storage || !isSafeDestination(fullPath)) return;
  try {
    storage.setItem(
      DESTINATION_KEY,
      JSON.stringify({ path: fullPath, savedAt: now }),
    );
  } catch {
    // Sin almacenamiento (modo privado): se vuelve a la página de inicio.
  }
}

function takeDestination(storage: DestinationStorage | null, now: number) {
  if (!storage) return null;
  try {
    const saved = storage.getItem(DESTINATION_KEY);
    storage.removeItem(DESTINATION_KEY);
    return saved ? validDestination(saved, now) : null;
  } catch {
    return null;
  }
}

/** Lo guardado puede estar roto o manipulado: se comprueba como cualquier entrada. */
function validDestination(saved: string, now: number): string | null {
  const parsed: unknown = JSON.parse(saved);
  if (typeof parsed !== 'object' || parsed === null) return null;
  if (!('path' in parsed) || !('savedAt' in parsed)) return null;
  const { path, savedAt } = parsed;
  if (typeof path !== 'string' || typeof savedAt !== 'number') return null;
  if (now - savedAt > DESTINATION_TTL_MS) return null;
  return isSafeDestination(path) ? path : null;
}

function sessionStorageOrNull(): DestinationStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

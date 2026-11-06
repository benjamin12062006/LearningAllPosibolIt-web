/** Ruta de la web que acepta una invitación. */
export const ACCEPT_INVITATION_PATH = '/invitations/accept';

/** El formato del token de la API (`INVITATION_TOKEN_PATTERN`): 43 caracteres base64url. */
const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Enlace para compartir con la persona invitada. El token va tras `#`: el
 * navegador no lo envía al servidor ni lo deja en el `Referer`.
 */
export function invitationLink(token: string, webOrigin: string) {
  return `${new URL(ACCEPT_INVITATION_PATH, webOrigin).toString()}#${token}`;
}

/** El token del fragmento (`#…`), o `null` si falta o no tiene su forma. */
export function tokenFromHash(hash: string): string | null {
  const token = hash.startsWith('#') ? hash.slice(1) : hash;
  return INVITATION_TOKEN_PATTERN.test(token) ? token : null;
}

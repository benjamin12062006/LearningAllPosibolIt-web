# 02 — Miembros, invitaciones y aceptar una invitación

Fecha de creación: 2026-11-05
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 2 del [plan 01 de organizaciones](../../../docs/plans/feature/organizations&access/01-plan-organizaciones-en-la-web.md)
Relacionada con: [01 organizaciones](01-organizaciones.md), [fuentes](../../../docs/fonts/feature/organizations&access/01-contrato-api-organizaciones.md), [feed y entrega](../feeds&publications/01-feed-y-entrega.md)
Revisión de partida: `74e0ab8`

## Necesidad y punto de partida

Faltaba trabajar con otras personas: ver miembros, cambiar roles, quitar o salir, invitar y aceptar (O4, O5). La API no envía correos: devuelve el token de la invitación una sola vez.

## Evidencia y decisiones

| Decisión                              | Evidencia                 | Aplicación                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Un modal para enlaces de una sola vez | O5; incremento 1 del feed | `FeedUrlModal.vue` pasa a [OneTimeLinkModal.vue](../../../app/features/organizations/components/OneTimeLinkModal.vue) con título y aviso como props; lo usan el feed y las invitaciones                                                                                                                                                               |
| Enlace con el token tras `#`          | O5; propuesta propia      | [invitation-link.ts](../../../app/features/organizations/utils/invitation-link.ts): `invitationLink` (`/invitations/accept#<token>`) y `tokenFromHash` (43 caracteres base64url, como `INVITATION_TOKEN_PATTERN`)                                                                                                                                     |
| Miembros según permisos               | O2, O4, O7                | [OrganizationMembers.vue](../../../app/features/organizations/components/OrganizationMembers.vue): con `members.manage`, `USelect` de rol por fila (con la descripción de cada rol) y quitar; cualquiera puede salir salvo de su organización personal; confirmación al quitar o salir; si cambio mi propio rol, la página vuelve a leer mis permisos |
| Reglas finas en la API                | O2, O8                    | Último propietario, organización personal y archivada: se muestra el mensaje de la API y la lista se vuelve a leer, con éxito o sin él                                                                                                                                                                                         |
| Invitar y anular                      | O5; F9, D1                | [OrganizationInvitations.vue](../../../app/features/organizations/components/OrganizationInvitations.vue): `UForm` con correo (≤ 254) y rol; el enlace se muestra una vez; pendientes con caducidad y «Anular» con confirmación. Solo con `members.manage` y sin archivar                                                                             |
| Aceptar con confirmación              | O5, O8                    | [invitations/accept.vue](../../../app/pages/invitations/accept.vue): lee el token del `#`, pide «Aceptar invitación» (abrir un enlace no une por sí solo); al aceptar, `router.replace` a la organización para no dejar el token en el historial; `INVITATION_EMAIL_MISMATCH` se muestra tal cual                              |

### Ajustes al escribir el código

- **Texto honesto en aceptar:** con E1.2 retirada, aceptar deja ver la organización, sus miembros y la lista de proyectos, no trabajar en proyectos ajenos. El texto lo dice así.
- **Sin sesión, el enlace no sobrevive al inicio de sesión:** el acceso lleva a `/auth` y después a `/projects`. Se avisa al invitar: la persona entra primero y luego abre el enlace. Conservar el destino tras iniciar sesión queda como mejora del acceso.
- **Bitácora del feed:** su enlace a `FeedUrlModal.vue` apunta ahora a `OneTimeLinkModal.vue` (corrección de enlace, sin cambio de sentido).

## Comprobación

| Comprobación                                       | Resultado                                                                                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Sin errores                                                                                                                                                                             |
| `pnpm build`                                       | Completo en 11,3 s                                                                                                                                                                      |
| `invitation-link.ts` con esbuild y Node            | El enlace es `http://localhost:3000/invitations/accept#<token>` y el token vuelve igual desde el `#`; se rechazan vacío, `#`, corto, con un carácter de más y con un carácter no válido |

**No verificado:** con dos cuentas reales. Recorrido: invitar al correo de la segunda cuenta, copiar el enlace, abrirlo con esa cuenta ya iniciada y aceptar; con otro correo debe verse «La invitación es para otro correo»; cambiar su rol; quitar al último propietario (409); salir con la segunda cuenta; anular una invitación pendiente.

## Consecuencias y continuidad

E1 está completa en la web (`v0.5.0`). Siguiente en `docs-diagrams/18`: E2 (trabajos y archivos, sin interfaz propia) y E3 (núcleo de hojas, en la rama `feature/worksheets` del backend).

# 03 — Volver al enlace después de iniciar sesión

Fecha de creación: 2026-11-05
Estado: Implementado y verificado en parte (falta el inicio de sesión real)
Ámbito: arreglo pedido por el usuario tras [02 miembros e invitaciones](02-miembros-e-invitaciones.md)
Relacionada con: [acceso original](../../01-acceso-y-cuenta-nuxt.md), [tema y rutas del espacio de trabajo](../../ui/01-nuxt-ui-y-tema-focus.md)
Revisión de partida: `00a5c17` (`v0.5.0`)

## Necesidad y punto de partida

Al abrir el enlace de una invitación sin sesión, el acceso llevaba a `/auth` y, al entrar, a `/projects`: el `#token` se perdía y había que abrir el enlace otra vez. La bitácora 02 lo dejó anotado y el usuario pidió arreglarlo.

## Decisión e implementación

Propuesta propia; no hay clase del curso sobre volver al destino tras iniciar sesión con un proveedor externo.

| Decisión                                     | Aplicación                                                                                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recordar a dónde ibas, incluido el `#`       | [access-destination.ts](../../../app/utils/access-destination.ts) `accessDestination`: envuelve `accessRoute`; si manda a `/auth` desde una página del espacio de trabajo, guarda `fullPath` en `sessionStorage` (por pestaña) |
| Volver una sola vez                          | Con la sesión lista fuera del espacio de trabajo (`/auth`, `/session`), se toma el destino, se borra y se navega a él; si no hay, a `/projects` como antes                                                                     |
| Sin redirecciones a otros sitios             | `isSafeDestination`: empieza por `/`, no `//` ni `/\`, mismo origen y ruta del espacio de trabajo; lo leído se valida como cualquier entrada (JSON roto o manipulado → se ignora)                                              |
| Destinos viejos no cuentan                   | Caduca a los 30 minutos (`DESTINATION_TTL_MS`)                                                                                                                                                                                 |
| Sin `sessionStorage` (modo privado)          | Cada acceso está en `try/catch`: se vuelve al comportamiento anterior                                                                                                                                                          |
| Mismo criterio en los dos sitios que navegan | [access.global.ts](../../../app/middleware/access.global.ts) y [access.client.ts](../../../app/plugins/access.client.ts) usan `accessDestination` e `isCurrentRoute` (compara con y sin fragmento)                             |
| Texto al invitar                             | [OrganizationInvitations.vue](../../../app/components/OrganizationInvitations.vue): ya no pide entrar antes de abrir el enlace                                                                                                 |

Cerrar sesión no deja un destino: pasa primero por `signingOut`, que lleva a `/session` (fuera del espacio de trabajo), y desde ahí no se guarda nada. Una sesión que caduca en una página sí lo guarda, y al volver a entrar se regresa a ella.

## Comprobación

| Comprobación                                                           | Resultado                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`                     | Sin errores                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm build`                                                           | Completo en 11,0 s                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `access-destination.ts` con esbuild, Node y un almacenamiento simulado | Sin sesión en el enlace → `/auth` y se guarda; ya en `/auth` → se queda; sesión lista en `/auth` → vuelve al enlace con su `#token`; la segunda vez → `/projects`; caducado a los 31 min, `//malo.example/x`, JSON roto y sin almacenamiento → `/projects`; lista en `/projects/x` → no cambia nada. Rutas seguras: `/projects/1` y `/invitations/accept#x` sí; `//evil.com`, `/\evil.com`, `https://evil.com/projects`, `/auth` y `/projects/../auth` no |
| Navegador integrado, sin sesión, `/invitations/accept#<token>`         | Redirige a `/auth` y `sessionStorage` guarda `{"path":"/invitations/accept#<token>","savedAt":…}`; el valor de prueba se borró después                                                                                                                                                                                                                                                                                                                    |

**No verificado:** la vuelta tras un inicio de sesión real con Descope (incluido el retorno de Google con `?code=` a `/auth`).

## Consecuencias y continuidad

Sirve para cualquier enlace del espacio de trabajo, no solo invitaciones (por ejemplo, una evaluación o un informe con `?resultado=`).

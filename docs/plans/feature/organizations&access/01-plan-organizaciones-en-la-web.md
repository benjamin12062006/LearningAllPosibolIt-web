# 01 — Plan: organizaciones, miembros e invitaciones en la web

Fecha de creación: 2026-11-05
Estado: Plan
Ámbito: `KSuT/LearningAllPosibolIt-web`
Relacionada con: [fuentes](../../../fonts/feature/organizations&access/01-contrato-api-organizaciones.md), [plan del feed](../feeds&publications/01-plan-feed-del-proyecto.md)
Revisión de referencia: web `085488a` (`v0.4.0`); API `8a32dfb` (rama `feature/organizations-access`) y el mismo código en el árbol compartido.

## Objetivo

Que una persona vea sus organizaciones con su rol, cree una de equipo, gestione miembros e invitaciones según sus permisos, archive o restaure, y acepte una invitación desde un enlace. Sin cambiar cómo se abren los proyectos (E1.2 retirada, O3).

## Fuentes y decisiones

| Necesidad                      | Fuente                   | Alternativa                     | Decisión propuesta                                                                                                                                                                                           |
| ------------------------------ | ------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dónde viven                    | O9; navegación existente | Selector global de organización | Entrada «Organizaciones» en el lateral: `/organizations` y `/organizations/:id`. Sin selector global todavía: no cambiaría qué proyectos ves hasta E1.2                                                      |
| Mostrar acciones según permiso | O2, O7                   | Calcular por rol en la web      | Usar `access.permissions` de la API: `members.manage` para miembros e invitaciones, `organization.own` para archivar. La API sigue decidiendo                                                                |
| Invitar sin correo             | O5                       | Pedir que la API envíe correo   | Al invitar, modal de una sola vez con el enlace `/invitations/accept#<token>` (el token va tras `#`, que el navegador no envía al servidor). Se generaliza el modal de la URL del feed en `OneTimeLinkModal` |
| Aceptar                        | O5, O8                   | Pegar el token en un formulario | Página `/invitations/accept` que lee el token del `#`, pide confirmar y llama a la API; con `INVITATION_EMAIL_MISMATCH` explica que hay que entrar con el correo invitado                                    |
| Último owner y personal        | O2, O8                   | Validarlo en la web             | Mostrar el 409 de la API; en la organización personal no se ofrece salir ni archivar (`kind`)                                                                                                                |
| Archivada                      | O4, O8                   | Ocultarla                       | Se lee igual con una marca «Archivada»; las acciones de cambio se ocultan y se ofrece «Restaurar» al owner                                                                                                   |
| Proyectos de la organización   | O3, O6                   | Enlazarlos todos (darían 404)   | Listarlos; enlazar solo los que están en tu lista de proyectos, el resto con «Lo gestiona su propietario»                                                                                                    |
| Formularios                    | F9 (Zod), D1             | Validación manual               | `UForm` con Zod: nombre 1–120, correo ≤ 254, rol de la lista cerrada                                                                                                                                         |

## Incrementos

1. **Organizaciones:** tipos y servicio; lateral; lista con rol y estado; crear de equipo; detalle con proyectos; archivar y restaurar.
2. **Miembros e invitaciones:** lista de miembros, cambiar rol, quitar y salir con confirmación; invitar con enlace de una vez; pendientes y revocar; página para aceptar.

Cada incremento con bitácora y commit; al cerrar, `v0.5.0`.

## Comprobación prevista

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; comprobaciones de forma y esquemas con esbuild y Node. Recorrido con dos cuentas: crear organización, invitar al otro correo, aceptar con la segunda cuenta, cambiar su rol, intentar quitar al último owner (409), archivar y restaurar.

## Límites y continuidad

Fuera: E1.2 (acceso a proyectos por membresía), selector global de organización, envío de correos, transferencia de propiedad y GraphQL. Si se retoma E1.2, revisar los enlaces a proyectos y añadir el selector.

# 01 — Organizaciones: lista, crear, detalle y archivado

Fecha de creación: 2026-11-05
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 1 del [plan 01 de organizaciones](../../../docs/plans/feature/organizations&access/01-plan-organizaciones-en-la-web.md)
Relacionada con: [fuentes](../../../docs/fonts/feature/organizations&access/01-contrato-api-organizaciones.md), [feed](../feeds&publications/03-actualizacion-diaria.md)
Revisión de partida: `085488a` (`v0.4.0`); API `8a32dfb`

## Necesidad y punto de partida

Siguiente funcionalidad según `docs-diagrams` (O1): ampliación E1. La API tiene organizaciones, membresías, invitaciones, archivado y cuotas (O4–O8); E1.2 está retirada y los proyectos siguen abriéndose solo por su propietario (O3).

## Evidencia y decisiones

| Decisión                           | Evidencia  | Aplicación                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipos comprobados y roles cerrados | O7         | [types/organizations.ts](../../../app/types/organizations.ts): `ORGANIZATION_ROLES`, nombres y descripciones en español (tabla de O2), `isOrganizationDetail` (un rol desconocido no pasa), `readPagedList` para las listas `{ <clave>, page }`, `canManageMembers` y `canOwn` sobre `access.permissions` |
| Servicio completo                  | O4, O5, O6 | [services/organizations.ts](../../../app/services/organizations.ts): organizaciones, proyectos, miembros, invitaciones y aceptar. Lo usan este incremento y el siguiente                                                                                                                                  |
| Entrada en el lateral y rutas      | Plan       | «Organizaciones» en [workspace.vue](../../../app/layouts/workspace.vue); `/organizations` e `/invitations` añadidas a las rutas del espacio de trabajo en [access-route.ts](../../../app/utils/access-route.ts)                                                                                           |
| Lista y crear                      | O4; F9, D1 | [organizations/index.vue](../../../app/pages/organizations/index.vue), [OrganizationRow.vue](../../../app/components/OrganizationRow.vue) (tipo, rol, «Archivada») y [CreateOrganizationModal.vue](../../../app/components/CreateOrganizationModal.vue) con `UForm` y Zod (nombre 1–120)                  |
| Detalle con permisos               | O2, O7     | [organizations/[id].vue](../../../app/pages/organizations/[id].vue): tu rol; archivar solo con `organization.own` y en una de equipo, con confirmación; aviso «Organización archivada» con «Restaurar»                                                                                                    |
| Proyectos sin enlaces rotos        | O3, O6     | [OrganizationProjects.vue](../../../app/components/OrganizationProjects.vue): enlaza solo los que están en tu lista de proyectos; el resto dice «Lo gestiona su propietario»                                                                                                                              |

### Ajustes al escribir el código

- **Restos quitados:** un tipo genérico sin uso y una reexportación innecesaria en `types/organizations.ts`.
- **Botón de enviar en el pie del modal:** el botón está fuera del `<form>` y lo envía con `form="nueva-organizacion"`. Se comprobó que `UForm` pone su `id` en el `<form>` (`Form.vue`, `:id="formId"`).

## Comprobación

| Comprobación                                       | Resultado                                                                                                                                                                                                                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Sin errores                                                                                                                                                                                                                                                              |
| `pnpm build`                                       | Completo en 13,2 s                                                                                                                                                                                                                                                       |
| Comprobaciones con esbuild y Node                  | Detalle aceptado; un admin tiene `members.manage` y no `organization.own`; un rol inventado se rechaza; `readPagedList` lee dos organizaciones (una personal y archivada) y devuelve `null` con la clave equivocada; miembro sin nombre ni correo e invitación aceptados |

**No verificado:** con la API y sesión. Recorrido: ver la organización personal, crear una de equipo, abrirla, archivarla (queda en lectura) y restaurarla; ver proyectos propios con enlace.

## Consecuencias y continuidad

Siguiente: incremento 2, miembros, invitaciones y aceptar una invitación.

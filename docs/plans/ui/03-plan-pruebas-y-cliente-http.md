# 03 — Plan: pruebas de la web y cliente HTTP para borradores y permisos (B1 y B3)

Fecha de creación: 2026-11-14  
Última actualización: 2026-11-14  
Estado: Implementado y verificado ([bitácora ui 02](../../../bitacora-construccion/ui/02-pruebas-y-cliente-http.md)).  
Revisión de partida: `bcf5303` (`main`).  
Relacionada con: [ficha ui 04 (bases comunes)](../../fonts/ui/04-bases-comunes-para-visor-y-hojas.md), [contrato de hojas](../../fonts/feature/worksheets/01-contrato-api-hojas.md), [plan de investigación ui 02](02-plan-investigacion-visor-y-hojas.md).

## Objetivo

Dejar listo, antes de la primera pantalla nueva, lo que necesitan el visor y las hojas:

1. **Pruebas automáticas** en la web, que hoy no tiene.
2. Un cliente HTTP que **envíe `If-Match` e `Idempotency-Key`** y **lea el `ETag`**: sin eso no se puede guardar ni aplicar un borrador de hoja. Nest ya lo permite (contrato de hojas, «CORS listo»).
3. **Saber la organización, el rol y los permisos** de quien mira un proyecto con `GET /projects/:id/access`, que ya existe en Nest.

## Decisiones

| ID   | Decisión                                                                                                                                                                                                                                                                                      | Respaldo                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| B-D1 | **Vitest 5.1.0** con un proyecto `unit` en entorno `node` para funciones, predicados y servicios. `$fetch` se sustituye con `vi.stubGlobal`. El proyecto `nuxt` (`@nuxt/test-utils`, `mountSuspended`) se añade con la primera prueba de componente o _composable_ que lo necesite, no antes. | Ficha ui 04: F1, F2, C1–C3; filosofía: lo justo para la etapa |
| B-D2 | Script `test` (`vitest run`), que pasa a formar parte de la verificación de cada etapa junto con `typecheck`, `lint` y Prettier.                                                                                                                                                              | Ficha ui 04, interpretación 2                                 |
| B-D3 | `ApiRequest.headers`: cabeceras **extra** de la petición. `Authorization` y `Accept` las pone siempre el cliente: no se pueden pisar.                                                                                                                                                         | Contrato de hojas, E16                                        |
| B-D4 | `requestWithETag(path, request)` devuelve `{ body, etag }` con `$fetch.raw`; `request` sigue devolviendo solo el cuerpo. El token, el reintento ante 401 y la traducción de errores se escriben una sola vez para las dos.                                                                    | Ficha ui 04: E1, E2                                           |
| B-D5 | `$projects.access(projectId)` → `ProjectAccess { organizationId, role, permissions }`, con su predicado `isProjectAccess` como el resto de tipos.                                                                                                                                             | Contrato de hojas («Cómo saber la organización»)              |

## Etapas

| Etapa      | Qué                                                                             | Comprobación                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **B1**  | Vitest, configuración y pruebas del cliente HTTP **tal como está** (línea base) | `pnpm test` en verde antes de cambiar el cliente                                                                                                                                      |
| ✅ **B3a** | Cabeceras extra y `requestWithETag`                                             | Pruebas: cabeceras enviadas, `Authorization` no se pisa, `ETag` leído (con y sin comillas débiles), reintento ante 401 en las dos formas, error bilingüe también en `requestWithETag` |
| ✅ **B3b** | `GET /projects/:id/access` en el servicio de proyectos                          | Pruebas: ruta, respuesta válida y respuesta inválida                                                                                                                                  |

Al final: defectos a propósito en una copia, `typecheck`, `lint`, Prettier, `test` y la bitácora.

## Límites

- No se toca Nest: ya permite las cabeceras y tiene la ruta de acceso.
- Todavía no hay pantallas que usen esto. El visor (V-web 1) y las hojas (H-web) lo usarán en sus etapas.

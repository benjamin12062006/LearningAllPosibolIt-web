# 02 — Pruebas de la web y cliente HTTP para borradores y permisos

Fecha de creación: 2026-11-14  
Estado: Implementado y verificado.  
Revisión de partida: `bcf5303` (rama `feature/pruebas-y-cliente-http`)  
Relacionada con el [plan ui 03](../../docs/plans/ui/03-plan-pruebas-y-cliente-http.md), la [ficha ui 04](../../docs/fonts/ui/04-bases-comunes-para-visor-y-hojas.md) y el [contrato de hojas](../../docs/fonts/feature/worksheets/01-contrato-api-hojas.md).

Necesidad: la web no tenía pruebas; su cliente HTTP no podía enviar `If-Match` ni `Idempotency-Key` ni leer `ETag`; y no sabía la organización ni el rol de un proyecto. Las hojas y el visor lo necesitan.

## Antes de construir: lo que había que arreglar en la API

La investigación (ficha worksheets 01) daba por hecho que a la API le faltaba el `organizationId` del proyecto. **Era un error de la ficha:** ya existe `GET /api/v1/projects/:id/access` (`src/projects/project-membership.controller.ts:30`, desde el commit `37a5d44`), con organización, rol y permisos. Además, el CORS de Nest ya permite `If-Match` e `Idempotency-Key` y expone `ETag` (`src/configure-http.ts:35-55`). **No hubo que tocar Nest**, y eso evitó pisar a la otra sesión, que tiene sin commit justo los archivos de proyectos y GraphQL (C7). Se corrigieron las fichas worksheets 01, feed-viewer 01, ui 03 y ui 04.

## Evidencia → decisión → aplicación

| Evidencia                                        | Decisión                                                                                              | Aplicación                                                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Ficha ui 04: F1, F2 y C1–C3                      | B-D1 y B-D2: Vitest en Node con `$fetch` simulado; script `test`                                      | `vitest.config.ts`, `package.json` (`test`, `typecheck:test`), `test/unit/tsconfig.json`                                                |
| Contrato de hojas, E16                           | B-D3: cabeceras extra sin poder pisar `Authorization` ni `Accept`                                     | `ApiRequest.headers` y `fetchOptions` en [`api-client.ts`](../../app/services/api-client.ts)                                            |
| Ficha ui 04: E1 y E2 (`$fetch.raw`)              | B-D4: `requestWithETag` → `{ body, etag }`, con el token, el reintento y los errores en un solo sitio | `sendWithSession` y `requestWithETag` en `api-client.ts`                                                                                |
| Contrato de hojas («Cómo saber la organización») | B-D5: acceso al proyecto                                                                              | [`types/project-access.ts`](../../app/features/projects/types/project-access.ts) y `access()` en [`services/projects.ts`](../../app/features/projects/services/projects.ts) |

## Ajustes al escribir el código

- **Primero la línea base (B1):** 11 pruebas del cliente tal como estaba. Después se reorganizó el cliente (`sendWithSession` y `fetchOptions`) y esas 11 pruebas siguieron pasando **sin cambiarlas**, la prueba de que el comportamiento no cambió.
- **`ETag` tal cual**, sin quitar comillas ni `W/`: `If-Match` tiene que devolver exactamente lo que mandó Nest (`"3"`). El plan hablaba de probar «comillas débiles»; en su lugar se prueba que se devuelve sin tocar y que sin cabecera da `null`.
- **`ProjectAccess` en su propio archivo** (`types/project-access.ts`): `types/organizations.ts` ya importa de `types/projects.ts`, y ponerlo allí habría creado una importación circular.
- **Las pruebas pasan el compilador** con su propio `tsconfig`, que extiende el de la app. `nuxt typecheck` solo mira `test/nuxt/**`, no `test/unit/**`. Ese `tsconfig` necesita `.nuxt/`, que en un clon nuevo genera el `postinstall` (`nuxt prepare`); se vio al preparar la copia de los defectos.
- Vitest 5.1.0 sin `@nuxt/test-utils` todavía: ninguna prueba de esta etapa necesita el entorno de Nuxt.

## Comprobación

| Comprobación ejecutada                                       | Resultado                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test` (línea base, antes de tocar el cliente)          | 11 de 11                                                                                                                                                                                                                                                                                                                                                          |
| `pnpm test` al final                                         | **21 de 21** (16 del cliente y 5 del acceso al proyecto)                                                                                                                                                                                                                                                                                                          |
| `pnpm typecheck` (app) y `pnpm typecheck:test` (pruebas)     | Sin errores; `--listFiles` confirma que entran las pruebas y `api-client.ts`                                                                                                                                                                                                                                                                                      |
| `pnpm lint` y `pnpm format:check`                            | Correctos                                                                                                                                                                                                                                                                                                                                                         |
| 8 defectos a propósito en una copia, con la línea base verde | **8 de 8 detectados**: cabeceras extra que pisan la sesión, cabeceras extra ignoradas, `ETag` leído de otra cabecera, `requestWithETag` sin renovar el token, reintento también ante un 403, ruta de acceso sin codificar el ID, rol sin comprobar y permisos sin comprobar. La primera copia, sin `.nuxt`, dio la línea base en rojo y no se tomó como resultado |

No se probó contra Nest en marcha: ninguna pantalla usa todavía estas piezas. Lo hará la primera etapa del visor o de las hojas.

## Evaluación de Leptos para la hoja

Hecha en la [ficha worksheets 03](../../docs/fonts/feature/worksheets/03-evaluacion-leptos-wasm-para-la-hoja.md): no para la interfaz, ni WASM para los cálculos. El motor de fórmulas de Nest (TS puro) calcula 5.000 filas en unos 44 ms; se propone reutilizarlo en la web para la vista previa.

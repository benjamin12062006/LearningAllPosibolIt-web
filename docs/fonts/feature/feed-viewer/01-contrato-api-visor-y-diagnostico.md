# 01 — Contrato de la API del visor y del diagnóstico del feed (I2)

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: código de la API Nest (solo lectura) y sus bitácoras V1–V5.  
Revisión de la API: `fb32457` (`feature/cierre-backend`).  
Relacionada con: [plan de investigación ui 02](../../../plans/ui/02-plan-investigacion-visor-y-hojas.md), [22 — visor y diagnóstico](../../../../../docs-diagrams/22-visor-y-diagnostico-del-feed.md), [contrato de feeds](../feeds&publications/01-contrato-api-feeds-y-actualizaciones.md), [contrato de reglas y evaluaciones](../rulesets&evaluations/01-contrato-api-reglas-y-evaluaciones.md), [ficha ui 03](../../ui/03-ark-ui-tema-y-organizacion-por-funcion.md).

## Necesidad

Saber exactamente qué piden y qué devuelven las rutas del visor, con sus errores y permisos, para escribir los tipos y servicios de la web sin adivinar.

Todas cuelgan de `/api/v1/projects/:projectId` y piden sesión. Cualquier miembro (también Viewer) puede leer. Un proyecto de otra organización responde 404.

## Contratos (E)

Rutas de la API: `src/feed-viewer/feed-viewer.controller.ts`, `src/feeds/feeds.controller.ts:59-67` y `src/evaluations/evaluations.controller.ts:46-125`.

### E1 · Paginación común (`src/common/http/pagination.ts`)

`limit` (1–100; por defecto 20) y `offset` (≥ 0). Las respuestas traen `page: { limit, offset, hasMore }`. **No hay total de la consulta**: `hasMore` se calcula pidiendo una fila de más. Solo el visor de productos trae `rowCount`, que es el total del archivo, no el de la búsqueda.

### E2 · Productos de un archivo (V1)

| Ruta      | `GET exports/:exportId/products` · `GET feeds/:feedId/versions/:versionId/products`                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta  | `limit`, `offset` y `search` (se recorta; máximo 150 caracteres; busca en `id` o `title`)                                                                                                                           |
| Respuesta | `{ columns: string[], products: [{ line: number, values: Record<string, string> }], page, rowCount }`                                                                                                               |
| Errores   | 404 `EXPORT_NOT_FOUND`, `FEED_NOT_FOUND`, `FEED_VERSION_NOT_FOUND`; **410 `FEED_VERSION_FILE_RETIRED`** (la retención borró el archivo); 503 `EXPORT_FILE_UNAVAILABLE` o `FEED_FILE_UNAVAILABLE`; 400 de validación |

`line` es el número de línea en el TSV, y `values` lleva una entrada por cada columna de `columns`.

### E3 · Ficha de producto (V2)

| Ruta      | `GET exports/:exportId/product?id=…` · `GET feeds/:feedId/versions/:versionId/product?id=…`                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta  | `id` exacto (sin recortar; hasta 200 caracteres). Va en la consulta y no en la ruta porque un SKU puede llevar barras                                                                                           |
| Respuesta | `{ columns, product: { line, values }, source }`, con `source = { kind: 'export', export }` o `{ kind: 'feed_version', feedId, version }`. Ambas llevan la evaluación de origen (en una versión puede ser nula) |
| Errores   | Los de E2 y 404 `PRODUCT_NOT_FOUND`                                                                                                                                                                             |

### E4 · Estado de la entrega (V2)

`GET feeds/:feedId/delivery` → `{ delivery: { delivering, reason, deliveryEnabled, publishedVersion } }`, con `reason ∈ { 'no_published_version', 'delivery_disabled', 'file_unavailable' } | null`. El token de entrega **no** sale nunca. Sirve para explicar el 404 genérico de la URL pública (documento 22).

### E5 · «Requiere atención» (V3)

`GET evaluations/:evaluationId/attention` → `{ attention: { evaluationId, affectedProducts, problemGroups, excludedProducts, exclusionGroups } }`.

- `problemGroups[]`: el problema del informe (`attribute` y `code`) con `problem` y `suggestion` en es/en (`src/evaluations/problem-messages.ts:15`), más `productCount`. Un producto con dos problemas está en dos grupos, pero cuenta una vez en `affectedProducts`.
- `exclusionGroups[]`: `{ rulePosition, rule, productCount }`. Son exclusiones deliberadas, no errores.
- Al abrir un grupo se usa el informe de filas con filtro: `GET evaluations/:id/rows?attribute=…&code=…` (los dos juntos; uno solo da 400) o `?rule=<posición desde 1>`.
- Errores: 404 `EVALUATION_NOT_FOUND`; **409 `EVALUATION_RESULTS_UNAVAILABLE`** si la evaluación no terminó bien, como el informe.

### E6 · Comparar con la versión vigente (V4)

`GET feeds/:feedId/comparison?exportId=<uuid>&change=added|removed|modified&limit&offset` → `{ candidate, published, counts: { added, removed, modified, unchanged }, changedFields: [{ field, productCount }], changes: [{ id, change, fields: [{ field, before, after }] }], page }`.

`counts` y `changedFields` son del archivo entero; `changes` es la página pedida. Sin `change`, vienen los tres tipos. Errores: 404 (`FEED_NOT_FOUND`, `EXPORT_NOT_FOUND`) antes que **409 `FEED_NOT_PUBLISHED`**, para no dar pistas a otra organización.

### E7 · Probar reglas sin publicar (V5)

`POST evaluations/preview`, con el mismo cuerpo que al guardar unas reglas (`CreateRulesetDto`) más `snapshotId` (UUID) y `baseRevision` opcional (sin ella, la última revisión guardada). Consulta: `limit` y `offset` para la lista de productos.

Respuesta `{ preview: { snapshotId, baseRevision, counts: { current, proposed }, problems: { appeared, resolved, persisting }, outcomeChanges, changedValues, changedProducts, products, page } }`, con `products[] = { sourceRow, externalId, current, proposed, values }` y `current`/`proposed = { outcome, problems, excludedByRule }`.

Permiso: **Editor o más** (Viewer 403 `FORBIDDEN`). Errores: 404 `IMPORT_NOT_FOUND`, `RULESET_NOT_FOUND` o `PROJECT_NOT_FOUND`; 400 `VALIDATION_FAILED`. No guarda nada.

## Lo que ya existe en la web (W)

| ID  | Dónde                                                                | Qué hay                                                                                           |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| W1  | `types/feeds.ts`                                                     | `PublishedVersion`, `FeedVersion`, `FeedVersionList`, `Feed`, `FeedWithDelivery` y sus predicados |
| W2  | `types/evaluations.ts`                                               | `EvaluationCounts`, `RowProblem`, `EvaluationRow`, `EvaluationRowsPage` (el informe)              |
| W3  | `types/exports.ts`                                                   | `ProductExport` y `ExportApproval`                                                                |
| W4  | `composables/useEvaluationReport.ts`                                 | Filtro y página en la URL, sin total de la consulta (usa los conteos de la evaluación)            |
| W5  | `components/FeedVersions.vue`, `FeedDelivery.vue`, `ExportPanel.vue` | Puntos de entrada naturales para «Ver productos»                                                  |

## Interpretación

1. **Una vista, dos orígenes.** E2 y E3 tienen las mismas formas para la exportación y para la versión. El servicio recibe un origen discriminado (`{ kind: 'export', exportId }` o `{ kind: 'feed_version', feedId, versionId }`) y elige la ruta, como pide el documento 22.
2. **Columnas dinámicas.** El TSV no tiene un esquema fijo: la tabla muestra unas columnas principales si existen (`id`, `image_link`, `title`, `price`, `availability`) y la ficha muestra todas las de `columns`.
3. **Paginación sin total.** Sin búsqueda, el total del archivo es `rowCount` y se puede usar una `Pagination` numerada. Con búsqueda no hay total: «Anterior» y «Siguiente» con `hasMore` (lo pide el documento 22).
4. **Estados que la interfaz debe explicar:** 410 (versión retirada), 503 (archivo no disponible), 409 sin publicar, entrega desactivada (E4) y 409 sin resultados de la evaluación. Cada uno con su texto (el `message.es` de Nest) y sin perder el contexto del proyecto.
5. **Permisos visibles.** Solo «Probar reglas» exige Editor. La web puede saber el rol con `GET /projects/:id/access` (`permissions` con `worksheet.write`; ver el contrato de hojas): el botón solo se muestra a quien puede usarlo, y el 403 queda como red de seguridad.

## Mapa necesidad → fuentes → decisión pendiente

| Necesidad                  | Fuentes                  | Decisión pendiente                                                                                      |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Tipos y servicio del visor | E2–E7, W1–W3             | `types/feed-viewer.ts` y `services/feed-viewer.ts` con predicados `isX` como el resto (ficha ui 03, E5) |
| Origen único               | E2, E3, interpretación 1 | Tipo `ProductSourceRef` discriminado                                                                    |
| Paginación                 | E1, E2, interpretación 3 | Numerada sin búsqueda; anterior/siguiente con búsqueda                                                  |
| Errores explicados         | E2–E6                    | Tabla código → mensaje y acción (volver, reintentar, publicar…)                                         |
| Probar reglas              | E7, interpretación 5     | Botón visible con `worksheet.write` de `GET projects/:id/access`                                        |

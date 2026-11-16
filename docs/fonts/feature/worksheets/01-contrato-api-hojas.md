# 01 — Contrato de la API de hojas, borradores, importación y exportación (I4)

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: código de la API Nest (solo lectura).  
Revisión de la API: `fb32457` (`feature/cierre-backend`), con H1–H5 según el [documento 12](../../../../../docs-diagrams/12-hojas-modelo-editor-importacion-y-exportacion.md#estado-en-la-api-anotado-el-2026-11-14).  
Relacionada con: [plan de investigación ui 02](../../../plans/ui/02-plan-investigacion-visor-y-hojas.md), [16 — tabla central y contratos](../../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md), [13 — revisiones y conflictos](../../../../../docs-diagrams/13-revisiones-aprobaciones-y-conflictos.md), [ficha worksheets 02](02-tabla-editable-cursos-y-documentacion.md).

## Necesidad

Saber qué ofrece hoy Nest para «nuestro Excel» antes de diseñar pantallas: rutas, formas, límites, cabeceras obligatorias y estados.

## Prefijo distinto al del visor

Todas las rutas de hojas cuelgan de **`/api/v1/organizations/:organizationId/projects/:projectId`**, no de `/api/v1/projects/:projectId` como el visor y el resto de la web. Nest valida que el proyecto sea de esa organización.

**Cómo saber la organización (corregido el 2026-11-14):** la respuesta de un proyecto no trae `organizationId` (`src/projects/projects.types.ts:14-22`), pero **ya existe `GET /api/v1/projects/:id/access`** (`src/projects/project-membership.controller.ts:30`, commit `37a5d44`), que devuelve `{ access: { actorId, organizationId, projectId, role, permissions } }` de quien pregunta. No falta nada en Nest: la web lo pide una vez por proyecto. C7 añade lo mismo en GraphQL (`Project.access`).

**CORS listo** (`src/configure-http.ts:35-55`): Nest ya permite enviar `If-Match` e `Idempotency-Key` y deja leer `ETag` desde `localhost:3000`.

## Rutas (E)

Controladores: `src/worksheets/worksheets.controller.ts`, `saved-views.controller.ts`, `src/changesets/changesets.controller.ts`, `src/worksheet-imports/*.controller.ts`, `src/worksheet-exports/worksheet-exports.controller.ts` y `src/worksheet-catalog-snapshots/*.controller.ts`.

| Área                          | Rutas (relativas al prefijo)                                                                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1 · Libros                   | `POST/GET workbooks`, `PATCH workbooks/:id` (renombrar), `POST workbooks/:id/archive` y `/restore`                                                                                                                                              |
| E2 · Hojas                    | `POST/GET workbooks/:id/worksheets`, `GET worksheets/:id`, `PATCH worksheets/:id`, `POST worksheets/:id/duplicate`, `/archive` y `/restore`, `GET worksheets/:id/revisions` (historial, H2)                                                     |
| E3 · Filas                    | `POST worksheets/:id/rows/query`: `{ revisionId?, viewId?, filter?, sort?, columns?, cursor?, limit? }`                                                                                                                                         |
| E4 · Vistas guardadas (H4)    | `POST/GET worksheets/:id/saved-views`, `GET/PUT/DELETE saved-views/:viewId` (`personal` o `team`)                                                                                                                                               |
| E5 · Borradores               | `POST/GET worksheets/:id/changesets`, `GET changesets/:id`, **`PUT changesets/:id/operations`**, `GET changesets/:id/diff`, `POST …/submit`, `/reopen`, `/cancel`, `/decisions`, **`/apply`**, `/rebase` y `POST revisions/:id/revert-proposal` |
| E6 · Importar                 | `POST worksheets/:id/imports/preview` y `POST worksheets/:id/imports` (multipart, campo `file`), `GET worksheets/:id/imports`, `GET worksheet-imports/:id`                                                                                      |
| E7 · Plantillas de mapeo (H3) | `POST/GET worksheets/:id/import-mappings`, `GET/DELETE import-mappings/:id`; se usan con `mappingId` al importar                                                                                                                                |
| E8 · Exportar                 | `POST worksheets/:id/exports`, `GET worksheets/:id/exports`, `GET worksheet-exports/:id` y `GET worksheet-exports/:id/file` (CSV o XLSX)                                                                                                        |
| E9 · Puente con el catálogo   | `POST worksheets/:id/catalog-snapshots` (hoja → catálogo), `GET worksheet-catalog-snapshots/:id` y `POST workbooks/:id/worksheets/from-catalog` (catálogo → hoja, H5)                                                                           |

## Formas y límites (E)

| ID  | Fuente                                                                           | Qué se observa                                                                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E10 | `worksheets.types.ts:23-84`                                                      | `Worksheet`: `id`, `workbookId`, `name`, `schemaVersion`, `headRevision { id, sequence, rowCount, createdAt }`, `archivedAt`, `workbookArchivedAt`, `duplicatedFrom`, `openedFromCatalog` y `columns[] { id, name, type, position, required, options?, formula? }`. **`WorksheetCapabilities { write, approve }`**: la web puede mostrar acciones según el permiso |
| E11 | `worksheet-columns.ts:7-33`                                                      | Tipos: `text`, `integer`, `decimal`, `date`, `boolean`, `selection` y `calculated`. Límites: 200 columnas, 120 caracteres de nombre, 100 opciones por columna y **5.000 filas** por hoja                                                                                                                                                                           |
| E12 | `row-query.ts:7-39`                                                              | Filtro como árbol `and`/`or` (profundidad 3, 20 predicados, 100 valores en `in`) con operadores por tipo: texto `equals`, `not_equals`, `contains`, `in` e `is_null`; números y fechas, además los de orden; `calculated` no se filtra. Hasta 3 columnas de orden. Página de 50 por defecto y 100 como máximo                                                      |
| E13 | `worksheet-rows.service.ts:85-112`                                               | Respuesta: `{ items, nextCursor, revisionId, schemaVersion }`. El cursor va ligado a la revisión y a la consulta (`queryHash`): otra consulta exige empezar de nuevo                                                                                                                                                                                               |
| E14 | `changeset-operations.ts:14-37` y `changeset-schema.ts`                          | Operaciones de datos: `set_cell` (`rowId`, `columnId`, valor tipado), `insert_row` y `delete_row`. De esquema: `add_column`, `rename_column`, `delete_column` y `change_column_type`. **Máximo 1.000 operaciones por guardado**                                                                                                                                    |
| E15 | `changesets.types.ts:4-12`                                                       | Estados: `draft`, `pending_review`, `approved`, `rejected`, `conflicted`, `applied` y `cancelled`                                                                                                                                                                                                                                                                  |
| E16 | `changesets.controller.ts:33-34, 103, 216, 268-270`; `changesets.service.ts:140` | **Guardar el borrador exige `If-Match: "<draftVersion>"`**: sin la cabecera, 428; con otra versión, 412. Las respuestas que devuelven un borrador mandan la versión nueva en **`ETag`**. **Aplicar exige `Idempotency-Key`** (`IDEMPOTENCY_KEY_REQUIRED`; reutilizarla con otro cuerpo da `IDEMPOTENCY_KEY_REUSED`)                                                |
| E17 | `worksheet-imports.controller.ts:31, 94` y `import-options.ts:48-49`             | La importación crea un borrador y responde su `ETag`. Modos `append` o `upsert` (este con la columna clave)                                                                                                                                                                                                                                                        |

## Interpretación

1. **La web necesita ampliar su cliente HTTP** (ficha ui 03, E6): enviar `If-Match` e `Idempotency-Key` y **leer el `ETag`** de la respuesta. Hoy solo devuelve el cuerpo.
2. **El cursor no es un número de página**: se navega hacia delante; volver atrás es guardar los cursores ya vistos o empezar de nuevo. Encaja con «cargar más» o con desplazamiento infinito, no con una `Pagination` numerada.
3. **5.000 filas como máximo y 100 por petición**: una hoja completa son 50 peticiones. Con 100 filas en pantalla no hace falta virtualizar. Si se acumulan filas al desplazarse, hay que **medir** (documento 16) antes de usar TanStack Virtual.
4. **El guardado del borrador** es un `PUT` con todas las operaciones (hasta 1.000). Un pegado grande o una edición larga pueden pasar de ese límite: hay que agrupar o avisar.
5. **Permisos visibles:** `capabilities.write` y `capabilities.approve` deciden qué botones salen (editar, enviar, aprobar o aplicar), sin esperar al 403.
6. **Estados del documento 16** (publicado, cargado, edición local, borrador guardado, en revisión, aplicado, conflicto): E15 y E16 los cubren todos; `conflicted` y `rebase` son el caso «Conflicto».

## Mapa necesidad → fuentes → decisión pendiente

| Necesidad                          | Fuentes       | Decisión pendiente                                                                               |
| ---------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| Rutas con organización             | Prefijo       | Servicio de hojas que reciba `organizationId` y `projectId`, sacado de `GET projects/:id/access` |
| Cabeceras de borrador y de aplicar | E16, E17      | Ampliar `api-client` (ficha ui 04)                                                               |
| Navegar filas                      | E12, E13      | «Cargar más» por cursor; medir antes de virtualizar                                              |
| Límite de operaciones              | E14           | Guardar por tandas o avisar al pasar de 1.000                                                    |
| Acciones por permiso               | E10           | Usar `capabilities`                                                                              |
| Primeras pantallas sin editor      | E1, E2, E6–E9 | Libros y hojas, historial, importar, exportar y puente: no necesitan la tabla editable           |

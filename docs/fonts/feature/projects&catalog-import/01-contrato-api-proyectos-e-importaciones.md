# 01 — Contrato de la API: proyectos e importaciones de catálogo

Fecha de creación: 2026-11-03
Tipo de fuente: código propio (backend)
Origen: [LearningAllPosibolIt](../../../../../LearningAllPosibolIt), `main` en `f6b4bf9` con cambios locales sin commit en otros módulos (rulesets, evaluaciones); los archivos citados aquí se leyeron del árbol actual.
Fecha de consulta: 2026-11-03
Relacionada con: [plan ui 01](../../../plans/ui/01-plan-nuxt-ui-focus-proyectos-e-importaciones.md)

## Necesidad de consulta

Las páginas deben enviar y leer exactamente lo que la API acepta y devuelve, y mostrar sus errores en español sin inventar mensajes.

## Localización verificable

| ID  | Archivo                                                                                                                                          | Símbolo                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `src/configure-http.ts`                                                                                                                          | prefijo `api`, versión URI `v1`, CORS para `localhost:3000` y `127.0.0.1:3000`, cabeceras `Accept`, `Authorization`, `Content-Type`                                                                                    |
| A2  | `src/projects/projects.controller.ts`                                                                                                            | `GET /projects` → `{ projects, page }`; `POST /projects` → `{ project }`; `GET /projects/:id` y `PATCH /projects/:id` → `{ project }`                                                                                  |
| A3  | `src/projects/projects.dto.ts`, `projects.types.ts`                                                                                              | `name` 1–120 (se recorta); `country` ISO 3166-1 alfa-2; `currency` ISO 4217 (se pasan a mayúsculas); `channelProfile` solo `google_merchant`; `Project` con `configurationStatus: 'required' \| 'ready'` y `createdAt` |
| A4  | `src/common/http/pagination.ts`                                                                                                                  | `limit` 1–100 (20 por defecto), `offset` ≥ 0, `page.hasMore`                                                                                                                                                           |
| A5  | `src/catalog-import/catalog-import.controller.ts`                                                                                                | `POST /projects/:id/imports` (202, multipart: `file`, `idColumn`, `delimiter`); `GET …/imports` → `{ imports, page }`; `GET …/jobs/:jobId` → `{ job }`; `DELETE /projects/:id` y `DELETE …/imports/:snapshotId` (204)  |
| A6  | `src/catalog-import/import.dto.ts`, `import-upload.interceptor.ts` (`.single('file')`), `catalog-import.service.ts` `accept`                     | `idColumn` con algún carácter no blanco, ≤ 128; `delimiter` `comma` o `semicolon`; respuesta `{ snapshotId, jobId, status: 'queued', statusUrl }`                                                                      |
| A7  | `src/catalog-import/catalog-import.repository.ts` `listSnapshots`, `toListedImport`, `findJob`; migración `20261026000100_create_catalog_import` | importación: `status` `pending/importing/ready/failed`, `rowCount`, `originalName`, `byteSize`, `error`, `job: { id, status, processedRows } \| null`; trabajo: `queued/running/succeeded/failed`                      |
| A8  | `src/common/http/api-exception.filter.ts`, `public-error.ts`                                                                                     | error: `{ statusCode, code, message: { es, en }, issues?: [{ field, code, message }], requestId }`                                                                                                                     |
| A9  | README de la API, «Límites de la API»                                                                                                            | archivo ≤ 10 MiB, ≤ 5.000 filas, 1 importación activa por proyecto (`409 IMPORT_ALREADY_ACTIVE`)                                                                                                                       |

## Interpretación y límites

- La web replica solo los límites que ayudan a avisar antes de enviar (longitud del nombre, formato de país y moneda, tamaño del archivo). La API sigue siendo quien valida.
- El mensaje que se muestra es `message.es` del error; si la respuesta no trae ese formato, se usa un texto genérico por estado HTTP.
- Organizaciones, reglas, evaluaciones, exportaciones y feeds existen en la API pero quedan fuera de esta entrega (ver plan).
- Leer el código no demuestra que la API acepte una sesión real: eso exige iniciar sesión con Descope.

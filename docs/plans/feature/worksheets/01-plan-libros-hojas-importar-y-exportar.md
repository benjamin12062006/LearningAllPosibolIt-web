# 01 — Plan: libros y hojas, importar, exportar y ver filas («pre», sin edición)

Fecha de creación: 2026-11-14  
Estado: Plan. Se revisará cuando la API esté cerrada (C7, GraphQL).  
Revisión de partida: rama `feature/pruebas-y-cliente-http`.  
Relacionada con: [12 — hojas](../../../../../docs-diagrams/12-hojas-modelo-editor-importacion-y-exportacion.md), [16 — tabla central](../../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md), [contrato de hojas](../../../fonts/feature/worksheets/01-contrato-api-hojas.md), [tabla editable](../../../fonts/feature/worksheets/02-tabla-editable-cursos-y-documentacion.md), [rendimiento](../../../fonts/ui/05-rendimiento-vue-nuxt-y-typescript.md), [plan del visor](../feed-viewer/01-plan-visor-y-diagnostico.md) (V0 da las bases de Ark UI).

## Objetivo

Todo lo de «nuestro Excel» que **no necesita la tabla editable**: administrar libros y hojas, ver su historial, importar CSV/XLSX a un borrador, exportar, pasar una hoja al catálogo y abrir un catálogo como hoja, y **ver las filas** con filtros, orden y vistas guardadas. La edición va en el [plan 02](02-plan-tabla-editable-y-borradores.md).

## Decisiones

| ID  | Decisión                                                                                                                                                                                                                                           | Respaldo                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| HW1 | **Servicio de hojas** (`services/worksheets.ts`) que recibe `organizationId` y `projectId`; la organización sale de `$projects.access()` una vez por proyecto                                                                                      | Contrato: prefijo y «Cómo saber la organización»                   |
| HW2 | **Acciones según el permiso:** `capabilities.write` y `capabilities.approve` de cada hoja; archivada (o con el libro archivado) → solo lectura                                                                                                     | Contrato: E10 e interpretación 5                                   |
| HW3 | **Rutas de Nuxt:** `pages/projects/[id]/workbooks/…` y `…/worksheets/[worksheetId]`, sin la organización en la ruta: se resuelve con el acceso (HW1) y las rutas actuales no cambian                                                               | Contrato («Cómo saber la organización»); 16 la proponía en la ruta |
| HW4 | **Importar en un asistente:** subir → vista previa → mapeo (o plantilla guardada, H3) → modo `append`/`upsert` con columna clave → borrador creado. `Steps` y `FileUpload` de Ark, cargado en diferido                                             | Contrato: E6, E7 y E17; ficha ui 05: F6                            |
| HW5 | **Exportar** CSV o XLSX como trabajo; descarga con `DownloadTrigger` y el blob con token                                                                                                                                                           | Contrato E8; ficha ui 03, F2                                       |
| HW6 | **Ver filas** con `rows/query`: filtros por columna solo con los operadores de su tipo, hasta 3 columnas de orden, columnas visibles y vistas guardadas (personal o del equipo, H4). «Cargar más» con `nextCursor`; otra consulta empieza de nuevo | Contrato: E12, E13 e interpretación 2                              |
| HW7 | **Tabla de solo lectura** semántica (aún no `grid`): filas en `shallowRef`, celdas como HTML y valores por tipo (decimales como texto)                                                                                                             | Ficha ui 05: F1, F5; tabla editable, interpretación 3              |
| HW8 | **Puente:** «Llevar al catálogo» desde la hoja; «Abrir como hoja» desde un catálogo terminado                                                                                                                                                      | Contrato E9                                                        |

## Etapas

| Etapa    | Qué                                                                                             | Comprobación prevista                                                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HW-0** | Tipos y servicio de hojas, con el acceso al proyecto                                            | Rutas con `organizationId`, predicados con respuestas válidas e inválidas, `capabilities`                                                                                                                       |
| **HW-1** | Libros y hojas: listar (con o sin archivadas), crear, renombrar, archivar, restaurar y duplicar | Acciones ocultas sin permiso y en una hoja archivada; duplicar muestra su procedencia                                                                                                                           |
| **HW-2** | Historial de la hoja: revisiones, borradores, importaciones y exportaciones, paginados          | Origen de cada revisión (`initialize`, `changeset`, `duplicate`, `catalog`)                                                                                                                                     |
| **HW-3** | Importar (asistente) y plantillas de mapeo                                                      | Vista previa, mapeo con una columna que ya no existe, `upsert` sin columna clave → error de Nest, borrador creado con su `ETag`                                                                                 |
| **HW-4** | Exportar y puente con el catálogo                                                               | Descarga de CSV y XLSX; hoja → catálogo; catálogo → hoja (el mismo número de filas)                                                                                                                             |
| **HW-5** | Ver filas con filtros, orden, columnas y vistas guardadas                                       | Operadores por tipo; vista personal no visible para otro y del equipo sí; «cargar más» hasta 5.000 filas. **Medición:** tiempo de dibujo con 5.000 filas cargadas, para decidir la virtualización en el plan 02 |

En cada etapa: bitácora en `bitacora-construccion/feature/worksheets/`, pruebas (`unit` y `nuxt`), defectos a propósito, verificación completa y recorrido contra Nest local con dos roles (Viewer y Editor).

## Diseño y sensación ([plan ui 04](../../ui/04-plan-sistema-visual-interaccion-y-mascota.md))

- Después de S0–S2 del plan ui 04. Libros, historial, importar y exportar usan la plantilla **«Documento»**; la hoja (HW-5) usa **«Espacio de datos»** (§3.2) con sus cinco zonas y su adaptación a 1280/1024/768/<768.
- El asistente de importación se abre como **«Panel lateral»** (§3.3) y sus pasos usan los tiempos del §6.

## Límites

- Sin edición de celdas ni borradores a mano: plan 02.
- REST por ahora; revisar con C7.
- `worksheet_bindings` (inventario) es de E8.

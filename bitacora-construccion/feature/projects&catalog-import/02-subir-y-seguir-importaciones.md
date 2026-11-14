# 02 — Subir y seguir importaciones de catálogo

Fecha de creación: 2026-11-03
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 3 del [plan ui 01](../../../docs/plans/ui/01-plan-nuxt-ui-focus-proyectos-e-importaciones.md)
Relacionada con: [01 proyectos](01-paginas-de-proyectos.md), [contrato API](../../../docs/fonts/feature/projects&catalog-import/01-contrato-api-proyectos-e-importaciones.md), [curso](../../../docs/fonts/ui/01-curso-nuxt-full-stack-nuxt-ui.md)
Revisión de partida: `57752dc`

## Necesidad y punto de partida

Dentro de cada proyecto: subir el CSV del catálogo, ver cómo avanza y listar o borrar importaciones. La API acepta el archivo con 202 y lo procesa en segundo plano (A5, A6).

## Evidencia y decisiones

| Decisión                                        | Evidencia                   | Aplicación                                                                                                                                                                                  |
| ----------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archivo en `FormData` con los nombres de la API | F11 L29–33; A5, A6          | [services/imports.ts](../../../app/services/imports.ts) `upload`: `idColumn`, `delimiter`, `file`                                                                                           |
| Selector de archivo y validación previa         | D1; A9                      | [ImportUploadForm.vue](../../../app/components/ImportUploadForm.vue): `UFileUpload` de un archivo, esquema con `.csv` y 10 MiB (`MAX_FILE_BYTES`); filas y columnas las valida la API       |
| Seguir el trabajo hasta que termina             | A6, A7; propuesta propia    | [useProjectImports.ts](../../../app/composables/useProjectImports.ts) `waitForJob`: cada 2 s, como máximo 2 min (`JOB_POLLING`); se detiene al salir de la página (`onScopeDispose`)        |
| Tabla con celdas de componentes                 | F6 (72 L15, L29–37; 95 L17) | [ProjectImports.vue](../../../app/components/ProjectImports.vue) `columns`: `accessorKey`, `header`, `cell` con `h(UBadge)` y `h(UButton)`; el motivo de un fallo se muestra bajo el estado |
| Borrar con confirmación                         | A5                          | Un solo `UModal` abierto por `pendingRemoval`                                                                                                                                               |

### Ajustes al escribir el código

- **Estado durante la subida:** `UForm` desactiva el formulario mientras dura `onSubmit`, que incluye la espera del trabajo; un `UAlert` muestra las filas procesadas.
- **Sin estado final a los 2 minutos:** se avisa «Sigue importándose» y la tabla tiene un botón para actualizar. No se sigue consultando para no dejar peticiones sin dueño.
- **20 importaciones más recientes** (límite por defecto de la API); si hay más, se avisa.
- **Columnas del CSV** (muestra de filas en `GET imports/:snapshotId`) quedan para el plan de reglas y evaluaciones.

## Comprobación

| Comprobación                                                     | Resultado                   |
| ---------------------------------------------------------------- | --------------------------- |
| `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` | Sin errores; build completo |

**No verificado:** subida real. Recorrido para el usuario con la API y sesión: subir el CSV de ejemplo de `LearningAllPosibolIt/requests/catalog-import.http`, ver «Importando…» y después «Lista» con sus filas; subir otro mientras el primero sigue activo (la API responde `409 IMPORT_ALREADY_ACTIVE` y debe verse su mensaje); borrar una importación.

## Consecuencias y continuidad

Con proyectos e importaciones, el siguiente paso natural es revisar el catálogo importado con reglas y evaluaciones; tendrá su propio plan en `docs/plans/feature/`.

# 01 — Revisar y exportar: contrato de la API y lugar en el producto

Fecha de creación: 2026-11-05
Tipo de fuente: código propio (backend), su plan y la documentación de producto
Origen: [claudeLearningAllPosibolIt](../../../../../claudeLearningAllPosibolIt), rama `feature/feeds-publications` en `612b745` (el módulo `exports` llega de `f6b4bf9`); [docs-diagrams](../../../../../docs-diagrams)
Fecha de consulta: 2026-11-05
Relacionada con: [plan 01 de revisar y exportar](../../../plans/feature/reviews&exports/01-plan-revisar-y-exportar.md), [contrato de reglas y evaluaciones](../rulesets&evaluations/01-contrato-api-reglas-y-evaluaciones.md)

## Necesidad de consulta

El usuario pidió seguir con la web «según la feature que continúa», guiándose por `docs-diagrams`. Hacía falta saber cuál es la siguiente y qué contrato tiene.

## Localización verificable

| ID  | Fuente                                                                                                                                             | Dónde                                                                                                                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | [09-decisiones-y-plan-de-construccion.md](../../../../../docs-diagrams/09-decisiones-y-plan-de-construccion.md)                                    | Diagrama de incrementos: `2 Mapeo reglas y evaluación` → `3 Revisión y exportación TSV`; tabla, fila 3: «Revisar exclusiones y exportar la evaluación confirmada» (API implementada y verificada en local el 2026-11-02)                                                                                 |
| P2  | [21-acta-e0-adelantar-la-ampliacion.md](../../../../../docs-diagrams/21-acta-e0-adelantar-la-ampliacion.md)                                        | La ampliación E se adelanta en el backend, pero «Nada de A–D se marca como terminado ni se abandona»                                                                                                                                                                                                     |
| X1  | Plan de la API [reviews&exports/01](../../../../../claudeLearningAllPosibolIt/docs/plans/feature/reviews&exports/01-plan-reviews-y-exports.md), D2 | Body `{ evaluationId, resultChecksum, acceptedInvalidCount, acceptedExcludedCount }`; los cuatro obligatorios, también con 0: confirmar es explícito; el servidor compara con lo guardado y, si difiere, `409 EXPORT_APPROVAL_MISMATCH`                                                                  |
| X2  | Mismo plan, D3                                                                                                                                     | Vigente: perfil y motor actuales y sin evaluación posterior `queued`, `running` o `succeeded`; si no, `409 EXPORT_EVALUATION_OUTDATED` o `EXPORT_EVALUATION_SUPERSEDED`                                                                                                                                  |
| X3  | Mismo plan, D9 y D12                                                                                                                               | `POST …/exports` → 201 `{ export, downloadUrl }` o 200 si la evaluación ya tenía exportación; `GET …/exports/:exportId` → `{ export }`; `GET …/exports/:exportId/productos.tsv` con token. Sin listado de exportaciones. No hay recurso de revisión: se revisa con el informe y `errores.csv` existentes |
| X4  | `src/exports/exports.dto.ts`, `exports.types.ts` `ExportView`, `export-approval.ts` `findExportBlocker`                                            | `ExportView`: `id`, `evaluationId`, `acceptedInvalidCount`, `acceptedExcludedCount`, `rowCount`, `byteSize`, `tsvChecksum`, `createdAt`. Orden de bloqueos: sin resultados → desactualizada → reemplazada → sin válidos → aprobación distinta                                                            |
| X5  | `src/common/http/messages.ts`                                                                                                                      | Textos en español de `EXPORT_NO_VALID_PRODUCTS`, `EXPORT_APPROVAL_MISMATCH`, `EXPORT_EVALUATION_OUTDATED`, `EXPORT_EVALUATION_SUPERSEDED`, `EXPORT_FILE_UNAVAILABLE`                                                                                                                                     |
| X6  | `test/features/exports/exports.e2e-spec.ts`                                                                                                        | Recorrido «evaluar, aprobar lo leído, exportar con 201 y consultar»; repetir da 200 con la misma exportación; casos 409                                                                                                                                                                                  |

## Interpretación y límites

- Por el orden de P1, lo siguiente para la web es el incremento 3 (revisar y exportar), no la ampliación E: P2 adelanta E en el backend, pero no la pone delante del trabajo previsto en la interfaz.
- La web solo necesita mostrar lo que la API ya da (`counts`, `resultChecksum`) y pedir la confirmación. Repetir en la web el cálculo de vigencia (X2) duplicaría lógica: basta con mostrar el 409 de la API.
- Sin listado ni enlace desde la evaluación, una exportación ya creada se vuelve a encontrar repitiendo el `POST` (idempotente) o con su id.
- El TSV no se ha probado en Merchant Center (D14 de la API, pendiente de la cuenta piloto).

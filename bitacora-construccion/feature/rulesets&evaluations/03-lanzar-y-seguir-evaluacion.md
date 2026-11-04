# 03 — Lanzar y seguir una evaluación

Fecha de creación: 2026-11-04
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 3 del [plan 01 de reglas y evaluaciones](../../../docs/plans/feature/rulesets&evaluations/01-plan-paginas-reglas-y-evaluaciones.md)
Relacionada con: [02 crear revisión](02-crear-revision.md), [contrato API](../../../docs/fonts/feature/rulesets&evaluations/01-contrato-api-reglas-y-evaluaciones.md), [curso](../../../docs/fonts/feature/rulesets&evaluations/02-curso-paginacion-maestro-detalle-y-modales.md), [importaciones](../projects&catalog-import/02-subir-y-seguir-importaciones.md)
Revisión de partida: `c7c02b4`

## Necesidad y punto de partida

Con revisiones ya creables, faltaba aplicarlas: elegir importación y revisión, empezar la evaluación y ver su resultado. La API la procesa en segundo plano (B7) y no las lista.

## Evidencia y decisiones

| Decisión                               | Evidencia                      | Aplicación                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tipos y comprobaciones de la respuesta | B7, B8                         | [types/evaluations.ts](../../../app/types/evaluations.ts): `isEvaluationDetail`, `isEvaluationRow`, `isActiveEvaluation`; los campos que la web no usa (`engineVersion`, `resultChecksum`…) se ignoran                                                                                                                                           |
| Servicio                               | B7                             | [services/evaluations.ts](../../../app/services/evaluations.ts): `create` devuelve el `evaluationId` del 202; `find` devuelve `{ evaluation, sample }`                                                                                                                                                                                           |
| Modal propio de la funcionalidad       | C5 (126 L19–31, 129 L19)       | [EvaluateDialog.vue](../../../app/components/EvaluateDialog.vue): carga importaciones y revisiones, preselecciona la importación lista más reciente y la revisión pedida o la última; al aceptar, toast y navegación a la evaluación. Los errores de B9 (`EVALUATION_COLUMN_MISSING`, `EVALUATION_ALREADY_ACTIVE`…) se muestran dentro del modal |
| Entradas                               | Plan                           | «Evaluar» en la lista de reglas y «Evaluar con esta revisión» en cada revisión                                                                                                                                                                                                                                                                   |
| Seguimiento automático                 | B7, B8; patrón de `waitForJob` | [useEvaluation.ts](../../../app/composables/useEvaluation.ts): cada respuesta decide si pedir otra en 2 s; se detiene al terminar, a los 10 minutos (`EVALUATION_POLLING`) o al salir de la página                                                                                                                                               |
| Página con estado, conteos y muestra   | C3, C4; D3 (Focus)             | [evaluations/[evaluationId].vue](../../../app/pages/projects/[id]/evaluations/[evaluationId].vue): estado en una insignia, barra de progreso mientras evalúa, motivo si falla, cuatro [CountTile](../../../app/components/CountTile.vue) y la muestra en [EvaluationRowsTable](../../../app/components/EvaluationRowsTable.vue)                  |
| Nombre del archivo evaluado            | B10                            | `useImportSnapshot` con el `snapshotId` de la evaluación                                                                                                                                                                                                                                                                                         |

### Ajustes al escribir el código

- **Diez minutos y no dos:** las importaciones esperan 2 minutos; una evaluación de 5.000 filas puede tardar más. Pasado el límite se avisa «Sigue evaluándose» con «Actualizar».
- **Fallo al actualizar con datos visibles:** se muestra un aviso con «Actualizar» y el seguimiento se para; no se reintenta solo para no insistir contra una API caída.
- **Motivo de cada fila en la muestra:** el primer problema y «y N más»; las excluidas dicen qué regla las excluyó. El detalle completo llega con el informe (incremento 4).
- **Corte de la sesión:** el trabajo se interrumpió tras crear el modal; al retomar se comprobó con `git status` que solo estaban los cambios propios y se continuó.

## Comprobación

| Comprobación                                                                                                | Resultado                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`                                                          | Sin errores                                                                                                                                                        |
| `pnpm build`                                                                                                | Completo en 11,6 s                                                                                                                                                 |
| `types/evaluations.ts` empaquetado con esbuild y ejecutado con Node sobre respuestas con la forma de la API | Acepta evaluación terminada con muestra (válida, inválida y excluida), en cola sin muestra (activa) y fallida con error (no activa); rechaza un estado desconocido |

**No verificado:** el modal, la página y el seguimiento en el navegador, con la API real. Recorrido para el usuario: desde una revisión, «Evaluar con esta revisión»; ver «En cola» o «Evaluando» y que cambie sola a «Terminada» con los conteos y las primeras filas; lanzar otra mientras la primera sigue (debe verse `EVALUATION_ALREADY_ACTIVE` en el modal); evaluar con una revisión que mapea una columna inexistente en esa importación (el error de la API).

## Consecuencias y continuidad

La URL de la evaluación es el único acceso a ella hasta que la API pueda listarlas (incremento 5, bloqueado). Siguiente: incremento 4, informe paginado y filtrado y descarga de `errores.csv`.

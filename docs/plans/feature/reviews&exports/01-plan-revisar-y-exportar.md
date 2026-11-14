# 01 — Plan: revisar una evaluación y exportar productos.tsv

Fecha de creación: 2026-11-05
Estado: Plan
Ámbito: `KSuT/LearningAllPosibolIt-web`
Relacionada con: [fuentes](../../../fonts/feature/reviews&exports/01-contrato-api-y-orden-del-producto.md), [plan de reglas y evaluaciones](../rulesets&evaluations/01-plan-paginas-reglas-y-evaluaciones.md), [informe y errores.csv](../../../../bitacora-construccion/feature/rulesets&evaluations/04-informe-y-errores-csv.md)
Revisión de referencia: web `9876ad1`; API `612b745`.

## Objetivo

En la página de una evaluación terminada, la persona revisa el informe (ya existe), confirma de forma explícita cuántas filas inválidas y excluidas quedan fuera, y obtiene `productos.tsv` para descargar. Si la API no permite exportar, se muestra su motivo con una salida útil.

Estará completo cuando pase `format:check`, `lint`, `typecheck` y `build`, y el usuario pueda exportar y descargar con la API y su sesión.

## Fuentes y decisiones

| Necesidad                      | Fuente                             | Alternativa                                           | Decisión propuesta                                                                                                                                            |
| ------------------------------ | ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dónde se revisa                | X3 (D12), informe existente        | Página de revisión aparte                             | En la misma página de la evaluación: el informe es la revisión y la exportación va debajo                                                                     |
| Confirmación explícita         | X1 (D2)                            | Botón directo                                         | Resumen «se exportan N válidos; quedan fuera X inválidos y Y excluidos», casilla «He revisado…» obligatoria y botón «Exportar productos.tsv»                  |
| Datos de la aprobación         | X1, X4                             | Pedirlos a la persona                                 | Se envían `resultChecksum` y conteos tal como llegaron del `GET` de la evaluación; la web añade `resultChecksum` a su tipo `Evaluation`                       |
| Sin productos válidos          | X4, X5                             | Dejar que la API responda 409                         | Se anticipa sin pedir nada: con `counts.valid === 0` el panel explica el motivo y no ofrece exportar (es un dato ya visible, no lógica nueva)                 |
| Vigencia y aprobación distinta | X2, X5                             | Calcular en la web si hay una evaluación más reciente | Mostrar el 409 de la API; con `EXPORT_APPROVAL_MISMATCH`, acción «Volver a leer»; con `EXPORT_EVALUATION_SUPERSEDED`, enlace al historial                     |
| Recordar la exportación        | X3 (sin listado; POST idempotente) | `localStorage`                                        | `?exportacion=<id>` en la URL tras exportar, como el filtro del informe; al recargar se lee con `GET …/exports/:id`. Repetir la exportación devuelve la misma |
| Descargar                      | X3; patrón de `errores.csv`        | Enlace directo (sin token)                            | `responseType: 'blob'` y `saveBlob`, ya existentes                                                                                                            |

## Incrementos

1. Tipos y comprobaciones (`ExportView`), servicio `exports` (`create`, `find`, `download`), `resultChecksum` en `Evaluation`.
2. Composable `useEvaluationExport` (lectura por `?exportacion=`, exportar, estado de error) y componente `ExportPanel` en la página de la evaluación.
3. Comprobaciones, bitácora y versión `v0.3.0` (historial de evaluaciones + exportación).

## Comprobación prevista

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; funciones puras probadas con esbuild y Node (comprobación de la respuesta). Recorrido del usuario: exportar una evaluación vigente, descargar, recargar con `?exportacion=`, intentar exportar una evaluación anterior a otra más reciente.

## Límites y continuidad

Fuera: feeds y publicación (incremento 5 de `docs-diagrams`, siguiente plan de la web), organizaciones y hojas (ampliación E). Revisar si la API añade un listado de exportaciones o un enlace desde la evaluación.

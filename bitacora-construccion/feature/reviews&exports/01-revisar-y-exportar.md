# 01 — Revisar una evaluación y exportar productos.tsv

Fecha de creación: 2026-11-05
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: [plan 01 de revisar y exportar](../../../docs/plans/feature/reviews&exports/01-plan-revisar-y-exportar.md) (incremento 3 de `docs-diagrams/09`)
Relacionada con: [fuentes](../../../docs/fonts/feature/reviews&exports/01-contrato-api-y-orden-del-producto.md), [informe y errores.csv](../rulesets&evaluations/04-informe-y-errores-csv.md), [historial](../rulesets&evaluations/05-historial-de-evaluaciones.md)
Revisión de partida: `9876ad1`; API `612b745`

## Necesidad y punto de partida

El usuario pidió seguir con la siguiente funcionalidad según `docs-diagrams`. Tras «mapeo, reglas y evaluación» viene «revisión y exportación TSV» (P1). La API ya la tiene; la web mostraba el informe y `errores.csv`, pero no exportaba.

## Evidencia y decisiones

| Decisión                        | Evidencia                                             | Aplicación                                                                                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tipos comprobados               | X4                                                    | [types/exports.ts](../../../app/features/exports/types/exports.ts) `ProductExport`, `ExportApproval`, `isProductExport`; `resultChecksum` añadido a `Evaluation` en [types/evaluations.ts](../../../app/features/evaluations/types/evaluations.ts) |
| Servicio                        | X3                                                    | [services/exports.ts](../../../app/features/exports/services/exports.ts): `create` (201 o 200), `find` y `download` con `responseType: 'blob'`                                                                                |
| Exportación recordada en la URL | X3 (sin listado; POST idempotente); C1/C2 del informe | [useEvaluationExport.ts](../../../app/features/exports/composables/useEvaluationExport.ts): `?exportacion=<id>` con `router.replace`; si el id de la URL es de otra evaluación, no se muestra                                 |
| Revisión en la misma página     | X3 (D12)                                              | [ExportPanel.vue](../../../app/features/exports/components/ExportPanel.vue) debajo del informe en [evaluations/[evaluationId].vue](../../../app/pages/projects/[id]/evaluations/[evaluationId].vue)                           |
| Confirmación explícita          | X1 (D2)                                               | Resumen de lo que entra y lo que queda fuera, casilla «He revisado los productos que quedan fuera» obligatoria; se envían `resultChecksum` y conteos tal como llegaron                                       |
| Sin válidos                     | X4, X5                                                | Con `counts.valid === 0` no se ofrece exportar y se enlaza a las reglas                                                                                                                                      |
| Motivos de la API               | X2, X5                                                | El 409 se muestra con su texto; `EXPORT_APPROVAL_MISMATCH` → «Volver a leer la evaluación» (la página vuelve a pedirla); reemplazada o desactualizada → «Ver evaluaciones»                                   |

### Ajustes al escribir el código

- **Conteos como prop aparte:** el panel recibía `Evaluation & { counts }`, que obligaba a forzar el tipo en la página. Recibe `counts` por separado, como el informe.
- **`router.replace` y no `push`:** exportar no es una navegación; volver atrás no debe pasar por la página sin la exportación.

## Comprobación

| Comprobación                                                  | Resultado                                                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`            | Sin errores                                                                                                                                                                               |
| `pnpm build`                                                  | Completo en 10,2 s                                                                                                                                                                        |
| Comprobaciones empaquetadas con esbuild y ejecutadas con Node | `isProductExport` acepta la vista de la API (también con campos extra) y rechaza una sin `rowCount`; `isEvaluationDetail` acepta `resultChecksum` como texto o `null` y rechaza un número |

**No verificado:** con la API y sesión. Recorrido para el usuario: en la evaluación más reciente, marcar la casilla y exportar; descargar `productos.tsv`; recargar (debe seguir la exportación por `?exportacion=`); exportar otra vez (misma exportación); intentar exportar una evaluación anterior a otra más reciente (debe verse el mensaje de evaluación reemplazada). El TSV en Merchant Center sigue pendiente de la cuenta piloto.

## Consecuencias y continuidad

La web cubre ya el recorrido A completo: proyecto → CSV → reglas → evaluación → revisión → `productos.tsv`. Siguiente según `docs-diagrams/09`: incremento 5, feeds con URL estable y actualización diaria (la API lo tiene en `ae542df`).

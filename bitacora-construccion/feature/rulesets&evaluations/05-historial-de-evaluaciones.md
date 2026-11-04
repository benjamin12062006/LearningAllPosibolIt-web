# 05 — Historial de evaluaciones

Fecha de creación: 2026-11-04
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 5 del [plan 01 de reglas y evaluaciones](../../../docs/plans/feature/rulesets&evaluations/01-plan-paginas-reglas-y-evaluaciones.md)
Relacionada con: [04 informe](04-informe-y-errores-csv.md), [plan 02 de la API](../../../../claudeLearningAllPosibolIt/docs/plans/feature/rulesets&evaluations/02-plan-listar-evaluaciones.md), [bitácora 05 de la API](../../../../claudeLearningAllPosibolIt/bitacora-construccion/feature/rulesets&evaluations/05-listar-evaluaciones.md)
Revisión de partida: `db4a674` (`v0.2.0`)

## Necesidad y punto de partida

Solo se llegaba a una evaluación al lanzarla o por su URL. El usuario eligió añadir el listado en la API `claudeLearningAllPosibolIt`: `GET /projects/:projectId/evaluations` → `{ evaluations, page }`, de la más reciente a la más antigua y sin muestra. Esa ruta está implementada y probada en la API, pero **todavía sin commit allí** (ver la bitácora 05 de la API).

## Evidencia y decisiones

| Decisión                                      | Evidencia                                                                | Aplicación                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comprobar la respuesta                        | Bitácora 05 de la API (vista igual a la de una evaluación, sin `sample`) | `isEvaluationList` en [types/evaluations.ts](../../../app/types/evaluations.ts) reutiliza la comprobación de cada evaluación                                                      |
| Servicio y composable con el patrón de reglas | `rulesets.list` y `useRulesets`                                          | `list` en [services/evaluations.ts](../../../app/services/evaluations.ts) (límite 100) y `useEvaluations` en [useEvaluation.ts](../../../app/composables/useEvaluation.ts)        |
| Página y pestaña                              | Plan, «Dónde viven las páginas»                                          | [evaluations/index.vue](../../../app/pages/projects/[id]/evaluations/index.vue) con «Evaluar»; pestaña «Evaluaciones» en [ProjectNav.vue](../../../app/components/ProjectNav.vue) |
| Fila estilo Focus                             | D3                                                                       | [EvaluationRow.vue](../../../app/components/EvaluationRow.vue): icono por estado, revisión, conteos o estado, y fecha con hora                                                    |

### Ajustes al escribir el código

- **Sin nombre del archivo en cada fila:** pedir cada importación sería una petición por fila; se muestra la revisión y los conteos. El nombre se ve al abrir la evaluación.
- **Sin seguimiento automático en la lista:** una evaluación en curso aparece como «En cola» o «Evaluando»; al abrirla, su página se actualiza sola.

## Comprobación

| Comprobación                                                    | Resultado                                                                                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`              | Sin errores                                                                                                       |
| `pnpm build`                                                    | Completo en 10,2 s                                                                                                |
| `isEvaluationList` empaquetado con esbuild y ejecutado con Node | Acepta una lista con una evaluación en cola y otra terminada, y una lista vacía; rechaza una respuesta sin `page` |
| Ruta de la API                                                  | Probada en la API con sus pruebas e2e (bitácora 05 de la API)                                                     |

**No verificado:** la página con la API real y sesión. Requiere arrancar la API con su árbol actual (la ruta aún no tiene commit allí).

## Consecuencias y continuidad

El plan 01 de reglas y evaluaciones queda completo en la web. Pendiente: el commit de la ruta en la API, coordinado con las sesiones que trabajan allí.

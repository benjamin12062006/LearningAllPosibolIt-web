# 04 — Informe paginado y descarga de errores.csv

Fecha de creación: 2026-11-04
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 4 del [plan 01 de reglas y evaluaciones](../../../docs/plans/feature/rulesets&evaluations/01-plan-paginas-reglas-y-evaluaciones.md)
Relacionada con: [03 lanzar y seguir](03-lanzar-y-seguir-evaluacion.md), [contrato API](../../../docs/fonts/feature/rulesets&evaluations/01-contrato-api-reglas-y-evaluaciones.md), [curso](../../../docs/fonts/feature/rulesets&evaluations/02-curso-paginacion-maestro-detalle-y-modales.md)
Revisión de partida: `9b4d58a`

## Necesidad y punto de partida

La página de la evaluación mostraba conteos y las 20 primeras filas. Faltaba ver todas las filas, filtrarlas por resultado, leer cada problema con su corrección y descargar `errores.csv`. Todo contra la API [LearningAllPosibolIt](../../../../LearningAllPosibolIt) (`GET …/rows` y `GET …/errors.csv`, B7).

## Evidencia y decisiones

| Decisión                   | Evidencia                                                  | Aplicación                                                                                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filtro y página en la URL  | C1 (70 L23–25), C2 (71 L15–17)                             | [useEvaluationReport.ts](../../../app/composables/useEvaluationReport.ts): `?resultado=todas\|validas\|invalidas\|excluidas` y `?pagina=N` (no válida → 1); `setFilter` vuelve a la página 1 y `setPage` conserva el resto con `...route.query`                                       |
| Total para la paginación   | B7 (la API solo da `hasMore`), B8 (`counts`)               | `countForFilter` toma el total de los conteos de la evaluación; `UPagination` con 20 filas por página (`REPORT_PAGE_SIZE`)                                                                                                                                                            |
| Valor de la URL comprobado | Propuesta propia                                           | `isOutcomeFilter` usa `Object.hasOwn`: `__proto__` o `toString` no cuentan como filtro                                                                                                                                                                                                |
| Pestañas con conteo        | D5 (UTabs)                                                 | [EvaluationReport.vue](../../../app/components/EvaluationReport.vue): `UTabs` sin contenido, enlazado a la URL con un `computed` de lectura y escritura                                                                                                                               |
| Filas desplegables         | F6 (72 L15, 95 L17); paquete `Table.vue.d.ts` (`expanded`) | [EvaluationRowsTable.vue](../../../app/components/EvaluationRowsTable.vue): botón por fila con problemas y slot `#expanded` con atributo, problema y sugerencia en español; se cierran al cambiar de página o filtro                                                                  |
| Descarga con token         | B7, B11; propuesta propia                                  | `responseType: 'blob'` en [api-client.ts](../../../app/services/api-client.ts), `errorsCsv` en [services/evaluations.ts](../../../app/services/evaluations.ts) y [saveBlob](../../../app/utils/download.ts) con un enlace temporal que se libera después; botón solo si hay inválidas |
| Sustituir la muestra       | B7 (la muestra son las 20 primeras filas)                  | La primera página del informe ya las muestra; `useEvaluation` deja de exponer `sample`                                                                                                                                                                                                |

### Ajustes al escribir el código

- **Tipo de las filas abiertas:** `ExpandedState` está en `@tanstack/vue-table`, que no es dependencia directa (pnpm no deja importarla). Se definió `ExpandedRows` con la misma forma.
- **Un `as` evitado:** las pestañas se construían con `Object.keys(...) as OutcomeFilter[]`; se cambió por la lista `OUTCOME_FILTER_ORDER`.
- **Composable más simple:** recibía un indicador de «tiene resultados» para no pedir antes de tiempo (la API responde 409). Como `EvaluationReport` solo se monta con la evaluación terminada, el indicador sobraba y se quitó.
- **Idioma de `errores.csv`:** siempre `?lang=es`, como el resto de la web.

## Comprobación

| Comprobación                                                         | Resultado                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`                   | Sin errores                                                                                                                                                                                                                                      |
| `pnpm build`                                                         | Completo en 10,5 s                                                                                                                                                                                                                               |
| Funciones del informe empaquetadas con esbuild y ejecutadas con Node | `countForFilter` da 120/70/40/10 con esos conteos; `isOutcomeFilter` acepta `invalidas` y `todas` y rechaza `__proto__`, `toString`, `INVALIDAS`, `undefined` y un arreglo; `attributeLabel` da «Imagen», «Identificador» y deja `gtin` tal cual |

**No verificado:** con la API real y sesión. Recorrido para el usuario: en una evaluación terminada, pasar a «Inválidas» y ver que la URL cambia a `?resultado=invalidas`; ir a la página 2 y recargar (debe seguir allí); abrir una fila y leer sus problemas; descargar `errores.csv` y abrirlo en Excel o Numbers (la API añade BOM para que se vean bien los acentos).

## Consecuencias y continuidad

Con los incrementos 1–4 el recorrido importar → reglas → evaluar → informe está completo en la web; se guarda como `v0.2.0`. Queda el incremento 5 (historial de evaluaciones), bloqueado hasta que la API tenga un listado.

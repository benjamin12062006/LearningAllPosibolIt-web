# 04 — Motor de cálculo compartido entre Nest y la web

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: código de la API (solo lectura) y medición propia.  
Relacionada con: [evaluación de Leptos y WASM (03)](03-evaluacion-leptos-wasm-para-la-hoja.md), [ficha ui 05 (rendimiento)](../../ui/05-rendimiento-vue-nuxt-y-typescript.md), [contrato de hojas (01)](01-contrato-api-hojas.md), [16 — tabla y cálculos](../../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md#tabla-de-hojas-y-cálculos).

## Necesidad

El usuario aprobó (2026-11-14) reutilizar en la web el motor de fórmulas de Nest para la vista previa mientras se edita. Hay que saber qué archivos son, qué importan, cómo compartirlos sin que la web y el servidor diverjan y cuánto cuesta calcular.

## Evidencia (M)

| ID  | Fuente                                                                                   | Qué se observa                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | API, `src/worksheets/exact-decimal.ts` (120 líneas)                                      | Números como fracción de dos `BigInt` (suma, resta, multiplicación, división y redondeo). **No importa nada**                                                                                                          |
| M2  | Medición del 2026-11-14 ([evaluación 03](03-evaluacion-leptos-wasm-para-la-hoja.md), M2) | 5.000 filas × 20 columnas, 5 calculadas: **mediana de 43,8 ms** la hoja entera en Node 26.9 (V8); una fila, unos 0,009 ms                                                                                              |
| M3  | `src/worksheets/formula.ts` (142 líneas)                                                 | Árbol `{ op, args }`, `{ column }` y `{ value }`; motor versionado `CALCULATION_ENGINE = 'calc-v1'`; límites de profundidad 5 y 25 nodos; un solo redondeo al final; sin `eval`. **Solo importa `exact-decimal.js`**   |
| M4  | `src/worksheets/cell-values.ts` (85 líneas)                                              | Valores canónicos por tipo (los decimales viajan como texto) y problemas de celda. Importa `exact-decimal.js` y **solo tipos** (`ColumnType` y `SelectionOption`) de `worksheet-columns.js`                            |
| M5  | `src/worksheets/row-evaluation.ts` (145 líneas)                                          | `evaluateRow(columns, cellValues, selectedIds)` → `{ values, problems }`. Las calculadas salen del motor; las demás se validan. Importa los anteriores y **solo un tipo** (`WorksheetColumn`) de `worksheets.types.js` |
| M6  | `FormulaExpression` (M3)                                                                 | Una fórmula solo referencia **columnas de la misma fila**: editar una celda solo puede cambiar las calculadas de esa fila                                                                                              |

## Opciones para compartirlo

Nest y la web son **repositorios separados, sin remoto común**.

| Opción                                      | Cómo                                                                                                                                                                                                                                                                                                                               | Valoración                                                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Dependencia `file:` a la carpeta de Nest | `"calc": "file:../LearningAllPosibolIt/src/worksheets"`                                                                                                                                                                                                                                                                            | Depende de que los dos repositorios estén uno junto al otro; la carpeta trae todo el módulo de hojas de Nest. Frágil en CI y en despliegue |
| B. Paquete propio en un tercer repositorio  | Publicar `calc-v1` como paquete                                                                                                                                                                                                                                                                                                    | Correcto a largo plazo, pero hoy no hay registro ni remoto: es más infraestructura que problema                                            |
| **C. Copia exacta y comprobada**            | Los 4 archivos **sin cambiar ni un byte** en `app/features/worksheets/calc-engine/`, más dos archivos de tipos con los mismos nombres (`worksheet-columns.ts` y `worksheets.types.ts`) que exportan solo los tipos que se usan. Un script compara las copias con Nest, y unas pruebas con casos fijos dan los mismos resultados en los dos lados | **Recomendada.** El motor ya está versionado (`calc-v1`): un cambio en Nest es explícito y el script lo detecta                            |

## Interpretación

1. **Copia exacta (opción C).** Como los archivos no cambian, la comprobación es una comparación de contenido: un _script_ (`scripts/check-calc-engine.mjs`) busca la carpeta de Nest al lado y falla si algún archivo difiere. Sin Nest al lado (por ejemplo en CI), lo avisa y se apoya en las pruebas de casos fijos.
2. **Casos fijos compartidos.** Un JSON con fórmulas, entradas y resultados esperados (división por cero, redondeo y entradas vacías), probado en la web con Vitest. Los mismos casos pueden añadirse a Nest más adelante, sin tocarlo ahora.
3. **Rendimiento** (ficha ui 05): recalcular **solo la fila editada** (M6); la hoja entera solo al abrirla o al cambiar el esquema. 44 ms están por debajo del umbral de tarea larga (50 ms), así que **no hace falta Web Worker** con los límites actuales. Si se mide más, se mueve `evaluateRow` a un Worker sin cambiar el código, porque es una función pura.
4. **Nest sigue mandando** (documento 16): lo calculado en la web se marca como vista previa; el valor oficial es el que devuelve Nest al leer la revisión o el borrador.
5. **Importaciones con `.js`:** el motor importa `./exact-decimal.js` refiriéndose al archivo `.ts`. TypeScript con resolución `bundler` lo admite; hay que comprobar en la etapa que Vite también lo resuelve, con `pnpm build` y una prueba.

## Mapa necesidad → fuentes → decisión

| Necesidad                     | Fuentes        | Decisión (plan worksheets 02)                                                       |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| Mismo cálculo que el servidor | M1–M5          | Copia exacta en `app/features/worksheets/calc-engine/` y tipos en archivos con los mismos nombres |
| Detectar divergencias         | M3 (`calc-v1`) | `scripts/check-calc-engine.mjs` y casos fijos con Vitest                            |
| Rapidez al editar             | M2, M6         | Solo la fila editada; sin Worker mientras no se mida ≥ 50 ms                        |
| Autoridad del servidor        | 16             | Vista previa marcada; Nest confirma                                                 |

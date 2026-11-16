# 02 — Tabla editable: cursos y documentación (I4)

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: documentos de diseño, transcripciones locales (originales), paquetes `@ark-ui/vue` 5.40.0 y `@zag-js` 1.47.0 (solo lectura), registro de npm y documentación oficial (WAI-ARIA APG y MDN).  
Relacionada con: [contrato de hojas (01)](01-contrato-api-hojas.md), [plan de investigación ui 02](../../../plans/ui/02-plan-investigacion-visor-y-hojas.md), [16 — tabla central](../../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md#tabla-de-hojas-y-cálculos), [ficha ui 03](../../ui/03-ark-ui-tema-y-organizacion-por-funcion.md).

## Necesidad

La tabla editable es la pieza más grande de la web (E7). Antes de la prueba E7.0 del documento 16 conviene saber qué piden el diseño y la accesibilidad, qué piezas ya existen y dónde están los riesgos: teclado, pegado, guardado del borrador, decimales exactos y volumen.

## Requisitos del diseño (H)

| ID  | Fuente                                       | Requisito                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | 16, «Tabla de hojas y cálculos»              | Prueba E7.0: tabla Vue con **HTML semántico y controles de Ark UI**. Comprobar edición tipada, teclado, selección por IDs, pegado de bloques acotados y paginación de Nest. **Medir con el volumen previsto antes de virtualizar.**                                        |
| H2  | 16, mismo apartado                           | Lo que necesite APIs del navegador, con `.client.vue` o `ClientOnly`. Las páginas cargadas, fuera del estado reactivo profundo.                                                                                                                                            |
| H3  | 16, «Estado que debe distinguir la interfaz» | No mezclar «guardado» con «aplicado». **Autoguardado solo del borrador**, con espera (_debounce_), versión esperada y reintento idempotente; nunca aprueba. Al volver la red, releer antes de reintentar. Navegar con cambios sin guardar exige guardarlos o descartarlos. |
| H4  | 16, mismo apartado                           | Ordenar y filtrar no cambian los IDs seleccionados. Mostrar si hay selección fuera de la página. Avisar al borrar una columna de las fórmulas y mapeos que dependen de ella.                                                                                               |
| H5  | 16, accesibilidad                            | Teclado, edición que no dependa solo del color, error por celda, progreso anunciado, diferencias legibles con lector de pantalla, zoom, ventana estrecha y textos largos (T23 del documento 18).                                                                           |

## Documentación y paquetes (F)

| ID  | Fuente                                                              | Qué se observa                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | WAI-ARIA APG, _Grid pattern_ (`w3.org/WAI/ARIA/apg/patterns/grid/`) | El _grid_ es para datos «editable or interactive»; una tabla estática mete cada enlace en el orden de tabulación. Teclado: flechas, Inicio/Fin, Ctrl+Inicio/Fin, RePág/AvPág, **Intro o F2 para editar** y **Escape para volver**, que «may also undo edits». Solo un elemento del _grid_ está en la tabulación; el foco interno lo gestiona el autor. `aria-readonly` en celdas no editables. `aria-rowcount` y `aria-rowindex` cuando no todas las filas están en el DOM |
| F2  | MDN, `Element: paste event`                                         | En el evento se lee `clipboardData.getData("text")`; para pegar a mano hay que cancelar la acción por defecto con `preventDefault()`                                                                                                                                                                                                                                                                                                                                       |
| F3  | `@zag-js/editable` 1.47.0 (base de `Editable` de Ark)               | `ActivationMode = "focus" \| "dblclick" \| "click" \| "none"` y `SubmitMode = "enter" \| "blur" \| "both" \| "none"`                                                                                                                                                                                                                                                                                                                                                       |
| F4  | `@zag-js/number-input` 1.47.0 y tipos de Ark                        | **El valor es `string`**, con `formatOptions` (`Intl.NumberFormatOptions`) y `inputMode`                                                                                                                                                                                                                                                                                                                                                                                   |
| F5  | Paquete de Ark 5.40.0                                               | Controles por tipo de celda: `Editable` (texto), `NumberInput` (entero y decimal), `Checkbox` o `Switch` (booleano), `Select` o `Combobox` (selección), `DatePicker` (fecha), `Menu` (acciones de fila o columna), `Splitter` (_Preview_: tabla y chat) y `Toast` (avisos de guardado)                                                                                                                                                                                     |
| F6  | npm                                                                 | `@tanstack/vue-table` 9.3.1 (2026-10-12) y `@tanstack/vue-virtual` 3.13.52 (2026-11-03), los dos para Vue 3                                                                                                                                                                                                                                                                                                                                                                |

## Cursos (C)

Búsquedas con `buscar-aprendizaje-en-cursos`: «navegación con teclado tabla», «portapapeles pegar clipboard», «autoguardado debounce», «scroll virtual listas grandes» y «componentes headless accesibles». **No hay en la biblioteca ninguna clase sobre tablas editables, teclado en una tabla, pegado del portapapeles, autoguardado ni virtualización en Vue o Nuxt** (los resultados eran de Power BI, Tableau, Django, React Native o SwiftUI). Lo útil para piezas concretas:

| ID  | Lección                                                                                       | Qué aporta                                                                                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Nuxt Full Stack, `Sección 8…/95. Componentes dinámicos de Nuxt en TanStack Table.md`, L17–L19 | `UTable` es TanStack Table con el estilo de Nuxt UI; las celdas con componentes se crean con `h()`                                                                                                                |
| C2  | Vue con Pinia y Testing, `Sección 16…/234. Custom input y v-model.md`, L13–L19                | Un control propio con `modelValue` (texto o número) y `error` opcional, reutilizable en todos los formularios: base de un `CellEditor` por tipo                                                                   |
| C3  | Misma obra, `Sección 6…/77. Probar modificadores de eventos.md`, L13                          | Probar que Intro envía y que no emite nada si no hay texto: el mismo tipo de prueba sirve para Intro, F2 y Escape en una celda                                                                                    |
| C4  | Vue 3 con TypeScript y Quasar, `Sección 5…/56. Invalidar Queries.md`, L13–L15                 | Después de una mutación se invalida lo leído para que la siguiente lectura traiga datos frescos: tras aplicar un borrador se invalidan las filas y el historial (con `clearNuxtData` o `refreshNuxtData` de Nuxt) |

No hace falta reconstruir lecciones: ninguna decisión de aquí depende del código de una clase, sino de la documentación de F.

## Interpretación y adaptación

1. **`grid` y no tabla estática** (F1): las celdas son editables, así que la tabla de hojas es un `role="grid"` con foco gestionado. El visor, en cambio, es una tabla estática (ficha feed-viewer 02).
2. **Una celda = navegar o editar.** Navegar con flechas; Intro o F2 abren el editor del tipo (F5); Escape lo cierra y deshace; Intro guarda. `Editable` de Ark encaja en texto con `activationMode: "none"` (lo abre la tabla) y `submitMode: "enter"` (F3). Los demás tipos usan su control.
3. **Decimales exactos.** Nest guarda los decimales como texto exacto. `NumberInput` trabaja con `string` (F4): se envía tal cual, sin pasar por `Number`, que perdería precisión.
4. **TanStack Table: sí, pero solo como modelo.** C1 enseña `UTable`, pero el documento 16 pide HTML propio. TanStack Table puede llevar columnas, visibilidad y selección por ID **sin imponer marcado**. El orden y el filtro los hace Nest (contrato E12). Se decide en E7.0: si el modelo propio queda pequeño, sobra.
5. **Virtualizar solo si se mide** (H1): con «cargar más» de 100 en 100 (contrato, interpretación 3) y un máximo de 5.000 filas, se mide el desplazamiento con 5.000 filas cargadas antes de añadir TanStack Virtual (F6). Si se virtualiza, `aria-rowcount` y `aria-rowindex` (F1).
6. **Pegado** (F2): leer el texto, cortarlo por tabuladores y saltos de línea (lo que copian Excel y Google Sheets) y convertirlo en operaciones `set_cell` desde la celda activa. Limitar el bloque para no pasar de 1.000 operaciones por guardado (contrato E14) y avisar si se recorta.
7. **Autoguardado del borrador** (H3, contrato E16): acumular operaciones en un búfer local, guardar tras una pausa con `If-Match` y quedarse con el nuevo `ETag`. Ante un 412, releer el borrador y no pisarlo. «Guardado» (borrador) y «aplicado» (revisión nueva) se muestran distintos.
8. **Navegación protegida** (H3): `onBeforeRouteLeave` de Vue Router y `beforeunload` cuando hay operaciones sin guardar.

## Mapa necesidad → fuentes → decisión pendiente

| Necesidad                      | Fuentes          | Decisión pendiente (para E7.0)                             |
| ------------------------------ | ---------------- | ---------------------------------------------------------- |
| Teclado y foco                 | F1, H5           | `role="grid"` con foco gestionado; Intro/F2/Escape         |
| Editores por tipo              | F3–F5, C2        | `CellEditor` por tipo sobre Ark; decimales como texto      |
| Modelo de columnas y selección | C1, F6, H4       | TanStack Table como modelo, o modelo propio: medir en E7.0 |
| Volumen                        | H1, F6           | Medir con 5.000 filas antes de virtualizar                 |
| Pegado                         | F2, contrato E14 | Pegar TSV en `set_cell`, acotado a 1.000 operaciones       |
| Autoguardado                   | H3, contrato E16 | Búfer, pausa, `If-Match`/`ETag`; 412 → releer              |
| Tras aplicar                   | C4               | Invalidar filas e historial                                |
| Pruebas                        | C3               | Pruebas de teclado y de editores (ficha ui 04)             |

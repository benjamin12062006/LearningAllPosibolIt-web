# 05 — Rendimiento en Vue, Nuxt y TypeScript: prácticas documentadas

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: documentación oficial (Vue, MDN), tipos de Nuxt 4.6.2 instalado, transcripciones locales y mediciones propias.  
Relacionada con: [ficha ui 04 (bases comunes)](04-bases-comunes-para-visor-y-hojas.md), [tabla editable](../feature/worksheets/02-tabla-editable-cursos-y-documentacion.md), [motor de cálculo compartido](../feature/worksheets/04-motor-de-calculo-compartido.md), [interfaz del visor](../feature/feed-viewer/02-cursos-y-documentacion-interfaz-del-visor.md).

## Necesidad

El usuario pidió (2026-11-14) usar **lo mejor de TypeScript y Vue para el rendimiento**, con buenas prácticas documentadas y sin inventar, y con código legible. Esta ficha reúne solo prácticas con fuente, para que los planes las apliquen donde se midan.

## Fuentes (F, C)

| ID  | Fuente                                                                                                                              | Qué dice                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Vue, _Performance_ (`vuejs.org/guide/best-practices/performance.html`), «Reduce Reactivity Overhead for Large Immutable Structures» | Para estructuras grandes, `shallowRef()` o `shallowReactive()`; «updates can only be triggered by replacing the root state»                                                                                                                         |
| F2  | Misma guía, «Props Stability»                                                                                                       | Mantener las _props_ «as stable as possible»: pasar `:active="item.id === activeId"` en lugar de `:active-id="activeId"`, para que la mayoría de los hijos no se vuelvan a dibujar                                                                  |
| F3  | Misma guía, «v-memo»                                                                                                                | `v-memo` «can be used to conditionally skip the update of large sub-trees or `v-for` lists»                                                                                                                                                         |
| F4  | Misma guía, «Computed Stability» (Vue 3.4+)                                                                                         | Un `computed` solo dispara efectos si su valor cambió; si devuelve un objeto nuevo, comparar y devolver el anterior tras hacer el cálculo completo                                                                                                  |
| F5  | Misma guía, «Virtualize Large Lists» y «Avoid Unnecessary Component Abstractions»                                                   | Dibujar solo lo que está cerca de la pantalla, con una biblioteca; los componentes «are much more expensive than plain DOM nodes», sobre todo dentro de listas grandes                                                                              |
| F6  | Misma guía, «Code Splitting»                                                                                                        | `defineAsyncComponent(() => import(...))` para lo que no hace falta al cargar la página. Preferir dependencias ES _tree-shaking friendly_                                                                                                           |
| F7  | Nuxt 4.6.2, `composables/asyncData.d.ts:9-10, 38, 49-56, 92`                                                                        | El cargador de `useAsyncData` recibe un **`AbortSignal`**. `deep` es **`false` por defecto** («shallow ref object, which can improve performance»). `dedupe: 'cancel'` cancela la petición anterior de la misma clave. Además, `pick` y `transform` |
| F8  | Nuxt 4.6.2, `components/runtime/lazy-hydrated-component.d.ts`                                                                       | Hidratación perezosa: `hydrateOnVisible` y `hydrateOnIdle`                                                                                                                                                                                          |
| F9  | MDN, `PerformanceLongTaskTiming`                                                                                                    | «A long task is any uninterrupted period where the main UI thread is busy for 50ms or longer»: retrasa la respuesta a la entrada y hace saltos al desplazarse                                                                                       |
| C1  | Vue con Pinia y Testing, `Sección 9…/122. Instalación de Vue Router.md`, L29                                                        | Con muchas rutas, «podemos hacer carga perezosa de estos componentes». Nuxt ya divide por página                                                                                                                                                    |
| M1  | [Motor compartido, M2](../feature/worksheets/04-motor-de-calculo-compartido.md)                                                     | El motor de fórmulas calcula 5.000 filas en unos 44 ms (por debajo de los 50 ms de F9) y una fila en unos 0,009 ms                                                                                                                                  |
| E1  | `app/services/api-client.ts`                                                                                                        | El cliente **no reenvía ninguna señal de cancelación** a `$fetch`: las respuestas de una búsqueda ya obsoleta se descargan igual                                                                                                                    |

En la biblioteca de cursos no hay lecciones sobre `shallowRef`, `v-memo` ni virtualización en Vue (búsquedas «shallowRef», «v-memo», «defineAsyncComponent», «markRaw» y «lazy loading»). Lo único es la carga perezosa de rutas (C1).

## Prácticas que se aplicarán, y dónde

| Práctica                                                                                                            | Fuente                             | Dónde                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| **Cancelar peticiones obsoletas:** `ApiRequest.signal` reenviado a `$fetch`, con la señal de `useAsyncData`         | F7, E1                             | Búsqueda del visor y filtros de la hoja                  |
| **Datos grandes en `shallowRef`**; al editar se sustituye la fila, no se muta por dentro                            | F1, F7 (`deep: false` por defecto) | Filas de la hoja (hasta 5.000 × 200) y páginas del visor |
| **Props estables:** cada celda recibe `isActive` o `isSelected` booleanos, no el ID activo                          | F2                                 | Celdas y filas de la tabla                               |
| **`v-memo` por fila** con su versión y su estado (activa, seleccionada, con error)                                  | F3                                 | Filas de la hoja                                         |
| **Sin envoltorios dentro de cada celda**: celdas como HTML; el editor de Ark solo en la celda que se edita          | F5                                 | Tabla de la hoja y del visor                             |
| **Recalcular solo la fila editada** con el motor compartido; la hoja entera solo al abrirla o al cambiar el esquema | M1                                 | Vista previa de columnas calculadas                      |
| **Web Worker solo si se mide una tarea larga** (≥ 50 ms)                                                            | F9, M1                             | Hoy no hace falta: 44 ms la hoja entera                  |
| **Virtualizar solo si se mide** que dibujar las filas cargadas es lento                                             | F5; documento 16                   | Medición en E7.0 con 5.000 filas                         |
| **Cargar después lo que no se ve al principio:** ficha del producto, comparación, editor de columnas e importación  | F6, F8                             | `defineAsyncComponent` o componentes `Lazy…` de Nuxt     |
| **`computed` estables** que devuelvan el mismo objeto si nada cambió (selección y conteos)                          | F4                                 | Selección de la hoja                                     |

## TypeScript para el rendimiento (sin inventar)

TypeScript no cambia la velocidad en ejecución: lo que se ejecuta es JavaScript. Lo que sí aporta:

- **Tipos exactos** en lugar de comprobaciones repetidas en caliente: los predicados `isX` validan **una vez** al recibir de la API (como hace ya la web), y dentro del bucle se trabaja con datos ya tipados.
- **Estructuras adecuadas:** buscar por ID en un `Map` en lugar de recorrer un array en cada celda. El motor ya lo hace: `RowInputs` crea un `Map` de columnas en cada fila (`row-evaluation.ts:71-80`), y con eso calcula 5.000 filas en unos 44 ms (M1). En la web, los mapas que dependen solo del esquema (columnas por ID, orden y editores por tipo) se crean una vez por esquema.
- **Funciones puras** (motor y utilidades), que se pueden medir y probar aisladas, y llevar a un Worker sin cambios si algún día hiciera falta.

## Mapa necesidad → fuentes → decisión

| Necesidad                         | Fuentes        | Decisión (en los planes)                                                                    |
| --------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| No descargar respuestas obsoletas | F7, E1         | `signal` en `api-client` (bases del visor)                                                  |
| Hoja grande sin coste reactivo    | F1, F2, F3, F5 | `shallowRef`, props estables, `v-memo` y celdas HTML                                        |
| Cálculo inmediato                 | M1, F9         | Motor compartido, fila a fila; sin Worker mientras no se mida ≥ 50 ms                       |
| Carga inicial                     | F6, F8, C1     | Carga perezosa de paneles y asistentes                                                      |
| Comprobar que funciona            | F9, M1         | Mediciones en las bitácoras con `performance.now()` y el panel de rendimiento del navegador |

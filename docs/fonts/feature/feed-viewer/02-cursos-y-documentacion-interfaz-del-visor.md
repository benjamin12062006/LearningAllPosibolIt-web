# 02 — Cursos y documentación para la interfaz del visor (I3)

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: transcripciones locales (originales), paquete `@ark-ui/vue` 5.40.0 (solo lectura), Nuxt 4.6.2 instalado y documentación oficial (MDN).  
Relacionada con: [plan de investigación ui 02](../../../plans/ui/02-plan-investigacion-visor-y-hojas.md), [contrato del visor (01)](01-contrato-api-visor-y-diagnostico.md), [ficha ui 03](../../ui/03-ark-ui-tema-y-organizacion-por-funcion.md), [ficha rulesets 02 (paginación en la URL)](../rulesets&evaluations/02-curso-paginacion-maestro-detalle-y-modales.md), [22 — visor](../../../../../docs-diagrams/22-visor-y-diagnostico-del-feed.md).

## Necesidad

Cómo construir las vistas del documento 22 (tabla de productos, ficha lateral, «Requiere atención», comparar, probar reglas y entrega) con lo que ya enseña la biblioteca y con Ark UI, y qué cuidados hacen falta (imágenes externas, enlaces, carga de la página siguiente).

## Localización verificable

Biblioteca: `/Users/benji/Documents/chrome-extencions/trancripciones`. Búsquedas con `buscar-aprendizaje-en-cursos`: «tabla paginada servidor», «panel lateral drawer detalle», «debounce búsqueda input», «imagen fallback error carga», «comparar diferencias diff», «precargar peticiones», y búsquedas con `grep` dentro de `Nuxt/Nuxt Full Stack`. Se excluyen las guías `Reconstrucción guiada`. Líneas leídas con `nl -ba`.

| ID  | Lección                                                                                                                                              | Líneas y frase de búsqueda                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | Nuxt Full Stack, 70 y 71 (Sección 6), ya citadas en la [ficha rulesets 02](../rulesets&evaluations/02-curso-paginacion-maestro-detalle-y-modales.md) | Página en `route.query`; `router.push` con `...route.query`                                                                                                                                            |
| C2  | Nuxt Full Stack, `Sección 8…/95. Componentes dinámicos de Nuxt en TanStack Table.md`                                                                 | L17 «"UTable" es básicamente una forma de trabajar con "TanStack Table"»; L17 un `NuxtLink` permite «que empiece a hacer un "prefetch" de las siguientes rutas»; L19 `h()` para celdas con componentes |
| C3  | Vue 3 con TypeScript y Quasar, `Sección 10…/124. Precargar peticiones antes de tiempo.md`                                                            | L13 «adelantarnos a las posibles peticiones»; L19 empezar la petición «cuando el mouse entra a la tarjeta»                                                                                             |
| C4  | Misma sección, `125. Establecer un valor en caché manualmente.md`                                                                                    | L13 «tenemos toda la información de la siguiente página ya recargada»; L15 poner el dato en la caché para no repetir la petición HTTP                                                                  |
| C5  | Vue con Pinia y Testing, `Sección 16…/228. usePagination - Composable.md`                                                                            | L13 copiar la paginación en varios sitios pide extraerla; L17 un composable común «que no va amarrado» a una pantalla; L19 leer la página de la ruta y reaccionar cuando cambia                        |

No hay en la biblioteca una clase de Vue o Nuxt sobre **paneles laterales**, **imágenes que no cargan** ni **mostrar diferencias** antes/después. Esas partes son propuesta propia apoyada en la documentación (F).

## Documentación y paquetes (F)

| ID  | Fuente                                           | Qué se observa                                                                                                                                                                                                                          |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | `@ark-ui/vue` 5.40.0, tipos de `dialog`          | `modal`, `trapFocus`, `preventScroll`, `closeOnEscape`, `closeOnInteractOutside`, `restoreFocus`, `initialFocusEl` y `finalFocusEl`: un `Dialog` posicionado a la derecha sirve de panel lateral y devuelve el foco a la fila al cerrar |
| F2  | Tipos de `pagination`                            | `count`, `pageSize`, `siblingCount`, `type: 'link'` y **`getPageUrl`**: cada página puede ser un enlace real a `?pagina=N`                                                                                                              |
| F3  | Tipos de `accordion`                             | `multiple` y `collapsible`: varios grupos de «Requiere atención» abiertos a la vez                                                                                                                                                      |
| F4  | Tipos de `highlight`                             | `text`, `query`, `ignoreCase`, `matchAll`: marca lo buscado en el ID y el título                                                                                                                                                        |
| F5  | Tipos de `download-trigger`                      | `data` (o función que la devuelve), `fileName` y `mimeType`: entrega un blob ya descargado con token                                                                                                                                    |
| F6  | Tipos de `avatar`                                | `onStatusChange`: sabe si la imagen cargó o falló y muestra una alternativa (_fallback_)                                                                                                                                                |
| F7  | Nuxt 4.6.2, `composables/asyncData.d.ts:166-172` | `useNuxtData(key)`, `refreshNuxtData` y `clearNuxtData`: la caché de `useAsyncData` se puede leer y llenar por clave (equivalente de C4)                                                                                                |
| F8  | MDN, `<img>`                                     | `loading="lazy"` difiere la carga «until it reaches a calculated distance from the viewport»; `referrerpolicy="no-referrer"`: «The Referer header will not be sent»; el evento `error` salta si la imagen falla                         |

## Interpretación y adaptación

1. **Tabla del visor: HTML propio, no `UTable`.** C2 muestra que `UTable` es TanStack Table con el estilo de Nuxt UI. Pero H5 de la ficha ui 03 pide tabla HTML con controles de Ark, y aquí las columnas son dinámicas y la paginación es de Nest. Una `<table>` semántica con las columnas principales es más simple. TanStack Table se reserva para las hojas, donde sí aporta (ficha worksheets 02).
2. **Paginación como enlaces.** C1 y C5 enseñan la página en la URL y un composable común. Con F2 (`type: 'link'` + `getPageUrl`) cada página es un enlace: se puede abrir en otra pestaña y el «Atrás» del navegador funciona. Ya hay tres pantallas con página en la URL (informe, evaluaciones y el visor): conviene **un composable común `usePageInUrl`** (C5) en lugar de repetirlo.
3. **Búsqueda.** El texto va en la URL (`?buscar=`) y vuelve a la página 1. Para no pedir a Nest con cada tecla: enviar con Intro o tras una pausa corta (propuesta propia; la biblioteca solo tiene _debounce_ en React Native y Flutter, que no se usan aquí).
4. **Precargar la página siguiente** (C3, C4 y F7): al terminar una página con `hasMore`, pedir la siguiente y guardarla con `useNuxtData(clave).data.value = …`. Al pulsar «Siguiente» aparece sin espera. Es opcional y se mide primero: cada página lee el TSV en Nest.
5. **Ficha lateral.** Un `Dialog` de Ark a la derecha (F1) con el ID en la URL (`?producto=SKU`). Así la ficha se puede enlazar, al cerrar se vuelve a la misma búsqueda y página (lo pide el documento 22) y el foco vuelve a la fila.
6. **Imágenes externas** (`image_link` del TSV, de dominios del cliente): `loading="lazy"`, `referrerpolicy="no-referrer"` (no avisar a terceros de qué producto se mira) y una alternativa cuando fallen (F6 o el evento `error` de F8), solo con URL `http(s)`.
7. **Enlaces del TSV** (`link`, `mobile_link`): solo `http(s)`, con `target="_blank"` y `rel="noopener noreferrer"`. Los valores se muestran siempre como texto (interpolación de Vue, nunca `v-html`): vienen de catálogos de clientes y pueden traer HTML o _scripts_.
8. **Comparación y vista previa de reglas.** Tabla «campo · antes · después» por producto, con los recuentos arriba (`counts` y `changedFields`) y pestañas por tipo de cambio (`Tabs`). Es propuesta propia: no hay clase sobre diferencias.
9. **«Requiere atención».** `Accordion` con `multiple` (F3): cada grupo pide sus filas al abrirse, no antes, con el filtro `attribute`+`code` o `rule` del informe.
10. **Descargas.** `DownloadTrigger` (F5) con el blob que ya descarga el cliente con token (ficha ui 03, E6).

## Mapa necesidad → fuentes → decisión pendiente

| Necesidad                       | Fuentes         | Decisión pendiente                                                                  |
| ------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| Tabla de productos              | C2, H5 de ui 03 | `<table>` semántica con columnas principales y celdas con `Highlight`               |
| Paginación y búsqueda en la URL | C1, C5, F2      | `usePageInUrl` común; `Pagination` como enlaces; búsqueda con Intro o pausa corta   |
| Ficha                           | F1, 22          | `Dialog` lateral con `?producto=` en la URL                                         |
| Página siguiente al instante    | C3, C4, F7      | Precarga con `useNuxtData`, si la medición lo justifica                             |
| Imágenes y enlaces del TSV      | F6, F8          | Imagen _lazy_, sin referrer, con alternativa; enlaces solo `http(s)` con `noopener` |
| «Requiere atención»             | F3, contrato E5 | `Accordion` múltiple que carga cada grupo al abrirlo                                |
| Comparar y probar reglas        | Contrato E6–E7  | Tabla de diferencias con pestañas por tipo de cambio                                |

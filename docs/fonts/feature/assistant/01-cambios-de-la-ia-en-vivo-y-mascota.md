# 01 — Cambios de la IA en vivo y mascota del asistente

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: petición del usuario con imágenes de referencia, documentos de diseño, contrato del agente (E6.3b), normas W3C, documentación MDN y fichas ui 06 y ui 07.  
Relacionada con: [plan ui 04](../../../plans/ui/04-plan-sistema-visual-interaccion-y-mascota.md), [ficha ui 06](../../ui/06-maquetacion-sistema-visual-y-contraste.md), [ficha ui 07](../../ui/07-movimiento-e-interaccion.md), [15 — chat e IA](../../../../../docs-diagrams/15-chat-ia-herramientas-y-propuestas.md), [16 — tabla central y chat](../../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md), [plan del agente (servicio de IA)](../../../../../LearningAllPosibolIt-ai/docs/plans/feature/agente/01-plan-agente-con-llm-simulado.md).

## Petición del usuario (2026-11-14)

1. Cuando la IA haga cambios a través de nuestra API, **verlos en vivo en la interfaz**, y que la persona pueda manejarlos y seguirlos sin perderse.
2. Una **mascota**: un personaje pequeño, como el de sus dos imágenes de referencia (un robot de píxeles en forma de nube azul, con una pantalla por cara y un `>_` en el pecho, colocado sobre la caja de «Iniciar nuevo chat»), que se mueva **como si estuviera creando los cambios**, por ejemplo como el cursor de la IA. No tiene que ser igual; es una idea.
3. Animaciones a la altura de los estándares, que «no sean una burla», planificadas antes de construir.

**Nota de originalidad:** el personaje de la referencia parece la mascota de otro producto. Se diseñará **un personaje propio**, con la misma idea (pixel art, cara de pantalla y aire de terminal), pero con otra silueta, nuestros colores y nuestro nombre. Así se evita copiar una marca ajena.

## Lo que ya está decidido en el diseño (H)

| ID  | Fuente                                                    | Requisito                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | 15, «Streaming, reconexión y cancelación»                 | Eventos de una ejecución: `run.started`, `status`, `tool.started`, `tool.completed`, `text.delta`, `proposal.ready`, `run.completed`, `run.failed` y `run.cancelled`. Se exponen «resúmenes de actividad, no razonamiento interno»                 |
| H2  | 15, «Datos de conversación y ejecución» (`ai_tool_calls`) | Cada llamada guarda la herramienta, los argumentos validados y el **resumen o los IDs del resultado**: el evento puede decir qué tocó                                                                                                              |
| H3  | 15 y plan E6, D13                                         | La IA **no aplica nada**: las escrituras terminan pidiendo confirmación y los cambios de datos son propuestas (borradores) que aprueba una persona                                                                                                 |
| H4  | 16, «Pantalla principal»                                  | La tabla es el espacio principal. El chat no obliga a cambiar de página: se pliega y se redimensiona. En pantallas estrechas se alternan tabla y chat conservando la selección. Cada propuesta enlaza a sus filas y celdas, con un _diff_ paginado |
| H5  | Contrato E6.3b (servicio de IA)                           | Resultados de una ejecución: `answered`, `confirmation_required`, `needs_clarification` y `limit_reached`                                                                                                                                          |

## Normas y documentación (F)

| ID  | Fuente                                                          | Qué dice                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1  | WCAG 2.2, 4.1.3 (AA)                                            | Los mensajes de estado se anuncian por rol o propiedades, **sin mover el foco**                                                                                                                                                            |
| F2  | MDN, _ARIA live regions_                                        | `polite` para casi todo («Normally, only `aria-live="polite"` is used»); `assertive` solo para lo crítico, porque interrumpe. La región debe existir **antes** de cambiar su contenido; `role="status"` y `role="log"` (este para un chat) |
| F3  | WCAG 2.2, 2.2.2 (A) y 2.3.3 (AAA); MDN `prefers-reduced-motion` | Lo que se mueve solo más de 5 s se puede pausar u ocultar; el movimiento se puede desactivar; respetar la preferencia del sistema                                                                                                          |
| F4  | WCAG 2.2, 1.4.1 (A)                                             | El color no puede ser el único medio de transmitir información                                                                                                                                                                             |
| F5  | WCAG 2.2, 2.4.11 (AA)                                           | El elemento con el foco no puede quedar tapado del todo por contenido del autor                                                                                                                                                            |
| F6  | MDN, `image-rendering`                                          | `crisp-edges`, pensado «for images such as pixel art», sin difuminar; `pixelated` escala a múltiplos enteros                                                                                                                               |
| F7  | MDN, SVG `shape-rendering="crispEdges"`                         | Prioriza los bordes limpios del dibujo                                                                                                                                                                                                     |
| F8  | Ficha ui 07: F3, F9 y F10                                       | Animar solo `transform` y `opacity`; Web Animations API nativa; parar con la pestaña oculta                                                                                                                                                |

## Opciones para dibujar y animar la mascota

| Opción                               | Cómo                                                                                                                                                | Valoración                                                                                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. SVG de píxeles en el código**   | Cada fotograma es una rejilla (por ejemplo 24×24) de cuadrados con `shape-rendering="crispEdges"` (F7); los colores salen de variables CSS del tema | **Recomendada.** Nítida a cualquier escala entera, se adapta al modo claro y oscuro, pesa unos pocos KB, sin dependencias ni herramientas externas, y se prueba como cualquier componente |
| B. Hoja de _sprites_ PNG + `steps()` | Fotogramas en una imagen, con `image-rendering: crisp-edges` (F6)                                                                                   | Flujo clásico de pixel art (con un editor como Aseprite), pero los colores quedan fijos y no siguen el tema                                                                               |
| C. Rive (`@rive-app/canvas-lite`)    | Máquina de estados diseñada en su editor                                                                                                            | Muy expresiva, pero carga un motor WASM y exige su editor; no es pixel art nativo                                                                                                         |
| D. Lottie (`dotlottie-web`)          | Animación vectorial exportada de After Effects                                                                                                      | Vectorial (no pixel art), con motor WASM                                                                                                                                                  |

## Interpretación

1. **Qué se ve en vivo:** lo que la IA **lee** (zona leída, de forma discreta) y lo que **propone** (celdas o filas del borrador marcadas con el color de la IA, con icono y etiqueta, no solo color: F4). Lo aplicado solo llega cuando una persona aprueba (H3). La interfaz nunca presenta una propuesta como dato oficial.
2. **La mascota es el «cursor» de la IA:** viaja con `transform` (F8) hasta la zona que toca el evento (H2) y allí cambia de postura (leyendo, escribiendo). Es **decorativa** (`aria-hidden`); la información va en texto y en una región viva `polite` (F1, F2): por ejemplo, «El asistente propuso 12 cambios en Precio».
3. **Nunca estorba:** no recibe clics (`pointer-events: none`), no tapa la celda con el foco (F5), no mueve el foco ni el desplazamiento de la persona; si la zona está fuera de la vista, se queda en el borde con una flecha y un botón «Ir allí».
4. **Pausable y respetuosa** (F3): con menos movimiento no viaja (cambia de postura en su sitio); hay un ajuste para pararla u ocultarla, y se detiene con la pestaña oculta.
5. **Hace falta un dato del contrato de E6.4:** cada evento `tool.started` o `tool.completed` debe traer una **pista del objetivo** (`target`: tipo e IDs, por ejemplo la hoja, las filas y las columnas), sacada por Nest de los argumentos ya validados (H2), nunca del texto del modelo. Sin eso, la mascota no sabe adónde ir.
6. **Opción A** para dibujarla: encaja con el tema, el rendimiento (ficha ui 05) y las pruebas.

## Mapa necesidad → fuentes → decisión (plan ui 04)

| Necesidad               | Fuentes             | Decisión                                                                 |
| ----------------------- | ------------------- | ------------------------------------------------------------------------ |
| Ver los cambios en vivo | H1–H4               | Marcas de lectura y de propuesta con el color de la IA, icono y etiqueta |
| Accesible               | F1, F2, F4          | Región viva `polite`; mascota decorativa                                 |
| No estorbar             | F3, F5; ficha ui 07 | Sin clics, sin tapar el foco, pausable y quieta con menos movimiento     |
| Saber adónde ir         | H2                  | `target` en los eventos de E6.4 (pedido al contrato)                     |
| Dibujo                  | F6, F7; opciones    | SVG de píxeles propio con colores del tema                               |
| Originalidad            | Nota                | Personaje propio inspirado, no copiado                                   |

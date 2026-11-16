# 06 — Maquetación, sistema visual y contraste

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: código de la web, transcripciones locales (originales), normas W3C, artículos de referencia (NN/g), paquetes instalados y medición propia.  
Relacionada con: [plan ui 04 (sistema visual, interacción y mascota)](../../plans/ui/04-plan-sistema-visual-interaccion-y-mascota.md), [ficha ui 07 (movimiento)](07-movimiento-e-interaccion.md), [ficha assistant 01 (IA en vivo y mascota)](../feature/assistant/01-cambios-de-la-ia-en-vivo-y-mascota.md), [bitácora ui 01 (tema Focus)](../../../bitacora-construccion/ui/01-nuxt-ui-y-tema-focus.md), [16 — tabla central y chat](../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md).

## Necesidad (petición del usuario, 2026-11-14)

Planificar **antes de construir** cómo se ve y cómo se siente la web: dónde va cada cosa y por qué, en el móvil y sobre todo en el ordenador; colores del modo claro y del oscuro; organización visual, sencillez y facilidad de manejo, tanto para la persona como para lo que hace la IA. «No construimos unas APIs gigantes para que se vea mal.»

## Estado actual (E)

| ID  | Dónde                                                           | Qué se observa                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `docs/fonts/assets/focus-macos-referencia.png` y bitácora ui 01 | La identidad es la de **Focus para macOS**: lateral gris violáceo con tarjetas resumen y listas con contador, cabecera ilustrada con bandas de color, título grande y fino, y contenido en filas con separadores tenues                  |
| E2  | `nuxt.config.ts:12`                                             | **Modo oscuro por defecto** (`colorMode: { preference: 'dark', fallback: 'dark' }`); el claro es una variante propia (`main.css`)                                                                                                        |
| E3  | `app/assets/css/main.css` y `app.config.ts`                     | Tokens `--ui-*` medidos sobre la referencia; primario `violet` y neutro `zinc`. Nuxt UI usa **violet-500 en claro y violet-400 en oscuro** (`runtime/plugins/colors.js:31-35`), con texto blanco o zinc-900 encima (`runtime/index.css`) |
| E4  | `app/layouts/workspace.vue` y `components/WorkspacePage.vue`    | Un único diseño de página: lateral de la app (17 rem; plegable y redimensionable entre 15 y 22) y, en cada vista, portada ilustrada (144–176 px), título grande y contenido centrado con **`max-w-4xl` (56 rem)**                        |
| E5  | `components/ProjectNav.vue`                                     | Secciones del proyecto: Catálogo, Reglas, Evaluaciones y Feed. Aún no están Hojas ni Productos (el visor)                                                                                                                                |
| E6  | `app/app.vue`                                                   | `NuxtRouteAnnouncer` ya anuncia los cambios de página a los lectores de pantalla                                                                                                                                                         |
| E7  | Tailwind 4, `theme.css:327-331`                                 | Puntos de corte: `sm` 40 rem (640 px), `md` 48 rem (768), `lg` 64 rem (1024), `xl` 80 rem (1280) y `2xl` 96 rem (1536)                                                                                                                   |

### Medición de contraste del tema actual (2026-11-14)

Script en la carpeta temporal: OKLCH → sRGB según la definición de OKLab y luminancia relativa de WCAG. Pares reales del tema:

| Modo   | Par                                            | Contraste       | Mínimo WCAG | Resultado     |
| ------ | ---------------------------------------------- | --------------- | ----------- | ------------- |
| Claro  | Texto / fondo                                  | 14,40:1         | 4,5:1       | Cumple        |
| Claro  | Texto apagado (`muted`) / fondo · / lateral    | 5,33 · 4,78     | 4,5:1       | Cumple        |
| Claro  | Texto tenue (`dimmed`) / fondo · / lateral     | 3,48 · 3,12     | 4,5:1       | **No cumple** |
| Claro  | Violeta-500 como texto / fondo                 | 4,17            | 4,5:1       | **No cumple** |
| Claro  | Blanco sobre botón violeta-500                 | 4,40            | 4,5:1       | **No cumple** |
| Claro  | Borde de controles (`border-accented`) / fondo | 1,57            | 3:1         | **No cumple** |
| Oscuro | Texto / fondo                                  | 11,51           | 4,5:1       | Cumple        |
| Oscuro | Texto apagado / fondo · / lateral              | 4,11 · **2,90** | 4,5:1       | **No cumple** |
| Oscuro | Texto tenue / fondo · / lateral                | 2,72 · 1,92     | 4,5:1       | **No cumple** |
| Oscuro | Violeta-400 como texto / fondo                 | 4,59            | 4,5:1       | Cumple        |
| Oscuro | Zinc-900 sobre botón violeta-400               | 6,22            | 4,5:1       | Cumple        |
| Oscuro | Borde de controles / fondo                     | 1,67            | 3:1         | **No cumple** |

**Correcciones calculadas**, con el mismo tono y croma y solo cambiando la luminosidad OKLCH hasta el mínimo, con margen:

| Token                                         | Modo    | Actual               | Propuesto                | Contraste resultante                   |
| --------------------------------------------- | ------- | -------------------- | ------------------------ | -------------------------------------- |
| `--ui-text-muted`                             | Oscuro  | `#978d9b`            | `#bfb4c3`                | Fondo 6,58 · lateral 4,63              |
| `--ui-text-muted`                             | Claro   | `#6e6472`            | se queda                 | Fondo 5,33 · lateral 4,78              |
| `--ui-primary`                                | Claro   | violet-500 `#8e51ff` | **violet-600** `#7f22fe` | Como texto 5,57 · blanco encima 5,88   |
| `--ui-primary`                                | Oscuro  | violet-400 `#a684ff` | se queda                 | Como texto 4,59 · zinc-900 encima 6,22 |
| `--ui-border-accented` (bordes de controles)  | Claro   | `#cfc6d3`            | `#938b97`                | 3,12                                   |
| `--ui-border-accented` (bordes de controles)  | Oscuro  | `#574f5d`            | `#817988`                | 3,13                                   |
| Texto sobre fila seleccionada (`bg-elevated`) | Los dos | `muted`              | **texto normal**         | Claro 11,62 · oscuro 6,17              |

**Color propio de la IA** (azul, como la mascota de la referencia del usuario), medido para contornos (3:1) y texto (4,5:1): en claro, sky-700 `#0069a8` (fondo 5,54 · lateral 4,97) y sky-600 `#0084d1` solo para contornos (3,80); en oscuro, sky-400 `#00bcff` (fondo 5,99 · fila seleccionada 3,22).

## Cursos (C)

Biblioteca local; líneas leídas con `nl -ba`. Las transcripciones de «CSS Completo» están **en alemán**: se citan con su línea y se resumen (paráfrasis marcada).

| ID  | Lección                                                                                                       | Qué aporta                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | `CSS/CSS Completo/Sección 10…/148. Designing Websites Mobile First.md`, L13–L15                               | (Paráfrasis) Lo actual es empezar por la versión móvil y después asegurar que el diseño escala al escritorio                             |
| C2  | Misma sección, `151. Finding the Right Breaking Points.md`, L13–L15                                           | (Paráfrasis) Los puntos de corte se eligen mirando los anchos CSS de los dispositivos más comunes, no al azar                            |
| C3  | `CSS/CSS Completo/Sección 14…/225. Adding Named Template Areas.md`, L13–L15                                   | (Paráfrasis) Las áreas con nombre (`grid-template-areas`) colocan bloques enteros sin dar líneas a cada elemento                         |
| C4  | Misma sección, `238. Comparing Grid & Flexbox.md`, L13–L15                                                    | (Paráfrasis) Grid para posicionar en dos dimensiones; Flexbox para una sola fila o columna de elementos                                  |
| C5  | `CSS/Aprende CSS3…/Sección 17 Responsive Design/220. Media query scheme para aplicar modo oscuro.md`, L15–L17 | Con `prefers-color-scheme` la página «se adapte al tema que tengo yo en mi dispositivo»                                                  |
| C6  | `Flutter/Flutter UI y Animaciones/Sección 11…/148. Diseño de dos columnas - Tablet.md`, L13                   | En tabletas, «diseño de dos columnas»: a un lado el menú u opciones y al otro lo seleccionado; la idea sirve para tres o cuatro columnas |
| C7  | Misma sección, `147. Layout tableta y teléfono.md`, L17                                                       | Decidir el diseño «en base a resoluciones de píxeles en pantalla», no por tipo de aparato                                                |

## Normas y referencias (F)

| ID  | Fuente                                         | Qué dice                                                                                                                         |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| F1  | W3C, WCAG 2.2, 1.4.3 (AA)                      | Texto con contraste de al menos **4,5:1** (3:1 el texto grande)                                                                  |
| F2  | WCAG 2.2, 1.4.11 (AA)                          | Componentes de interfaz y gráficos: al menos **3:1** frente a los colores adyacentes                                             |
| F3  | WCAG 2.2, 1.4.10 (AA)                          | Contenido usable a **320 px** de ancho sin desplazamiento horizontal (salvo tablas y contenido que lo necesite)                  |
| F4  | WCAG 2.2, 2.5.8 (AA) y 2.5.5 (AAA)             | Objetivos táctiles de al menos **24×24 px** (AA) y **44×44 px** (AAA)                                                            |
| F5  | WCAG 2.2, 2.4.7 (AA) y 2.4.11 (AA)             | Foco del teclado visible y no tapado por completo por contenido del autor                                                        |
| F6  | NN/g, _Response Times: The 3 Important Limits_ | **0,1 s** se siente instantáneo; **1 s** mantiene el hilo del pensamiento; a partir de **10 s** hay que indicar cuándo terminará |
| F7  | Nuxt UI 4.12, `runtime/index.css`              | Tokens semánticos (`--ui-text-*`, `--ui-bg-*`, `--ui-border-*`) que el tema puede reasignar en `main.css`                        |

## Interpretación

1. **El tema actual tiene fallos de contraste reales** y medidos. La identidad Focus se conserva ajustando solo la luminosidad: el tono no cambia.
2. **Regla de uso de los textos:** `muted` para toda información secundaria (cumple sobre fondo y lateral); `dimmed` solo para lo desactivado o decorativo, que WCAG exime; sobre una fila seleccionada, texto normal.
3. **Dos plantillas de página, no una.** La actual (portada, título grande y 56 rem centrados) va bien para listas, formularios y ajustes. Para el visor y las hojas hace falta todo el ancho, con cabecera compacta, porque la tabla es el trabajo (documento 16). C3 y C4 llevan a Grid con áreas con nombre para el armazón, y Flexbox dentro de cada barra.
4. **Móvil primero, con cortes de Tailwind** (C1, C2, C7 y E7): una columna por debajo de 640 px; dos columnas desde 768 (C6); el diseño completo de tres zonas (lista, tabla y chat) desde 1024 y con holgura desde 1280.
5. **El color de la IA es distinto del de la persona:** violeta para lo propio (selección y acciones) y azul para lo que hace la IA. Nunca solo color: además, icono o etiqueta (WCAG 1.4.1).
6. **Modo por defecto: decisión del usuario.** Hoy es oscuro (E2). El usuario habló del blanco como modo por defecto. C5 enseña a seguir el sistema (`prefers-color-scheme`), algo que Nuxt admite con `preference: 'system'`. Se deja como decisión explícita en el plan.

## Mapa necesidad → fuentes → decisión (plan ui 04)

| Necesidad            | Fuentes                | Decisión                                                            |
| -------------------- | ---------------------- | ------------------------------------------------------------------- |
| Contraste            | F1, F2, medición       | Tokens corregidos y prueba automática de contraste                  |
| Jerarquía de texto   | F1, medición           | Regla `muted` / `dimmed` / texto normal en selección                |
| Plantillas de página | E4, C3, C4; 16         | «Documento» y «Espacio de datos»                                    |
| Adaptación           | C1, C2, C6, C7, E7, F3 | Cortes 640 / 768 / 1024 / 1280 con comportamiento definido por zona |
| Tacto                | F4                     | 44×44 en móvil y 24×24 como mínimo absoluto en escritorio           |
| Color de la IA       | Medición, 1.4.1        | Azul sky con valores medidos; siempre con icono o etiqueta          |
| Modo por defecto     | E2, C5                 | Pregunta al usuario: claro, oscuro o el del sistema                 |

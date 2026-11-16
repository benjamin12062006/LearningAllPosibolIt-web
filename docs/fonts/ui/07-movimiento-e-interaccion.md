# 07 — Movimiento y sensación de uso (interacción)

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: transcripciones locales (originales), documentación oficial (Vue, MDN, W3C), artículos de referencia (NN/g, web.dev), Nuxt 4.6.2 instalado y registro de npm.  
Relacionada con: [plan ui 04](../../plans/ui/04-plan-sistema-visual-interaccion-y-mascota.md), [ficha ui 06 (maquetación)](06-maquetacion-sistema-visual-y-contraste.md), [ficha ui 05 (rendimiento)](05-rendimiento-vue-nuxt-y-typescript.md), [ficha assistant 01](../feature/assistant/01-cambios-de-la-ia-en-vivo-y-mascota.md).

## Necesidad

Que **apretar un botón, moverse por la página y ver un cambio se sienta bien**: rápido, claro y estable, con animaciones que acompañen y no estorben, que respeten a quien pide menos movimiento y que no cuesten rendimiento.

## Cursos (C)

| ID  | Lección                                                                                         | Qué aporta                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | `CSS/CSS Completo/Sección 16…/255. Understanding and Applying Transitions.md`, L13–L17 (alemán) | (Paráfrasis) Una transición es una animación integrada que vigila una propiedad, como la opacidad o la posición; ejemplo: un modal que entra desde `translateY(-3rem)` con opacidad 0 |
| C2  | Misma sección, `257. Working with Timing Functions.md`, L13–L17                                 | (Paráfrasis) La función de tiempo decide cómo avanza de 0 % a 100 %; con `cubic-bezier` de cuatro parámetros se crea una propia                                                       |
| C3  | Misma sección, `258. Transitions & display.md`, L13–L15                                         | (Paráfrasis) `display` no se anima; se anima la opacidad, del orden de 200 ms                                                                                                         |
| C4  | Misma sección, `263. Using JavaScript Animation Event Listeners.md`, L13–L15                    | (Paráfrasis) JavaScript puede escuchar el inicio, la repetición y el final de una animación para encadenar acciones                                                                   |
| C5  | `Flutter/Flutter UI y Animaciones/Sección 3…/33. Curves.md`, L15                                | Las curvas permiten que una animación no vaya siempre a la misma velocidad: «empieza un poquito más lento… y al final se aceleran»                                                    |
| C6  | `Vue con Pinia y Testing/Sección 9…/122. Instalación de Vue Router.md`, L29                     | Carga perezosa de rutas (Nuxt ya la hace por página)                                                                                                                                  |

## Normas y documentación (F)

| ID  | Fuente                                                               | Qué dice                                                                                                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | NN/g, _Executing UX Animations: Duration and Motion Characteristics_ | La mayoría de animaciones, **100–500 ms**; respuesta simple (casilla, interruptor) **≈100 ms**; cambios grandes (un modal) **200–300 ms**; cuanto más frecuente, más corta y sutil; lo que entra, algo más largo que lo que sale; **ease-out para entrar**; ease-in solo para salir, porque arrancar despacio «can feel unresponsive» |
| F2  | NN/g, _Response Times: The 3 Important Limits_                       | 0,1 s instantáneo; 1 s mantiene el hilo; 10 s, indicar cuánto falta                                                                                                                                                                                                                                                                   |
| F3  | web.dev, _Animations guide_                                          | Animar **solo `transform` y `opacity`** siempre que se pueda; evitar lo que provoque _layout_ o _paint_; `will-change` solo si hay un problema medido                                                                                                                                                                                 |
| F4  | MDN, `prefers-reduced-motion`                                        | Detecta que la persona pidió minimizar el movimiento no esencial; escalar o desplazar objetos grandes puede provocar molestias vestibulares                                                                                                                                                                                           |
| F5  | WCAG 2.2, 2.2.2 (A)                                                  | Lo que se mueve solo, dura más de **5 s** y convive con otro contenido debe poder **pausarse, pararse u ocultarse**                                                                                                                                                                                                                   |
| F6  | WCAG 2.2, 2.3.3 (AAA)                                                | El movimiento provocado por la interacción **se puede desactivar**                                                                                                                                                                                                                                                                    |
| F7  | Vue, `<TransitionGroup>`                                             | Anima la entrada, la salida y el cambio de orden de una lista; la clase `move` hace que los demás elementos se desplacen suavemente en lugar de «saltar»; escalonar con `data-index`                                                                                                                                                  |
| F8  | Nuxt 4.6.2, `app/plugins/view-transitions.client.js:7, 24-34`        | Transiciones entre páginas con la View Transitions API (`experimental.viewTransition`), **desactivadas solas si se pide menos movimiento**, salvo con `'always'`                                                                                                                                                                      |
| F9  | MDN, `Element.animate()`                                             | Crea una `Animation` (Web Animations API) y la reproduce; nativa, sin bibliotecas                                                                                                                                                                                                                                                     |
| F10 | MDN, Page Visibility API                                             | Saber cuándo la pestaña está oculta para no gastar en tareas innecesarias; los navegadores ya frenan `requestAnimationFrame` en segundo plano                                                                                                                                                                                         |
| F11 | npm (2026-11-14)                                                     | `motion-v` 2.12.0 (MIT, 2026-11-10, necesita `@vueuse/core`); `@vueuse/motion` 3.0.3 (marzo de 2025); `gsap` 3.15.1 (licencia propia «no charge», no MIT); `@rive-app/canvas-lite` 2.50.0 (MIT, motor WASM); `@lottiefiles/dotlottie-web` 0.83.2 (MIT, WASM)                                                                          |

## Interpretación

1. **La sensación de «apretar»** se consigue con un cambio inmediato (≤100 ms, F1 y F2) del propio control: color de presión y un leve hundimiento con `transform`, nunca con cambios de tamaño que muevan lo de alrededor (F3).
2. **Duraciones fijas por tipo**, no a ojo (F1): respuesta de control 100 ms; aparecer o desaparecer algo pequeño 150 ms; paneles y diálogos 200–250 ms; movimientos largos por la pantalla (la mascota) hasta 500 ms. Entrar con _ease-out_ y salir con _ease-in_, más corto (F1, C5, C2).
3. **Menos movimiento de verdad** (F4, F6 y F8): con `prefers-reduced-motion` desaparecen los desplazamientos y escalados; quedan cambios de color y opacidad. Además, un ajuste propio en la app para quien no lo tiene configurado en el sistema (F6).
4. **Animar solo `transform` y `opacity`** (F3); `will-change` solo tras medir. Ninguna animación bloquea la interacción ni retrasa los datos: los datos se muestran ya y la animación los acompaña.
5. **Listas que cambian** (filas nuevas, cambios de la IA): `<TransitionGroup>` con `move` (F7) para que nada «salte»; escalonado corto y con tope total para no hacer esperar.
6. **Transiciones entre páginas** con la API nativa a través de Nuxt (F8): ya respetan la preferencia de menos movimiento.
7. **Sin bibliotecas por defecto:** CSS, `<Transition>` de Vue y la Web Animations API (F9) cubren todo lo previsto. `motion-v` (F11) solo si una medición demuestra que hacen falta muelles o gestos; GSAP no, por su licencia; Rive y Lottie no, porque cargan un motor WASM y piden herramientas de diseño aparte.
8. **Animaciones continuas** (por ejemplo, la mascota esperando): pausables (F5), quietas con la pestaña oculta (F10) y discretas.

## Mapa necesidad → fuentes → decisión (plan ui 04)

| Necesidad                    | Fuentes              | Decisión                                              |
| ---------------------------- | -------------------- | ----------------------------------------------------- |
| Sensación al pulsar          | F1–F3                | Estados de presión de ≤100 ms con `transform` y color |
| Coherencia                   | F1, C2, C5           | Tokens de duración y de curva                         |
| Accesibilidad del movimiento | F4–F6, F8            | `prefers-reduced-motion` y ajuste propio de la app    |
| Rendimiento                  | F3, F10; ficha ui 05 | Solo `transform` y `opacity`; pausa en pestaña oculta |
| Listas vivas                 | F7                   | `<TransitionGroup>` con `move` y escalonado con tope  |
| Páginas                      | F8, C6               | `experimental.viewTransition`                         |
| Herramientas                 | F9, F11              | Nativo; `motion-v` solo si se mide la necesidad       |

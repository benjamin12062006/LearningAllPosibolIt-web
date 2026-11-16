# 09 — Organización de Nuxt y Vue por funcionalidad

Fecha de creación: 2026-11-15  
Fecha de consulta: 2026-11-15  
Relacionada con: [plan 06](../../plans/ui/06-plan-organizar-la-web-por-funcionalidad.md), [autoimportaciones de partida](03-ark-ui-tema-y-organizacion-por-funcion.md) y [cierre funcional](../../plans/ui/05-plan-cierre-de-la-ui.md).

## Cursos y documentación

| ID | Fuente y localizador | Qué respalda |
| --- | --- | --- |
| F1 | Nuxt Full Stack, [Sección 3, lección 22, Estructura de directorios](</Users/benji/Documents/chrome-extencions/trancripciones/Nuxt/Nuxt Full Stack/Sección 3 Nuxt - Primeros pasos/22. Estructura de directorios.md>), líneas 33–43 | Nuxt reconoce directorios por convención y permite crear directorios propios. |
| F2 | Nuxt Full Stack, [Sección 3, lección 30, Organización de la carpeta pages](</Users/benji/Documents/chrome-extencions/trancripciones/Nuxt/Nuxt Full Stack/Sección 3 Nuxt - Primeros pasos/30. Organización de la carpeta pages.md>), líneas 13–29. [R1, fases 1–2](</Users/benji/Documents/chrome-extencions/trancripciones/Nuxt/Nuxt Full Stack/Sección 3 Nuxt - Primeros pasos/30. Organización de la carpeta pages - Reconstrucción guiada.md>) | El árbol de `pages` es el contrato de rutas. Un directorio normal cambia la URL, y un grupo entre paréntesis se omite. Una página padre puede compartir un layout y montar a sus hijas con `NuxtPage`. |
| F3 | Vue con Pinia y Testing, [Sección 9, lección 121, Preparación de la estructura y archivos](</Users/benji/Documents/chrome-extencions/trancripciones/Vue/Vue con Pinia y Testing/Sección 9 Vue Router - SPA - Single Page Applications/121. Preparación de la estructura y archivos.md>), líneas 15–23. [R2, `src/App.vue` y `src/modules/landing/pages`](</Users/benji/Documents/chrome-extencions/trancripciones/Vue/Vue con Pinia y Testing/Sección 9 Vue Router - SPA - Single Page Applications/121. Preparación de la estructura y archivos - Reconstrucción guiada.md>) | Las pantallas se agrupan por la funcionalidad Landing. El punto de entrada las importa y el router mantiene las decisiones de navegación. |
| F4 | Nuxt 4, [Pages](https://nuxt.com/docs/4.x/directory-structure/app/pages), [Components](https://nuxt.com/docs/4.x/directory-structure/app/components) y [Composables](https://nuxt.com/docs/4.x/directory-structure/app/composables) | Las rutas usan archivos y una sola raíz para las transiciones. Los componentes pueden registrarse en directorios adicionales con prefijos. El escaneo de composables anidados se configura explícitamente. |
| F5 | Vue 3, [Single-File Components](https://vuejs.org/guide/scaling-up/sfc.html) y [Extracting composables for code organization](https://vuejs.org/guide/reusability/composables.html#extracting-composables-for-code-organization) | Un componente reúne su plantilla y sus detalles de presentación. Un composable extrae lógica con estado que comparte una responsabilidad. |
| F6 | Nuxt 4, [Nuxt and hydration](https://nuxt.com/docs/4.x/guide/best-practices/hydration) | El primer render del navegador debe coincidir con el servidor. Las preferencias exclusivas del navegador se leen después de montar o se transportan de forma compatible con SSR. |

Las dos guías son reconstrucciones derivadas. El script comprobó originales y huellas. La sintaxis perdida por la transcripción se identifica como ensamblada en cada guía.

## Adaptación a KTSU

- **Rutas estables** (F2, R1, F4). Mantener `app/pages` como entrada de Nuxt, con los mismos archivos y parámetros. Las rutas largas pueden importar vistas desde su funcionalidad. El usuario puede seguir enlaces de borrador, revisión y propuesta emitidos antes de este cambio.
- **Una carpeta por responsabilidad del producto** (F1, F3, R2). Cada módulo de `app/features` coloca cerca su presentación, composables, servicios, contratos y utilidades. Se crean solo los directorios que se usan.
- **Registro legible** (F4). Mantener la autoimportación de componentes y composables que ya usa el proyecto. Conservar el prefijo visible de componentes existentes, incluido el prefijo `Lazy` que Nuxt genera. Los flujos de cada funcionalidad tienen imports explícitos de sus composables, servicios y tipos para poder seguir sus dependencias desde el archivo que los usa.
- **Fronteras proporcionales** (F5). Los componentes llaman composables para los flujos con estado. El transporte HTTP y los controles visuales genéricos quedan compartidos. La aplicación conserva los adaptadores REST y la validación de Nest. Añadir interfaces y repositorios duplicaría contratos ya verificables en estos módulos.
- **Caso de hojas**. Separar en subdirectorios de presentación los libros, la tabla, los borradores y las transferencias. El punto de entrada de la hoja coordina esas piezas. Su formato de valores y el motor de cálculo siguen la bitácora del editor.

# 01 — Nuxt UI, tema Focus y espacio de trabajo

Fecha de creación: 2026-11-03
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 1 del [plan ui 01](../../docs/plans/ui/01-plan-nuxt-ui-focus-proyectos-e-importaciones.md)
Relacionada con: [curso](../../docs/fonts/ui/01-curso-nuxt-full-stack-nuxt-ui.md), [Nuxt UI y antecedentes](../../docs/fonts/ui/02-documentacion-nuxt-ui-y-antecedentes.md), [bitácora original](../01-acceso-y-cuenta-nuxt.md)
Revisión de partida: `57752dc` (copia exacta de `estadistica-forms-web` en `60e3f59`)

## Necesidad y punto de partida

El usuario pidió clonar `estadistica-forms-web` como se hizo con la API (`LearningAllPosibolIt`), con Git propio, y rehacer su diseño con Nuxt UI siguiendo la captura Focus. La copia usaba Tailwind con tokens propios (verde, Roboto) y componentes dibujados a mano.

## Evidencia y decisiones

| Decisión                                      | Evidencia                                           | Aplicación                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Módulo `@nuxt/ui` y `UApp` envolviendo la app | F1 L21, L25–29; D2                                  | [nuxt.config.ts](../../nuxt.config.ts) `modules`; [app.vue](../../app/app.vue). Se quitan `@tailwindcss/vite` (el módulo lo registra) y `@fontsource/roboto`                                                                                                                    |
| Tema con `app.config` + variables de Nuxt UI  | F3 L15–25; D2, D3                                   | [app.config.ts](../../app/app.config.ts) `primary: violet`, `neutral: zinc` (los mismos nombres de la clase; `zinc` coincide); [main.css](../../app/assets/css/main.css) `--ui-*` en `:root` y `.dark` con los valores medidos por Copilot (D4)                                 |
| Panel con grupo, lateral y panel              | F4 L17–31; D1                                       | [layouts/workspace.vue](../../app/layouts/workspace.vue): `UDashboardGroup` con `storage="local"` y `storage-key` como en la clase; `UDashboardSidebar` plegable y redimensionable. Cada página usa [WorkspacePage](../../app/components/WorkspacePage.vue) (`UDashboardPanel`) |
| Estética Focus                                | D3, D4                                              | [FocusCover](../../app/components/FocusCover.vue) (SVG propio de Copilot, sin la imagen original), tarjetas [SidebarSummary](../../app/components/SidebarSummary.vue), utilidades `focus-title`, `focus-section-label`, `focus-row`                                             |
| Error con `UError`                            | F2 L23                                              | [error.vue](../../app/error.vue), dentro de `UApp` porque `error.vue` no pasa por `app.vue`                                                                                                                                                                                     |
| Rutas del espacio de trabajo                  | Código original + D4 (`access-route.ts` de Copilot) | [access-route.ts](../../app/features/access/utils/access-route.ts): con sesión se entra a `/projects`; al recargar una ruta del espacio de trabajo se queda allí mientras carga                                                                                                                 |

### Ajustes al escribir el código

- **Descartado del curso:** `UDashboardNavbar` (F4 L29). La referencia Focus no tiene barra superior; su lugar lo ocupa la cabecera ilustrada con el botón de plegar el lateral.
- **Descartado de la referencia:** calendario, etiquetas de colores y temporizador. La app no tiene esos datos; las tarjetas resumen muestran proyectos listos y por configurar y filtran la lista.
- **Componentes retirados:** `AppIcon`, `BrandLogo`, `BrandChart`. Los iconos son Lucide vía `UIcon`.
- **Plugin de acceso con nombre** (`access`) y que también entrega la sesión, para que el plugin `api` declare `dependsOn: ['access']`. Su lógica no cambió.
- **`pnpm-workspace.yaml`:** pnpm dejó un marcador para el script de `vue-demi`; se fijó en `false`, como en Copilot (solo elige entre Vue 2 y 3).

## Comprobación

| Comprobación                                                   | Resultado                                                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`                                            | Todo con el estilo de Prettier                                                                            |
| `pnpm lint`                                                    | Sin errores (un comentario en la raíz del template de `workspace.vue` se movió al script)                 |
| `pnpm typecheck`                                               | Sin errores                                                                                               |
| `pnpm build`                                                   | Completo en 9,85 s                                                                                        |
| `/auth` en el navegador integrado, escritorio y móvil (375 px) | Ventana Focus centrada, cabecera ilustrada, botón violeta; sin desbordes                                  |
| Consola en `/auth`                                             | Un 400 seguido de «Session invalidated»: es la renovación de Descope sin sesión, igual que en el original |

**No verificado:** el espacio de trabajo con sesión real. Se intentó forzar en el navegador un estado de sesión lista y el middleware volvió a comprobar la sesión real y redirigió a `/auth`, como debe; no se añadió un modo de simulación al código. Contraste de color y teclado en el lateral no se midieron. Nuxt avisó una vez en desarrollo `NUXT_E4011` (NuxtPage aún sin montar) mientras el layout mostraba la carga; el propio aviso indica que ocurre cuando la página se monta de forma condicional.

## Consecuencias y continuidad

La app ya tiene la base visual para el resto de módulos de la API. Siguiente: [proyectos](../feature/projects&catalog-import/01-paginas-de-proyectos.md).

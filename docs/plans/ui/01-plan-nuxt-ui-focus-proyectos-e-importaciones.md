# 01 — Plan: Nuxt UI con estilo Focus, proyectos e importaciones

Fecha de creación: 2026-11-03
Estado: Plan
Ámbito: `KSuT/LearningAllPosibolIt-web`
Relacionada con: [curso](../../fonts/ui/01-curso-nuxt-full-stack-nuxt-ui.md), [Nuxt UI y antecedentes](../../fonts/ui/02-documentacion-nuxt-ui-y-antecedentes.md), [contrato API](../../fonts/feature/projects&catalog-import/01-contrato-api-proyectos-e-importaciones.md), [plan de la migración original](../01-migracion-flutter-a-nuxt.md)
Revisión de referencia: `57752dc` (copia exacta de `estadistica-forms-web` en `60e3f59`)

## Objetivo

1. La web copiada usa Nuxt UI como única biblioteca de componentes, con la estética de la captura Focus en oscuro y una variante clara.
2. Tras iniciar sesión se entra a un espacio de trabajo con lateral (proyectos) y contenido.
3. Páginas reales contra [LearningAllPosibolIt](../../../../LearningAllPosibolIt): listar, crear, ver, editar y borrar proyectos; subir un CSV, seguir su procesamiento y ver o borrar importaciones.

Se dará por completo cuando `format:check`, `lint`, `typecheck` y `build` pasen y las páginas públicas se vean en el navegador. El recorrido con sesión real lo comprueba el usuario (Descope no se automatiza).

## Punto de partida

La copia tiene acceso y cuenta con Descope (`/auth`, `/session`, `/account`), Tailwind con tokens propios (verde `#163C32`, Roboto) y componentes hechos a mano (`AppIcon`, `BrandLogo`, `BrandChart`). No hay Nuxt UI ni páginas de datos. La API copia expone proyectos, importaciones, organizaciones, reglas, evaluaciones, exportaciones y feeds (A2–A7).

## Fuentes y decisiones

| Necesidad                 | Fuente              | Alternativa                                                  | Decisión                                                                                                                                                                                    |
| ------------------------- | ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalar Nuxt UI          | F1, D2              | Seguir con Tailwind a mano                                   | Módulo `@nuxt/ui` 4.12.0 (misma versión que Copilot), `UApp` en `app.vue`; se retiran `@tailwindcss/vite` (lo trae el módulo) y Roboto (Focus usa la fuente del sistema)                    |
| Tema Focus                | F3, D2, D3, D4      | Colores de Nuxt UI por defecto                               | `app.config.ts` con `primary: violet`, `neutral: zinc` (F3) y variables `--ui-*` medidas por Copilot en `.dark`; modo oscuro por defecto                                                    |
| Panel con lateral         | F4, D1, D4          | Navegación superior                                          | Layout `workspace` con `UDashboardGroup` + `UDashboardSidebar` plegable y redimensionable; cada página es un `UDashboardPanel` dentro de `WorkspacePage` (cabecera ilustrada + título fino) |
| Acceso                    | F2, D4              | Mantener la tarjeta verde                                    | Layout `default` como ventana Focus centrada; páginas de acceso y error con `UButton`, `UAlert`, `UError`; se borran los componentes hechos a mano que ya no se usen                        |
| Llamar a la API con token | F5, F7, D4, A8      | `useFetch` con SSR (F7)                                      | No sirve: el token solo existe en el navegador. Cliente `$api` en un plugin solo cliente con `$fetch`, un reintento tras renovar ante 401 y errores con `message.es` de la API              |
| Datos por página          | F5, F7              | Estado a mano en cada página                                 | Composables con `useAsyncData(..., { server: false })`: devuelven `data`, `status`, `error`, `refresh` como en F5, sin bloquear el render (idea de `lazy` en F7)                            |
| Formulario de proyecto    | F8, F9, D1, A3      | Validación manual con `checkValidations` + `watch deep` (F9) | `UForm` con esquema Zod 4: misma idea de F9 sin escribir la función ni el `watch`. Un solo componente `ProjectForm` para crear y editar (F8); `useToast` al guardar (F10)                   |
| Tabla de importaciones    | F6, D1, A7          | Lista de tarjetas                                            | `UTable` con columnas tipadas y `h(UBadge)` para el estado (F6)                                                                                                                             |
| Subida del CSV            | F11, D1, A5, A6, A9 | `<input type="file">` propio                                 | `UFileUpload` (un archivo `.csv`) + `FormData` con `file`, `idColumn`, `delimiter`; aviso previo si supera 10 MiB                                                                           |
| Seguir el trabajo         | A6, A7              | Recargar a mano                                              | Propuesta propia: consultar `jobs/:jobId` cada 2 s hasta `succeeded` o `failed`, como máximo 2 minutos, y refrescar la tabla                                                                |
| Borrar                    | A5                  | Sin borrado                                                  | `UModal` de confirmación; tras borrar un proyecto, volver a la lista                                                                                                                        |

## Incrementos

1. **Nuxt UI y tema Focus** (bitácora `ui/01`): dependencias, CSS, `app.config`, `UApp`, layout de acceso, páginas de acceso/error, rutas del espacio de trabajo, layout `workspace`, `FocusCover`, `WorkspacePage` y cuenta. Comprobar typecheck, build y la página `/auth` en el navegador.
2. **Proyectos** (bitácora `feature/projects&catalog-import/01`): tipos, cliente `$api`, servicio y composables, lista en el lateral y en `/projects`, crear, ver, editar y borrar. Comprobar typecheck, lint y build.
3. **Importaciones** (bitácora `feature/projects&catalog-import/02`): subir CSV, seguimiento del trabajo, tabla y borrado dentro del proyecto. Mismas comprobaciones.
4. Cerrar con README actualizado, commit y tag `v0.1.0` (gestionar-versiones-git).

## Comprobación prevista

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; abrir `/auth` en el navegador integrado para ver el tema. Con la API apagada, sin sesión, no se puede recorrer el espacio de trabajo: queda para el usuario con su cuenta (crear proyecto, subir CSV, editar, borrar).

## Límites y continuidad

Fuera de este plan: organizaciones e invitaciones, reglas, evaluaciones, revisión y exportación TSV, feeds y publicaciones. Cada uno tendrá su plan en `docs/plans/feature/` cuando se aborde. Cambiar de proveedor de identidad o añadir pruebas automáticas de interfaz también queda fuera.

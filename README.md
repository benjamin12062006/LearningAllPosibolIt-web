# claudeLearningAllPosibolIt-web

Fecha de creación: 2026-10-19 (heredada de `estadistica-forms-web`)
Última actualización: 2026-11-05
Relacionada con: [plan ui 01](docs/plans/ui/01-plan-nuxt-ui-focus-proyectos-e-importaciones.md), [bitácora ui 01](bitacora-construccion/ui/01-nuxt-ui-y-tema-focus.md), [plan de la migración original](docs/plans/01-migracion-flutter-a-nuxt.md).

Web de aprendizaje para la API [claudeLearningAllPosibolIt](../claudeLearningAllPosibolIt). Es una copia de [estadistica-forms-web](../estadistica-forms-web) (`main` en `60e3f59`) con Git propio, igual que la API es una copia de `estadistica-forms-api`. El primer commit (`57752dc`) es la copia exacta; lo demás se construye aquí.

Nuxt 4.6.2, Vue 3.5.44, TypeScript 6.0.3, **Nuxt UI 4.12.0** (Tailwind CSS 4.3.3 incluido), Zod 4.6.7, iconos Lucide locales, Descope Vue SDK 3.1.19 y pnpm 12.5.1. TypeScript 6 se fija porque vue-tsc y ESLint todavía no admiten TypeScript 7.

## Diseño

Nuxt UI es la única biblioteca de componentes. La estética sigue la [captura Focus](docs/fonts/assets/focus-macos-referencia.png): lateral gris violáceo con tarjetas resumen, panel ciruela oscuro, cabecera ilustrada, título grande y fino y filas densas. Modo oscuro por defecto y variante clara desde el menú de cuenta. Fuentes y decisiones en [docs/fonts/ui](docs/fonts/ui).

## Ubicación

```text
KSuT/
├── claudeLearningAllPosibolIt/       # API Nest (copia de estadistica-forms-api)
├── claudeLearningAllPosibolIt-web/   # Esta app Nuxt
├── estadistica-forms-api/            # Originales, sin cambios
└── estadistica-forms-web/
```

## Ejecutar

```sh
cd /Users/benji/Documents/KSuT/claudeLearningAllPosibolIt-web
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000). pnpm administra Node 24.19.0 para este proyecto mediante `devEngines.runtime`; no hace falta reemplazar el Node global.

El `.env` local (ignorado) se copió del original con los valores públicos de Descope. En otra máquina:

```sh
cp .env.example .env
```

Completar `NUXT_PUBLIC_DESCOPE_PROJECT_ID`. Nunca introducir Management Key ni tokens en variables públicas. Reiniciar Nuxt después de cambiar `.env`.

La API debe estar activa en el puerto 8080 (ya admite el origen `http://localhost:3000`):

```sh
cd /Users/benji/Documents/KSuT/claudeLearningAllPosibolIt
pnpm start:dev
```

La API original y la copia usan el mismo puerto: arrancar solo una.

## Páginas

| Ruta                                      | Qué hace                                                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/auth`, `/session`                       | Acceso con Descope y recuperación de sesión (ventana Focus centrada)                                                                                                                                       |
| `/projects`                               | Proyectos de la cuenta; `?estado=listos` o `?estado=por-configurar` filtran                                                                                                                                |
| `/projects/new`                           | Crear proyecto (nombre, país, moneda, canal)                                                                                                                                                               |
| `/projects/:id`                           | Resumen, importaciones del catálogo (subir CSV, seguir el procesamiento, borrar) y eliminar proyecto                                                                                                       |
| `/projects/:id/edit`                      | Editar o terminar de configurar                                                                                                                                                                            |
| `/projects/:id/rules`                     | Revisiones de reglas, de la más reciente a la más antigua; «Evaluar» abre el diálogo de evaluación                                                                                                         |
| `/projects/:id/rules/new`                 | Crear la revisión siguiente (`?base=N` parte de la revisión N): mapeo de columnas y reglas                                                                                                                 |
| `/projects/:id/rules/:revision`           | Una revisión en lectura; «Usar como base» y «Evaluar con esta revisión»                                                                                                                                    |
| `/projects/:id/evaluations`               | Historial de evaluaciones, de la más reciente a la más antigua                                                                                                                                             |
| `/projects/:id/evaluations/:evaluationId` | Avance de una evaluación, conteos, informe filtrable (`?resultado=invalidas&pagina=2`), descarga de `errores.csv`, exportación confirmada de `productos.tsv` (`?exportacion=<id>`) y «Publicar en el feed» |
| `/projects/:id/feed`                      | Feed del proyecto: URL para Merchant Center (se ve una sola vez), versión publicada e historial, y actualización diaria (fuente, política, horario, «Actualizar ahora»)                                    |
| `/organizations`                          | Organizaciones con tu rol; crear una de equipo                                                                                                                                                             |
| `/organizations/:id`                      | Proyectos (enlazados si son tuyos), miembros y roles, invitaciones con enlace de una sola vez, archivar y restaurar                                                                                        |
| `/invitations/accept#<token>`             | Aceptar una invitación (hay que entrar con el correo invitado)                                                                                                                                             |
| `/account`                                | Datos de la cuenta y cierre de sesión                                                                                                                                                                      |

El historial `/projects/:id/evaluations` usa `GET /projects/:id/evaluations`, añadido a la API `claudeLearningAllPosibolIt` el 2026-11-04 ([plan 02 de la API](../claudeLearningAllPosibolIt/docs/plans/feature/rulesets&evaluations/02-plan-listar-evaluaciones.md)); necesita una API que ya incluya esa ruta.

## Organización

```text
app/
├── pages/          # Acceso, cuenta y proyectos
├── layouts/        # default (acceso) y workspace (lateral + panel)
├── components/     # FocusCover, WorkspacePage, formularios, filas y tablas
├── composables/    # useAccess, useProjects, useProjectImports, useRulesets, useEvaluation, useEvaluationReport, useEvaluationExport, useProjectFeed, useFeedVersions, useFeedRefresh, useOrganizations
├── plugins/        # access (SDK y sesión) y api (servicios con token)
├── middleware/     # Navegación coherente con el estado de acceso
├── services/       # Cliente HTTP, proyectos, importaciones, reglas, evaluaciones, exportaciones, feeds, organizaciones, acceso y perfil
├── types/          # Contratos de la API con comprobaciones de forma
├── utils/          # Rutas de acceso, formato y comprobaciones pequeñas
└── assets/css/     # Tailwind + Nuxt UI y tokens Focus
```

El token Descope solo existe en el navegador. Por eso los datos se piden en el cliente (`useAsyncData` con `server: false`) y las páginas del espacio de trabajo se montan solo cuando la sesión está lista. El cliente HTTP renueva el token y reintenta una vez ante un 401, y muestra el mensaje en español que devuelve la API. Nest sigue siendo quien valida identidad, permisos y datos.

## Comprobaciones

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Resultados en la bitácora. El recorrido con sesión real (crear, editar y borrar proyectos; subir un CSV) queda a cargo del usuario: Descope no se automatiza.

## Documentación

- `docs/fonts/`: fuentes consultadas (cursos, documentación, contratos de la API).
- `docs/plans/`: planes antes de implementar.
- `bitacora-construccion/`: qué se implementó, por qué y cómo se comprobó.

Los archivos sin subcarpeta (`01-…`) vienen del proyecto original y se conservan como historia.

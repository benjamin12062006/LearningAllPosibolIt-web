# 01 — Plan: páginas de reglas versionadas y evaluaciones

Fecha de creación: 2026-11-03
Estado: Plan
Ámbito: `KSuT/claudeLearningAllPosibolIt-web`
Relacionada con: [contrato API](../../../fonts/feature/rulesets&evaluations/01-contrato-api-reglas-y-evaluaciones.md), [curso](../../../fonts/feature/rulesets&evaluations/02-curso-paginacion-maestro-detalle-y-modales.md), [plan ui 01](../../ui/01-plan-nuxt-ui-focus-proyectos-e-importaciones.md), [bitácora de importaciones](../../../../bitacora-construccion/feature/projects&catalog-import/02-subir-y-seguir-importaciones.md)
Revisión de referencia: web `a7a63aa` (`v0.1.0`); API `f6b4bf9` con cambios sin commit en otros módulos.

## Objetivo

Dentro de un proyecto con su catálogo importado, la persona puede:

1. Ver las revisiones de reglas y abrir cualquiera en modo lectura.
2. Crear una revisión nueva: mapear columnas del CSV a los atributos de Google y añadir reglas (limpiar texto, construir título, excluir filas).
3. Evaluar una importación lista con una revisión y seguir su avance.
4. Leer el resultado: conteos, informe paginado y filtrable por resultado, problemas de cada fila con su corrección sugerida y descarga de `errores.csv`.

Estará completo cuando cada incremento pase `format:check`, `lint`, `typecheck` y `build`, y el usuario recorra con su sesión el camino importar → reglas → evaluar → informe.

## Punto de partida

La web tiene proyectos e importaciones (`v0.1.0`), cliente HTTP con token y `useAsyncData` en cliente. No tiene tipos ni páginas de reglas o evaluaciones. La API sí los tiene (B1–B11), pero **no lista evaluaciones**.

## Fuentes y decisiones

| Necesidad                              | Fuente                         | Alternativa                          | Decisión propuesta                                                                                                                                                                                                                                                                               |
| -------------------------------------- | ------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dónde viven las páginas                | C4, C5; ui 01                  | Pestañas dentro de `/projects/:id`   | Rutas hijas enlazables: `/projects/:id/rules`, `/rules/new`, `/rules/:revision`, `/evaluations/:evaluationId`. Una navegación horizontal del proyecto (`UNavigationMenu`): Catálogo, Reglas                                                                                                      |
| Columnas para el mapeo                 | B10                            | Escribir los nombres a mano          | Elegir una importación `ready` y leer sus `headers` de `GET imports/:snapshotId`                                                                                                                                                                                                                 |
| Editor de mapeo                        | B3, B4                         | Lista libre de pares                 | Una fila fija por atributo (8), con `USelect` de columna o «Sin mapear» y marca de obligatorio. Así no se puede repetir un atributo y se ve qué falta                                                                                                                                            |
| Editor de reglas                       | B3, D5; sin clase en el curso  | `UForm` anidado por regla            | Un solo `UForm` con Zod: `rules` como `z.discriminatedUnion('type', …)`; cada regla es una tarjeta con sus campos, botones subir/bajar/quitar y límite de 20. Propuesta propia                                                                                                                   |
| Coherencia (referencias, obligatorios) | B5, B6                         | Copiar `findRulesetIssues` en la web | No copiar. Solo la validación de forma (Zod) va en la web; los issues de la API se sitúan en su fila: `mapping.<atributo>` → fila del atributo, `rules.<i>.…` → tarjeta `i`. Evita dos copias de la misma regla de negocio                                                                       |
| Partir de la revisión anterior         | B1, B2                         | Empezar siempre vacío                | «Nueva revisión» precarga la última; desde una revisión, «Usar como base» precarga esa                                                                                                                                                                                                           |
| Lanzar una evaluación                  | C5, B7, B9                     | Página aparte                        | `UModal` propio de la funcionalidad: elegir importación `ready` y revisión (la última por defecto). Al aceptar, navegar a la evaluación                                                                                                                                                          |
| Seguir la evaluación                   | B7, B8; patrón de `waitForJob` | Recargar a mano                      | Consultar `GET evaluations/:id` cada 2 s mientras esté `queued` o `running`, con el mismo límite y parada al salir que las importaciones; mostrar conteos al terminar                                                                                                                            |
| Informe paginado y filtrado            | C1, C2, B7                     | Paginación en estado local           | `?resultado=invalidas&pagina=2` en la URL: se lee en el composable (página no numérica → 1) y al cambiar se hace `router.push` conservando el resto. `UPagination` + `UTable` de 20 filas; `UTabs` o botones para Todas/Válidas/Inválidas/Excluidas                                              |
| Problemas de una fila                  | B8                             | Columna de texto largo               | Fila expandible de `UTable` con atributo, problema y sugerencia (`.es`)                                                                                                                                                                                                                          |
| Descargar `errores.csv`                | B7, B11                        | Enlace directo                       | No sirve (sin token). El cliente admite `responseType: 'blob'`; se crea un enlace temporal con `URL.createObjectURL` y se libera después. Propuesta propia                                                                                                                                       |
| Carga sin bloquear                     | C3                             | `await` en el render                 | Igual que ui 01: `server: false` y skeletons                                                                                                                                                                                                                                                     |
| Historial de evaluaciones              | B7 (no existe)                 | Guardar ids en `localStorage`        | **Pendiente de decisión del usuario.** Recomendado: añadir `GET /projects/:id/evaluations` en la API con su propio plan allí. Mientras tanto, la web solo enlaza la evaluación recién creada (toast y URL). `localStorage` se descarta: se pierde entre dispositivos y no es la fuente de verdad |

## Incrementos

1. **Revisiones en lectura.** Tipos con comprobaciones (`RulesetVersion`, reglas por `type`), servicio `rulesets`, composable `useRulesets`/`useRuleset`, navegación del proyecto, `/rules` (filas Focus: «Revisión N», fecha, n.º de reglas) y `/rules/:revision` (mapeo y reglas en texto legible). Comprobar typecheck, lint y build.
2. **Crear revisión.** Selector de importación y lectura de cabeceras, editor de mapeo y de reglas, esquema Zod, guardado con `POST`, issues de la API situados en su fila y toast. Comprobar lo mismo y, con la API, guardar una revisión válida y otra con un obligatorio sin mapear.
3. **Lanzar y seguir una evaluación.** Servicio `evaluations`, modal de lanzamiento desde el proyecto y desde una revisión, `/evaluations/:id` con estado, seguimiento y conteos en tarjetas, y muestra de 20 filas. Errores de B9 con su mensaje.
4. **Informe y descarga.** Filtro y paginación en la URL, tabla con filas expandibles, opción `responseType` en el cliente y descarga de `errores.csv`.
5. **Historial de evaluaciones.** Bloqueado hasta que la API tenga el listado (ver decisión pendiente).

Cada incremento abre su entrada en `bitacora-construccion/feature/rulesets&evaluations/` y se guarda con commit; al cerrar 1–4, tag `v0.2.0`.

## Comprobación prevista

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build` en cada incremento; la página de la revisión y el editor se revisan en el navegador integrado solo si hay sesión. Recorrido manual del usuario con la API en el puerto 8080: importar el CSV de ejemplo, crear revisión, evaluar, filtrar inválidas, cambiar de página, descargar `errores.csv` y abrirlo en Excel o Numbers.

## Límites y continuidad

Fuera de este plan: exportación TSV y aprobación de exclusiones (reviews & exports), feeds y publicaciones, organizaciones, GraphQL, el informe en inglés (la API lo ofrece con `?lang=en`; la web es solo en español) y pruebas automáticas de interfaz. Revisar el plan si la API cambia B1–B9 (sus módulos están en obras) o si añade el listado de evaluaciones.

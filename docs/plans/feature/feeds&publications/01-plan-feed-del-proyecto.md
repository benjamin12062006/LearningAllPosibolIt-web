# 01 — Plan: el feed del proyecto en la web

Fecha de creación: 2026-11-05
Estado: Plan
Ámbito: `KSuT/LearningAllPosibolIt-web`
Relacionada con: [fuentes](../../../fonts/feature/feeds&publications/01-contrato-api-feeds-y-actualizaciones.md), [revisar y exportar](../reviews&exports/01-plan-revisar-y-exportar.md), [fuentes del curso](../../../fonts/feature/rulesets&evaluations/02-curso-paginacion-maestro-detalle-y-modales.md), [curso (formularios)](../../../fonts/ui/01-curso-nuxt-full-stack-nuxt-ui.md)
Revisión de referencia: web `30f7814` (`v0.3.0`); API `612b745`.

## Objetivo

Cumplir RF06 (R1) desde la web: crear el feed, entregar su URL estable, publicar una exportación, ver la versión publicada y su historial, y configurar la actualización diaria (fuente, política y horario) viendo el resultado del último intento.

## Fuentes y decisiones

| Necesidad                  | Fuente                    | Alternativa               | Decisión propuesta                                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dónde vive                 | G1 (un feed por proyecto) | Lista de feeds            | Pestaña «Feed» del proyecto: `/projects/:id/feed`. Sin feed, un estado vacío con «Crear feed»                                                                                                                                                                       |
| URL que solo se ve una vez | G4, G6 (D7)               | Guardarla en el navegador | Al crear o rotar: modal con la URL completa (origen de la API + `deliveryUrl`), botón copiar y aviso de que no se volverá a mostrar. Copiar con `navigator.clipboard` (propuesta propia; no hay clase sobre esto)                                                   |
| Rotar y desactivar         | G1, G6                    | Sin confirmación          | Ambas con `UModal` de confirmación: invalidan la URL que tenga Merchant Center                                                                                                                                                                                      |
| Publicar                   | G1, G6 (D6)               | Pedir el id a mano        | Desde el panel de exportación de la evaluación: «Publicar en el feed» con la `generation` leída del feed. En el historial, «Volver a publicar» una versión que conserve su `exportId`                                                                               |
| Conflicto de generación    | G6                        | Reintentar solo           | Mostrar el 409 y volver a leer el feed: la persona decide otra vez                                                                                                                                                                                                  |
| Estado y alerta            | R1, G2, G6 (D12)          | Solo la versión           | Tarjetas: versión publicada (filas, fecha, quién la publicó), entrega activa o no, último intento con resultado y mensaje en español                                                                                                                                |
| Historial                  | G1 (`versions`, paginado) | Todo de una vez           | Tabla con 20 por página y `?pagina=` en la URL (C1/C2, como el informe)                                                                                                                                                                                             |
| Fuente, política y horario | G3; F9 (Zod), D1 (UForm)  | Un único formulario       | Tres formularios pequeños con `UForm` y Zod, con los mismos límites que los DTO; la revisión de la política se elige de la lista de revisiones; la zona horaria con `USelectMenu` buscable sobre `Intl.supportedValuesOf('timeZone')`, por defecto la del navegador |
| Actualizar ahora           | G5                        | Sin seguimiento           | Botón «Actualizar ahora» (solo con fuente y política) y seguimiento cada 2 s del trabajo, como las evaluaciones; al terminar, se vuelve a leer el feed                                                                                                              |

## Incrementos

1. **Feed y entrega:** tipos, servicio, composable, pestaña, crear feed, modal de la URL, estado y versión publicada, rotar y desactivar.
2. **Publicar y versiones:** «Publicar en el feed» desde la exportación, historial paginado y «Volver a publicar».
3. **Actualización automática:** formularios de fuente, política y horario; «Actualizar ahora» con seguimiento; último intento visible.

Cada incremento con su entrada en `bitacora-construccion/feature/feeds&publications/` y commit; al cerrar los tres, `v0.4.0`.

## Comprobación prevista

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; comprobaciones de forma y esquemas con esbuild y Node. Recorrido del usuario con API y sesión: crear feed y copiar la URL, abrirla en el navegador (debe descargar el TSV publicado), publicar, rotar (la URL antigua da 404), configurar fuente/política/horario y «Actualizar ahora».

## Límites y continuidad

Fuera: credenciales de la fuente remota, avisos por correo o webhook, organizaciones (ampliación E1). La comprobación en Merchant Center necesita la API publicada.

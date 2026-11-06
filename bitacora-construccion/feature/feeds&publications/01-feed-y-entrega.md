# 01 — Feed del proyecto y URL de entrega

Fecha de creación: 2026-11-05
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 1 del [plan 01 del feed](../../../docs/plans/feature/feeds&publications/01-plan-feed-del-proyecto.md)
Relacionada con: [fuentes](../../../docs/fonts/feature/feeds&publications/01-contrato-api-feeds-y-actualizaciones.md), [revisar y exportar](../reviews&exports/01-revisar-y-exportar.md)
Revisión de partida: `30f7814` (`v0.3.0`); API `612b745`

## Necesidad y punto de partida

Siguiente funcionalidad según `docs-diagrams/09` (incremento 5, R1–R2). La web no tenía nada de feeds; la API sí (G1–G6).

## Evidencia y decisiones

| Decisión                            | Evidencia | Aplicación                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipos comprobados de toda la vista  | G2, G5    | [types/feeds.ts](../../../app/types/feeds.ts): `isFeed`, `isFeedWithDelivery` (la URL debe empezar por `/feeds/`), `isFeedVersionList`, `isLastRefresh`, `isActiveRefresh`                                                                                                                                                                                                      |
| Servicio completo                   | G1, G5    | [services/feeds.ts](../../../app/services/feeds.ts): leer, crear, rotar, desactivar, publicar, versiones, fuente, política, horario y actualizaciones. Lo usan este incremento y los dos siguientes                                                                                                                                                                             |
| Un feed por proyecto, en su pestaña | G1        | [useProjectFeed.ts](../../../app/composables/useProjectFeed.ts) lee `items[0]`; pestaña «Feed» en [ProjectNav.vue](../../../app/components/ProjectNav.vue); página [feed.vue](../../../app/pages/projects/[id]/feed.vue) con «Crear feed» si no existe                                                                                                                          |
| URL completa                        | G4        | [publicFeedUrl](../../../app/utils/feed-url.ts): `new URL(deliveryUrl, apiBaseUrl)`, que conserva solo el origen de la API                                                                                                                                                                                                                                                      |
| La URL se ve una vez                | G6 (D7)   | [OneTimeLinkModal.vue](../../../app/components/OneTimeLinkModal.vue) (entonces `FeedUrlModal.vue`; generalizado en [organizaciones 02](../organizations&access/02-miembros-e-invitaciones.md)): no se cierra al hacer clic fuera, «Copiar URL» con `navigator.clipboard` y, si falla, el texto queda seleccionado al enfocarlo. La URL solo vive mientras el modal está abierto |
| Rotar y desactivar con confirmación | G1, G6    | [FeedDelivery.vue](../../../app/components/FeedDelivery.vue): un `UModal` con el texto de cada acción; rotar abre otra vez el modal de la URL                                                                                                                                                                                                                                   |
| Versión publicada                   | R1, G2    | [FeedPublishedVersion.vue](../../../app/components/FeedPublishedVersion.vue): productos, tamaño, quién y cuándo; enlace a su evaluación                                                                                                                                                                                                                                         |

### Ajustes al escribir el código

- **Sin `as` en el modal:** seleccionar el texto al enfocar se hizo con `event.target instanceof HTMLInputElement`.
- **Desactivar no devuelve el feed (204):** la web actualiza `deliveryEnabled` en su copia en lugar de volver a pedirlo.

## Comprobación

| Comprobación                                       | Resultado                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Sin errores                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm build`                                       | Completo en 11,7 s                                                                                                                                                                                                                                                                                                                                                               |
| Comprobaciones con esbuild y Node                  | Feed vacío y completo aceptados; respuesta de creación aceptada y rechazada con una `deliveryUrl` que no es `/feeds/…`; historial con versión vigente y otra sin exportación; vista completa de una actualización aceptada (`retry_wait` cuenta como activa, `succeeded` no); `publicFeedUrl` da `http://127.0.0.1:8080/feeds/abc.tsv` y `https://api.ejemplo.com/feeds/abc.tsv` |

**No verificado:** con API y sesión. Recorrido: Feed → «Crear feed», copiar la URL, abrirla en el navegador (404 hasta publicar), «Crear URL nueva» (la anterior responde 404), «Desactivar».

## Consecuencias y continuidad

Siguiente: incremento 2, publicar desde la exportación y el historial de versiones.

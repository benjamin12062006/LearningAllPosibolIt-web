# 02 — Publicar en el feed y volver a una versión

Fecha de creación: 2026-11-05
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 2 del [plan 01 del feed](../../../docs/plans/feature/feeds&publications/01-plan-feed-del-proyecto.md)
Relacionada con: [01 feed y entrega](01-feed-y-entrega.md), [revisar y exportar](../reviews&exports/01-revisar-y-exportar.md), [fuentes](../../../docs/fonts/feature/feeds&publications/01-contrato-api-feeds-y-actualizaciones.md)
Revisión de partida: `19ad73d`

## Necesidad y punto de partida

El feed existía pero no se podía publicar desde la web. La API publica cualquier exportación del proyecto con la generación que vio el operador (G1, G6 D6).

## Evidencia y decisiones

| Decisión                         | Evidencia                    | Aplicación                                                                                                                                                                                                     |
| -------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publicar con la generación leída | G6 (D6)                      | `publish` en [useProjectFeed.ts](../../../app/composables/useProjectFeed.ts): envía `feed.generation`; con `409 FEED_GENERATION_CONFLICT` vuelve a leer el feed y deja que la persona decida otra vez          |
| Publicar desde la exportación    | Plan, «Publicar»             | [FeedPublishButton.vue](../../../app/components/FeedPublishButton.vue) en [ExportPanel.vue](../../../app/components/ExportPanel.vue): sin feed lleva a crearlo; si esa exportación ya es la publicada, lo dice |
| Historial paginado en la URL     | G1 (`versions`), C1/C2       | [useFeedVersions.ts](../../../app/composables/useFeedVersions.ts) con `?pagina=`; como la API solo da `hasMore`, se navega con «Más recientes» y «Anteriores»                                                  |
| Volver a una versión             | G6 (D6: también una antigua) | [FeedVersions.vue](../../../app/components/FeedVersions.vue): «Volver a publicar» si conserva `exportId`, con confirmación porque cambia lo que descarga Merchant Center                                       |

### Ajustes al escribir el código

- **Estado compartido:** el botón de la exportación, la página del feed y el historial usan la misma clave de `useAsyncData` (`feed:<proyecto>`), así que publicar en un sitio actualiza los demás sin otra petición.
- **Versión sin exportación:** si se borró la importación de la que salió, `exportId` es `null` y la fila dice «Sin exportación» en lugar de ofrecer publicar.

## Comprobación

| Comprobación                                       | Resultado          |
| -------------------------------------------------- | ------------------ |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Sin errores        |
| `pnpm build`                                       | Completo en 10,5 s |

**No verificado:** con API y sesión. Recorrido: exportar una evaluación y «Publicar en el feed»; abrir la URL del feed (descarga el TSV); exportar otra evaluación más reciente y publicarla; en el historial, «Volver a publicar» la primera; publicar desde dos pestañas a la vez (la segunda debe ver el conflicto y el feed actualizado).

## Consecuencias y continuidad

Siguiente: incremento 3, la actualización diaria (fuente, política, horario y «Actualizar ahora»).

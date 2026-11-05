# 03 — Actualización diaria del feed

Fecha de creación: 2026-11-05
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 3 del [plan 01 del feed](../../../docs/plans/feature/feeds&publications/01-plan-feed-del-proyecto.md)
Relacionada con: [02 publicar y versiones](02-publicar-y-versiones.md), [fuentes](../../../docs/fonts/feature/feeds&publications/01-contrato-api-feeds-y-actualizaciones.md), [curso (formularios)](../../../docs/fonts/ui/01-curso-nuxt-full-stack-nuxt-ui.md)
Revisión de partida: `e9fff22`

## Necesidad y punto de partida

RF06 pide programar una fuente autorizada y mostrar fallos (R1). La API tiene fuente remota, política aprobada, horario y actualizaciones con su último intento (G1, G3, G5, G6 D9–D12); la web no los usaba.

## Evidencia y decisiones

| Decisión                            | Evidencia                                          | Aplicación                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mismos límites que los DTO          | G3; `source-url.ts` y `feed-schedule.ts` de la API | [feed-forms.ts](../../../app/utils/feed-forms.ts): `feedSourceSchema` (`https:`, sin credenciales, ≤ 2.048), `feedPolicySchema` (revisión ≥ 1, máximos 0–5.000, caída 0–100 entera), `feedScheduleSchema` (`HH:MM` y zona válida con `Intl.DateTimeFormat`, como `isValidTimeZone`)                                                                 |
| Tres formularios pequeños con UForm | F9 (Zod), D1                                       | [FeedSourceForm.vue](../../../app/components/FeedSourceForm.vue), [FeedPolicyForm.vue](../../../app/components/FeedPolicyForm.vue) (revisión elegida de la lista de reglas, sin cifras por defecto), [FeedScheduleForm.vue](../../../app/components/FeedScheduleForm.vue) (`USwitch`, hora y `USelectMenu` con las zonas, la del navegador primero) |
| Alerta del último intento           | R1, G2, G6 (D12)                                   | [FeedLastRefresh.vue](../../../app/components/FeedLastRefresh.vue): en curso con su paso, fallo, publicó, sin cambios, pendiente de revisión o conflicto, con el motivo en español y si fue programada o a mano                                                                                                                                     |
| «Actualizar ahora» con seguimiento  | G5; patrón de las evaluaciones                     | [useFeedRefresh.ts](../../../app/composables/useFeedRefresh.ts): pone en cola y consulta cada 2 s hasta terminar (10 minutos como máximo, se detiene al salir); al terminar se vuelve a leer el feed                                                                                                                                                |
| Sin fuente o política no se dispara | G6 (D11: `409`)                                    | [FeedAutomation.vue](../../../app/components/FeedAutomation.vue): el botón queda desactivado y lo explica; los ajustes van en un `UAccordion`                                                                                                                                                                                                       |

### Ajustes al escribir el código

- **Sin `as const`** en el aviso: el `computed` tiene un tipo con nombre (`AlertView`).
- **Fecha de aprobación reactiva:** al aprobar, el padre reemplaza el feed; el texto «Aprobada el…» sigue a `props.feed.policy` y no a la copia inicial.
- **Mensajes de la URL:** el esquema no puede saber si el servidor es público; eso lo comprueba la API al descargar y su error aparece en el último intento.

## Comprobación

| Comprobación                                            | Resultado                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`      | Sin errores                                                                                                                                                                                                                                                                                                          |
| `pnpm build`                                            | Completo en 11,1 s                                                                                                                                                                                                                                                                                                   |
| Esquemas empaquetados con esbuild y ejecutados con Node | URL: acepta `https://…` y rechaza `http:`, credenciales, `ftp:` y texto; fuente, política y horario válidos aceptados; los malos dan sus mensajes en el campo correcto (revisión sin elegir, máximo negativo, 5.001, porcentaje 1,5, hora `24:00`, zona inexistente); 418 zonas, la del equipo primero y sin repetir |

**No verificado:** con API y sesión. Recorrido: guardar una fuente con URL pública `https`, aprobar una política, guardar el horario y «Actualizar ahora»; ver el paso en curso y el resultado; con límites estrictos debe acabar en «pendiente de revisión» sin cambiar la versión publicada.

## Consecuencias y continuidad

Con los tres incrementos el plan del feed está completo en la web (`v0.4.0`). Falta comprobar la descarga desde Merchant Center con la API publicada (R2). Según `docs-diagrams`, lo siguiente es la ampliación E (organizaciones y acceso, ya en ramas del backend).

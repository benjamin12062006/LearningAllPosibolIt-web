# 05 — Plan: cierre de la UI sobre la API terminada

Fecha de creación: 2026-11-14  
Estado: En curso.  
Revisión de partida: rama `feature/pruebas-y-cliente-http` (`bcf5303` más B1, B3 y V0 sin commit; 52 pruebas en verde).  
Relacionada con: [ficha ui 08 (contraste con la API)](../../fonts/ui/08-contraste-de-planes-con-la-api-cerrada.md), [plan ui 04](04-plan-sistema-visual-interaccion-y-mascota.md), [plan del visor](../feature/feed-viewer/01-plan-visor-y-diagnostico.md), [hojas 01](../feature/worksheets/01-plan-libros-hojas-importar-y-exportar.md), [hojas 02](../feature/worksheets/02-plan-tabla-editable-y-borradores.md), [integraciones 01](../feature/integrations/01-plan-mcp-oauth-descope.md), [contexto de Integraciones](../../../../CONTEXTO-SIGUIENTE-CHAT-UI.md).

## Objetivo

Ejecutar, en un orden que no obligue a rehacer nada, todos los planes pendientes de la web y los cuatro huecos que encontró la ficha ui 08, hasta que cada función de la API tenga su pantalla.

## Decisiones

| ID | Decisión | Respaldo |
| --- | --- | --- |
| U1 | **REST en todos los servicios.** GraphQL queda como mejora medible por pantalla | Ficha ui 08: C7, interpretación 2 |
| U2 | **Ark UI para los controles compuestos** nuevos (diálogo lateral, pestañas, acordeón, pasos, subida de archivos, portapapeles, menú) con las clases del tema. Los primitivos de presentación y de formulario (`UButton`, `UAlert`, `UBadge`, `USkeleton`, `UInput`, `UIcon`) siguen siendo los de Nuxt UI, como en las pantallas existentes | Ficha ui 03: H1, H2; plan del visor, VW1 |
| U3 | **Modo por defecto: claro**, con el selector manual de siempre. Es lo que el usuario dijo al hablar del modo por defecto; cambiarlo es una línea de `nuxt.config.ts` | Plan ui 04, «Decisión pendiente» |
| U4 | **Composables por función con auto-importación** (`imports.dirs: ['composables/**']`); servicios, tipos y funciones puras se importan de forma explícita, como hasta ahora | Ficha ui 03, H3 |
| U5 | **Chat del asistente** (hueco G2): `services/assistant.ts` lee el SSE con `fetch` y reanuda con `?after=`; el estado de una ejecución es una función pura `evento → estado`; el panel vive en la plantilla «Espacio de datos» y, en el resto del proyecto, se abre como panel lateral | Ficha ui 08: G2, C1–C4 |
| U6 | **Eventos reales, no los del plan 04:** sin `status` ni `text.delta`; con `run.queued`. La mascota viaja a la hoja o a sus columnas (`target.columnIds`), no a filas | Ficha ui 08: C1, C2 |
| U7 | **La selección de la tabla es el contexto del chat** (hueco G1): al enviar un mensaje con filas o columnas seleccionadas se crea la selección de H6 y su `selectionId` va en `context` | Ficha ui 08: G1 |
| U8 | **Integraciones con dos pestañas, MCP y CLI**, de estados independientes. MCP local: credencial de entrega única mostrada en su control y borrada al cerrar, cambiar de ámbito o salir. MCP remoto: concesión OAuth y URL del recurso. CLI: «en preparación» hasta que Nest publique la audiencia | Ficha ui 08: G3, C5, C6; contexto de Integraciones |
| U9 | **Nada sale con secretos:** configuración, plantillas descargables y prompt se arman con una función pura que solo recibe datos públicos; una prueba inyecta un marcador de secreto y comprueba que no aparece | Contexto de Integraciones, «Cuándo se da por hecha» |
| U10 | **Conocimiento del asistente** (hueco G4) como sección de Integraciones: estado por tipo de fuente y «Reindexar» para quien tenga `changeset.approve` | Ficha ui 08: G4 |
| U11 | **Verificación sin backend en marcha:** pruebas de servicios con `$fetch` simulado, pruebas de componentes y composables en el entorno `nuxt`, y un **laboratorio de desarrollo** (`/laboratorio`) que monta los componentes reales con datos de ejemplo para las capturas. El recorrido contra Nest con sesión Descope queda como comprobación pendiente y se dice así en cada bitácora | Plan ui 04, §8 «Laboratorio»; contexto de Integraciones, punto 3 |

## Orden de ejecución

| Bloque | Etapas | Por qué en este punto |
| --- | --- | --- |
| 1 | **S0, S2, S1** del plan ui 04: color y contraste, movimiento, plantillas y navegación | Todo lo demás se dibuja con estos tokens y plantillas |
| 2 | **V1–V5** del visor | Usa V0 ya hecho; estrena «Espacio de datos» y «Panel lateral» con datos de solo lectura |
| 3 | **HW-0 a HW-5** de hojas | Servicio, administración, importar, exportar y la tabla de solo lectura |
| 4 | **TE-0 a TE-7** | Motor, `grid`, editores, pegado, borrador, revisión y esquema sobre la tabla del bloque 3 |
| 5 | **A0–A3** (chat) y **M0–M2** (mascota) | Necesitan la hoja y el borrador para enseñar lo que la IA lee y propone |
| 6 | **I0–I3** (integraciones y conocimiento) | Reutiliza la revisión de propuestas del bloque 5 |
| 7 | Verificación completa y bitácoras | Cierre |

## Etapas nuevas

| Etapa | Qué | Comprobación prevista |
| --- | --- | --- |
| **A0** | Tipos y servicio del asistente: conversaciones, mensajes, ejecuciones, decisión de propuestas y lectura del SSE | Rutas, predicados, análisis del flujo SSE partido en trozos, reanudación con `after` |
| **A1** | Estado de una ejecución como función pura y composable del chat | Cada evento → estado; 409 `AGENT_RUN_ACTIVE`, 429 y 503 con su texto |
| **A2** | Panel del chat: historial, caja de mensaje, «Detener», tarjeta de propuesta, región viva | Pruebas de componente; teclado; foco sin mover |
| **A3** | Marcas en la tabla de lo que la IA lee y propone, y enlace al borrador creado | `target.columnIds` resaltadas; resultado con `changesetId` enlazado |
| **I0** | Tipos y servicio de integraciones y de conocimiento | Rutas, `Idempotency-Key`, predicados, token solo en la respuesta de alta |
| **I1** | Pantalla con pestañas MCP y CLI, ámbito, clientes, configuración y prompt | Sin marcador de secreto en copia, descarga y prompt; cliente no probado nunca «disponible» |
| **I2** | Credenciales: alta, entrega única, listado, revocación; concesión OAuth | Cambiar de proyecto o revocar limpia el secreto visible; revocar pide confirmación con nombre y alcance |
| **I3** | Revisión de una propuesta externa y sección de conocimiento | Confirmar manda el hash revisado; 409 caducada; reindexar solo con permiso |

## Límites

- Sin cambios en Nest ni en el servicio de IA.
- El dibujo de la mascota y su nombre siguen pendientes de aprobación del usuario (plan ui 04, M0): se entrega en el laboratorio.
- La conexión real de un cliente MCP y el recorrido con sesión Descope se verifican con el backend en marcha; esta ejecución los deja preparados y los señala como pendientes.


## Implementación y comprobaciones del 15 de noviembre

- Las rutas y el estado de productos, comparación, atención, entrega y prueba de reglas están implementados. Se comprobó el contrato del visor junto a las suites HTTP de Nest.
- El editor de hojas incorpora vistas guardadas, historial, transferencias, autoguardado con `If-Match` y ciclo de revisión. La cuadrícula se virtualiza con TanStack y el motor coincide con el de Nest.
- El chat usa el contrato SSE de Nest y selección H6. La mascota se puede revisar en `/laboratorio/mascota`. Su nombre y aspecto final siguen pendientes de aprobación.
- La decisión U8 sobre CLI se actualizó al verificar el código actual de Nest. La audiencia `cli` ya existe y la web documenta el paquete privado. El binario pasó sesión, catálogo, lectura y rechazo después de revocar contra una base temporal. Cada cliente externo conserva su estado de comprobación.
- El [plan 06](06-plan-organizar-la-web-por-funcionalidad.md) reúne el código por funcionalidad. El 15 de noviembre se aplicaron las seis migraciones al Cloud SQL usado por Nest local y se comprobaron los listados en la web. [Bitácora de migraciones](../../../LearningAllPosibolIt/bitacora-construccion/settings/16-aplicar-migraciones-chat-e-integraciones.md).

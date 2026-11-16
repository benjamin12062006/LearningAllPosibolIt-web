# 08 — Contraste de los planes de la web con la API ya cerrada

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: código de la API Nest (solo lectura), sus contratos publicados y los planes de la web.  
Revisión de la API: `32caecc` (`feature/cierre-backend`) más el árbol de trabajo de Integraciones (`src/integrations/`, sin commit).  
Relacionada con: [plan ui 05 (cierre de la UI)](../../plans/ui/05-plan-cierre-de-la-ui.md), [contrato del chat](../../../../LearningAllPosibolIt/contracts/chat/README.md), [contrato de Integraciones](../../../../LearningAllPosibolIt/contracts/integrations/README.md), [contrato GraphQL](../../../../LearningAllPosibolIt/contracts/README.md), [contrato del visor](../feature/feed-viewer/01-contrato-api-visor-y-diagnostico.md), [contrato de hojas](../feature/worksheets/01-contrato-api-hojas.md).

## Necesidad

Las fichas y los planes de la web se escribieron con la API en `fb32457`. Desde entonces se cerraron C7 (GraphQL), E6.2–E6.6 (chat) y E6.7 (MCP). Antes de construir hay que saber qué rutas quedan sin pantalla y qué supuestos de los planes ya no valen.

## Método (E1)

Se listaron las rutas de todos los controladores (`grep` de `@Controller`, `@Get`, `@Post`… en `src/**/*.controller.ts`: 135 rutas) y se cruzaron con los servicios de `app/services/` y con las etapas de los planes. Las formas se leyeron en los `*.types.ts` y `*.dto.ts` de cada módulo.

## Cobertura por área (E2)

| Área de la API | Rutas | En la web hoy | Plan que la cubre | Hueco |
| --- | --- | --- | --- | --- |
| Sesión, cuenta, organizaciones, miembros, invitaciones | `auth`, `users`, `organizations`, `invitations` | Hecho | — | Ninguno |
| Proyectos y acceso | `projects`, `projects/:id/access` | Hecho | — | Ninguno |
| Catálogo, reglas, evaluaciones, exportar | `imports`, `jobs`, `rulesets`, `evaluations`, `exports` | Hecho | — | Ninguno |
| Feed y actualización automática | `feeds`, `refreshes` | Hecho | — | Ninguno |
| Visor (V1–V5) | `products`, `product`, `delivery`, `attention`, `comparison`, `evaluations/preview` | Solo V0 | [visor 01](../../plans/feature/feed-viewer/01-plan-visor-y-diagnostico.md) | Ninguno en el plan |
| Libros, hojas, filas, vistas | `workbooks`, `worksheets`, `rows/query`, `saved-views`, `revisions` | Nada | [hojas 01](../../plans/feature/worksheets/01-plan-libros-hojas-importar-y-exportar.md) | Ninguno en el plan |
| Importar, plantillas, exportar, puente | `imports`, `import-mappings`, `exports`, `catalog-snapshots`, `from-catalog` | Nada | hojas 01 | Ninguno en el plan |
| Borradores | `changesets/*`, `revert-proposal` | Nada | [hojas 02](../../plans/feature/worksheets/02-plan-tabla-editable-y-borradores.md) | Ninguno en el plan |
| Herramientas de hoja (H6) | `selections`, `transform-previews`, `change-proposals` | Nada | **Ninguno** | **G1** |
| Conversaciones y ejecuciones del agente | `conversations`, `messages`, `runs`, `ai-runs/*` (SSE) | Nada | Solo §7 y §8 del [plan ui 04](../../plans/ui/04-plan-sistema-visual-interaccion-y-mascota.md) | **G2** |
| Integraciones | `integrations/credentials`, `…/revoke`, `integrations/proposals/*` | Nada | [integraciones 01](../../plans/feature/integrations/01-plan-mcp-oauth-descope.md) (solo OAuth) | **G3** |
| Conocimiento | `knowledge`, `knowledge/reindex` | Nada | **Ninguno** | **G4** |

Las rutas `internal/v1/*` son de servicio a servicio y `GET /feeds/:file` es la entrega pública: no llevan pantalla.

## Huecos y supuestos que cambian (E3)

| ID | Qué se observa | Fuente |
| --- | --- | --- |
| G1 | H6 no está en ningún plan de la web. La selección (`POST …/worksheets/:id/selections` con `{ revisionId, columnIds, rows }`) es además el `selectionId` que una ejecución del chat acepta en `context` | `worksheet-tools.dto.ts`; `agent-runs.dto.ts:RunContextDto` |
| G2 | El chat no tiene plan de pantalla: los planes de hojas lo dejaban fuera «hasta E6.4». El contrato ya existe: mensaje con `clientMessageId`, ejecución 202, SSE con `id`/`event`/`data`, reanudar con `?after=` | `contracts/chat/README.md` |
| G3 | El plan de integraciones cubre la concesión OAuth. Falta la credencial local (`audience: "mcp"`, token de **entrega única**, 409 `INTEGRATION_CREDENTIAL_ALREADY_ISSUED` al repetir), la pestaña CLI y el estado de verificación | `contracts/integrations/README.md`; `integrations.service.ts:issue` |
| G4 | `GET projects/:id/knowledge` → `{ enabled, sources: [{ sourceType, sourceId, syncedAt, pending }] }`; `POST …/reindex` → 202 `{ status: 'queued' }` (Manager; 409 `KNOWLEDGE_DISABLED`) | `knowledge.service.ts:34-80` |
| C1 | El plan ui 04 (§7) cita los eventos `status` y `text.delta`. **No existen** en esta versión: la respuesta llega entera en `run.completed`. Existe `run.queued`, que el plan no citaba | `contracts/chat/events.json` |
| C2 | `target` **no trae filas**: es `{ worksheetId, columnIds?, selectionId? }`, `{ workbookId }`, `{ projectId, evaluationId? }` o `{ projectId, feedId? }`. La mascota puede ir a una hoja o a sus columnas, no a una fila concreta | `agent-operation-catalog.ts` (`targetOf`) |
| C3 | El SSE pide `Authorization: Bearer`. `EventSource` no envía cabeceras: hay que leer el flujo con `fetch` | `agent-runs.controller.ts:137-165` |
| C4 | El resultado de confirmar una propuesta dice qué se creó: `changesetId`, `worksheetId` o `savedViewId`. Un borrador sigue su revisión humana | `contracts/chat/README.md`, paso 6 |
| C5 | La CLI **no está publicada**: `IssueCredentialDto.audience` solo admite `mcp` y `mcp_oauth`; el plan 07 de Nest deja el cliente CLI «en su etapa propia» | `integrations.dto.ts`; plan 07 de Nest, estado |
| C6 | La configuración del MCP local necesita tres variables: `KTSU_NEST_URL`, `KTSU_MCP_ADAPTER_TOKEN` (secreto del entorno, lo pone quien administra) y `KTSU_MCP_CREDENTIAL` (la credencial del proyecto). La pantalla solo puede entregar marcadores | `LearningAllPosibolIt-ai/README.md`, «Servidor MCP local» |
| C7 | GraphQL ya existe con una operación por pantalla (`contracts/graphql/nuxt/`). Cubre 100 de 135 rutas: fuera quedan organizaciones, subidas, descargas, SSE e Integraciones | `contracts/README.md` |
| C8 | El modo `mode` de una hoja es siempre `'free'` y `generation` existe en el resumen; el plan de hojas no los usa. Sin efecto en las pantallas | `worksheets.types.ts:58-63` |

## Interpretación

1. **Los planes del visor y de hojas siguen valiendo tal cual**: sus contratos no cambiaron entre `fb32457` y `32caecc` (se comprobó en `worksheets.types.ts`, `changesets.types.ts`, `row-query.ts`, `worksheet-imports.types.ts` y `worksheet-exports.types.ts`).
2. **REST se mantiene** (C7). El cliente REST ya está probado (52 pruebas) y sirve para todo, también para lo que GraphQL deja fuera. Pasar una pantalla a GraphQL solo cambiaría su servicio: se anota como mejora medible, no como requisito.
3. **Faltan cuatro piezas de plan** (G1–G4) y **dos correcciones** al plan ui 04 (C1 y C2). Se recogen en el [plan ui 05](../../plans/ui/05-plan-cierre-de-la-ui.md).
4. **La CLI se muestra como «en preparación»** (C5) y el MCP local como «disponible para configurar», nunca como «verificado»: la pantalla no puede comprobar un cliente externo.

## Mapa necesidad → fuentes → decisión

| Necesidad | Fuentes | Decisión (plan ui 05) |
| --- | --- | --- |
| Chat del asistente | G2, C1–C4 | Etapas A0–A3: servicio con SSE por `fetch`, panel, propuestas y mascota conectada |
| Selección para el agente y transformaciones | G1 | La selección de la tabla se manda como contexto del chat; transformar a mano queda dentro del chat |
| Integraciones completas | G3, C5, C6 | Pestañas MCP y CLI; credencial local de entrega única; OAuth según el plan 01; CLI pendiente |
| Conocimiento | G4 | Sección «Conocimiento del asistente» en Integraciones |
| Transporte | C7 | REST; GraphQL como mejora posterior |

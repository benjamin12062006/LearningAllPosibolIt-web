# 02 — Plan de investigación: visor del feed («post») y hojas («pre»)

Fecha de creación: 2026-11-14  
Última actualización: 2026-11-14  
Estado: Investigación terminada (I1–I5). La construcción espera el visto bueno del usuario; etapas propuestas en la [ficha ui 04](../../fonts/ui/04-bases-comunes-para-visor-y-hojas.md#propuesta-de-etapas-de-construcción-para-escribir-los-planes).  
Revisión de partida: `bcf5303` (`main`).  
Relacionada con: [16 — Nuxt, tabla central y contratos](../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md), [22 — visor y diagnóstico del feed](../../../../docs-diagrams/22-visor-y-diagnostico-del-feed.md), [12 — hojas](../../../../docs-diagrams/12-hojas-modelo-editor-importacion-y-exportacion.md), [23 — GraphQL para Nuxt](../../../../docs-diagrams/23-graphql-nest-para-fastapi-y-nuxt.md), [plan ui 01](01-plan-nuxt-ui-focus-proyectos-e-importaciones.md).

## Por qué

La web tiene la parte media del recorrido (catálogo → reglas → evaluación → TSV → feed) y organizaciones. Faltan las dos puntas:

- **Post (después del TSV):** el visor y el diagnóstico del feed (documento 22). Su API está completa en Nest (V1–V5).
- **Pre (antes del CSV):** las hojas, «nuestro Excel» (documentos 12 y 16, entrega E7). Su API está en Nest (E3–E5 y H1–H5).

La sesión que llevaba la web ya no existe; la continúa esta. El usuario pidió investigar primero, con el flujo fuentes → plan → bitácora, y construir cuando confirme que la API está cerrada. Esta investigación no escribe código de producto.

## Decisiones vigentes que la investigación debe respetar

- **Ark UI para Vue** es la única biblioteca de controles interactivos; **Nuxt UI aporta el tema** (colores, bordes, tipografía y modo oscuro) por Tailwind (16, 2026-11-12).
- **Organización por función** al crecer: `components/<función>/`, `composables/<función>/`, `services/` y `types/`; las pantallas actuales se migran cuando se trabajen (16).
- **Tabla HTML semántica** con controles de Ark UI; medir antes de virtualizar (16, «Tabla de hojas y cálculos»).
- **Nest decide** permisos, validación y cálculos oficiales; la web muestra y pide (16; plan 02 de cierre).
- **GraphQL (C7)** para las lecturas compuestas cuando exista; multipart, descargas y SSE siguen en REST (16, 23).

## Etapas de la investigación

| Etapa     | Pregunta                                                                                                                                                                                                | Salida                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **I1** | ¿Cómo está hoy la web y qué supone pasar a Ark UI y a la organización por función?                                                                                                                      | [Ficha ui 03](../../fonts/ui/03-ark-ui-tema-y-organizacion-por-funcion.md)                                                                                                         |
| ✅ **I2** | ¿Qué devuelve exactamente la API del visor (V1–V5): formas, filtros, errores y permisos?                                                                                                                | [Ficha feed-viewer 01](../../fonts/feature/feed-viewer/01-contrato-api-visor-y-diagnostico.md)                                                                                     |
| ✅ **I3** | ¿Cómo construir las pantallas del visor? Cursos de la biblioteca y documentación de Ark UI para tabla, panel lateral, pestañas, grupos, paginación, comparación e imágenes                              | [Ficha feed-viewer 02](../../fonts/feature/feed-viewer/02-cursos-y-documentacion-interfaz-del-visor.md)                                                                            |
| ✅ **I4** | ¿Qué ofrece la API de hojas (libros, hojas, filas, borradores, importar, exportar, puente y H1–H5)? ¿Qué hace falta para una tabla editable (teclado, pegado, guardado del borrador, versión esperada)? | [Ficha worksheets 01](../../fonts/feature/worksheets/01-contrato-api-hojas.md) y [ficha worksheets 02](../../fonts/feature/worksheets/02-tabla-editable-cursos-y-documentacion.md) |
| ✅ **I5** | ¿Qué bases comunes hacen falta en ambas puntas: cliente HTTP (errores, `Idempotency-Key`, `If-Match`, descargas), permisos por rol, pruebas automáticas de la web y GraphQL?                            | [Ficha ui 04](../../fonts/ui/04-bases-comunes-para-visor-y-hojas.md) y el mapa final                                                                                               |

Cada ficha cierra con su mapa _necesidad → fuentes → decisión pendiente_. Al terminar se proponen las etapas de construcción del visor y de las hojas, para escribir sus planes cuando el usuario dé el visto bueno.

## Límites

- Solo lectura en Nest y en FastAPI: no se tocan, porque hay otra sesión trabajando en Nest.
- No se instala nada en la web. Las versiones se comprueban en el registro de npm.
- Las reconstrucciones de lecciones se hacen solo cuando una decisión dependa del código de la lección.

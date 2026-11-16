# 02 — Chat unificado

Fecha de creación: 2026-11-15  
Estado: Implementado  
Ámbito: Nuxt, API Nest y servicio Python.  
Revisión de partida: Web bcf5303, Nest 32caecc, Python dad7d5d.  
Relacionada con: [plan](../../../docs/plans/feature/assistant/01-plan-chat-unificado.md), [fuentes](../../../docs/fonts/feature/assistant/02-chat-unificado-y-actividad.md) y [chat de hojas](01-chat-y-contexto-de-hoja.md).

La conversación del proyecto conserva un historial al cambiar de sección. Cada ejecución toma la hoja activa y su selección, después de validar los IDs en Nest. El catálogo compartido con MCP y el flujo SSE mantienen las operaciones trazables. Véanse F2 y F4–F6 en la ficha de fuentes.

El panel permite ampliar su borde izquierdo hasta 42 rem, limitado por el ancho disponible. El historial sigue los nuevos mensajes y la actividad cuando está al final. Cada chat conserva su propia ejecución al ocultar el panel o navegar. La respuesta completa se agrega al terminar la ejecución.

Para consultar y seleccionar filas, el catálogo hereda la revisión solo si corresponde a la hoja solicitada. La herramienta de selección indica al agente que reutilice los identificadores de la consulta. El registro existente marca los fallos de selección como `failed` y carece de un código de error por herramienta.

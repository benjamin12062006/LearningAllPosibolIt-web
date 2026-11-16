# 01 — Plan del chat unificado

Fecha de creación: 2026-11-15  
Estado: Implementado  
Ámbito: Nuxt, API Nest y servicio Python.  
Revisión de referencia: Web bcf5303, Nest 32caecc, Python dad7d5d, con cambios locales existentes.  
Relacionada con: [fuentes](../../../fonts/feature/assistant/02-chat-unificado-y-actividad.md), [chat de hojas](../../../../bitacora-construccion/feature/assistant/01-chat-y-contexto-de-hoja.md) y [sistema visual](../../ui/04-plan-sistema-visual-interaccion-y-mascota.md).

## Objetivo

Continuar la misma conversación al pasar por Hojas, Reglas, Evaluaciones, Productos, Feed y la vista de Chats. Conservar el texto en edición, el historial y la ejecución. Mostrar qué datos consulta la IA y seguir su recorrido hasta el recurso disponible.

## Punto de partida

Hojas monta un chat cuyo filtro depende del recurso. El panel general selecciona una conversación de proyecto y se desmonta al navegar. Nest liga el contexto de la ejecución al recurso de la conversación. Python recorta a ocho herramientas por similitud y corta a las ocho llamadas. El texto de ese corte se genera localmente.

## Incrementos

1. **Contrato y agente.** Aceptar la hoja activa por ejecución con validación de pertenencia y aplicar el mismo catálogo que usa MCP. Cargar una guía breve de la aplicación antes del primer turno, incluir el contexto del lugar y ajustar los presupuestos de llamadas y tiempo. Consultar la última ejecución junto al historial para reanudarla. Fuentes F4–F6.
2. **Espacio de chat.** Mantener cada ejecución en el layout autenticado y permitir cambiar de conversación mientras sigue trabajando. Reubicar el mismo componente en el panel lateral ajustable, en Hojas y en Chats. Mostrar una fila de una línea por conversación y empezar con un panel de 22 rem. Renderizar las respuestas Markdown con las restricciones de F3. Fuentes F1–F3.
3. **Actividad y efectos.** Mostrar cada operación del servidor y su resultado. Resolver rutas con IDs verificados y animar la mascota hacia el recurso visitado. Con el panel visible y «Seguir acciones» activo, navegar al destino de la conversación seleccionada y mantener abierto el panel. Al ocultar el panel o cambiar de conversación, seguir recibiendo el resultado en segundo plano. Tras confirmar un cambio, refrescar las consultas afectadas y abrir el objeto creado. Fuentes F2 y F5.
4. **Proyectos.** Revisar el flujo real de creación, validar la petición y corregir la causa reproducible.

## Comprobación prevista

Ejecutar pruebas y comprobaciones de tipos de los tres repositorios. Probar la continuidad del historial y el flujo de ejecución entre páginas. Contrastar los efectos mediante el contrato SSE y las confirmaciones. Verificar la creación de proyectos con datos de prueba o una API simulada, según la sesión y los entornos disponibles.

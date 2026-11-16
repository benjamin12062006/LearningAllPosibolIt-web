# 01 — Chat y contexto de hoja

Fecha de creación: 2026-11-15  
Última actualización: 2026-11-15  
Estado: Implementado. Comprobado con contrato, servicios temporales y laboratorio.  
Relacionada con: [plan de cierre](../../../docs/plans/ui/05-plan-cierre-de-la-ui.md), [contrato de Nest](../../../../LearningAllPosibolIt/contracts/chat/README.md) y [movimiento](../../../docs/plans/ui/04-plan-sistema-visual-interaccion-y-mascota.md).

Se seguirá la secuencia del contrato de Nest para crear el mensaje y la ejecución, leer los eventos con `after` y revisar las propuestas. Los eventos apuntan a identificadores de hoja y columnas. La selección usa filas de la revisión oficial.


El [módulo del asistente](../../../app/features/assistant) abre la conversación al mostrar el chat y conserva el contexto de la hoja y de la ejecución. El lector prueba la renovación de sesión y la reanudación con `after`. El laboratorio permite revisar las marcas y la mascota con eventos simulados y respeta el ajuste de movimiento.

Las pruebas HTTP de Nest y la pila temporal Nest–FastAPI cubrieron las rutas del chat y MCP `stdio`. La verificación con el entorno habitual depende de aplicar las migraciones a Cloud SQL. El nombre y el aspecto final de la mascota quedan a elección del usuario.

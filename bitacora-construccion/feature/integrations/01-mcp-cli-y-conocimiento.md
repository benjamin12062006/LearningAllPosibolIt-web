# 01 — Integraciones MCP, CLI y conocimiento

Fecha de creación: 2026-11-15  
Última actualización: 2026-11-15  
Estado: Implementado. Verificación con Nest temporal y CLI privada.  
Relacionada con: [plan de cierre](../../../docs/plans/ui/05-plan-cierre-de-la-ui.md), [plan OAuth](../../../docs/plans/feature/integrations/01-plan-mcp-oauth-descope.md) y [contrato de Nest](../../../../LearningAllPosibolIt/contracts/integrations/README.md).

El DTO y el controlador actuales incluyen la audiencia `cli`. El cliente existe en `packages/ktsu-cli` con paquete privado. Se muestran comandos del ejecutable local. La disponibilidad de OAuth se toma de `oauthResourceUrl`. La pantalla reserva los secretos para el control de entrega única.


El [módulo de integraciones](../../../app/features/integrations) incluye configuración por cliente, pestañas separadas de MCP y CLI, autorización OAuth según URL publicada, revisión de propuesta externa y estado de conocimiento. El navegador probó que el secreto desaparece al cerrar el diálogo y que se refleja la revocación. El binario privado pasó autenticación, listado de operaciones, lectura del proyecto y rechazo tras revocar contra el Nest temporal.

Los fragmentos descargables y el prompt incluyen únicamente información pública. La prueba añade un marcador de secreto y ensaya una URL con query sensible. La compatibilidad por cliente se ofrece como pendiente de comprobación hasta disponer de una lectura exitosa. [Conectores remotos de Claude](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) y [servidores MCP personalizados en ChatGPT](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt).

# 01 — Fuentes de Integraciones MCP con Descope

Fecha de creación: 2026-11-14  
Relacionada con: [plan de la pantalla](../../../plans/feature/integrations/01-plan-mcp-oauth-descope.md).

| Fuente consultada el 2026-11-14 | Aplicación en Nuxt |
| --- | --- |
| [Descope para MCP](https://docs.descope.com/mcp) y [registro de clientes](https://docs.descope.com/agentic-identity-hub/core-components/mcp-servers/registration-methods) | El cliente MCP inicia OAuth y Descope autentica al usuario en su navegador. La pantalla KTSU gestiona la autorización de proyecto mediante la sesión web y entrega la URL del Resource. |
| [Contrato de Integraciones](../../../../../LearningAllPosibolIt/contracts/integrations/README.md) | La lista identifica el recurso configurado. El alta OAuth devuelve metadatos del grant. El listado y la revocación usan los mismos endpoints del proyecto. |
| [Cliente HTTP de Nuxt](../../../../app/services/api-client.ts) y [contexto de la pantalla](../../../../../CONTEXTO-SIGUIENTE-CHAT-UI.md) | Reusar la sesión Descope, la renovación y la cabecera de idempotencia. Mostrar disponibilidad y verificación como estados distintos. Mantener la revisión humana en Nuxt. |

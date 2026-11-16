# 01 — Conectar el agente personal a KTSU con Descope

Fecha de creación: 2026-11-14  
Estado: Plan de UI con contrato de backend listo para pruebas locales.  
Relacionada con: [fuentes 01](../../../fonts/feature/integrations/01-fuentes-mcp-oauth-descope.md), [plan OAuth](../../../../../LearningAllPosibolIt-ai/docs/plans/feature/agente/05-plan-oauth-mcp-descope.md).

1. Desde «Integraciones» del proyecto, cargar `GET P/integrations/credentials` con el cliente HTTP que ya usa Descope. `oauthResourceUrl` indica si el entorno tiene un Resource configurado para ese proyecto. Con `null` mostrar que OAuth remoto está pendiente de configuración. La configuración prueba disponibilidad, y una lectura desde el cliente externo acredita la conexión.
2. Mostrar el nombre del proyecto y dos opciones de acceso. Lectura es la opción inicial. Preparar propuestas requiere `ai.use` y mantiene la revisión humana para el efecto. Enviar `audience: "mcp_oauth"`, `capabilities`, etiqueta y `Idempotency-Key`. Mostrar los metadatos de la concesión activa y su vencimiento.
3. Mostrar «Copiar URL del MCP» con `oauthResourceUrl`. El usuario pega la URL en un cliente MCP HTTP y completa el inicio de sesión y consentimiento que ese cliente abre en Descope. Los archivos descargados se generan con la URL y los scopes admitidos cuando el cliente elegido acepte ese formato. El navegador de Nuxt conserva su sesión web para las rutas de KTSU, y el cliente MCP administra su propio access token y refresh token.
4. «Revocar acceso» llama al endpoint de revocación del grant OAuth. Actualizar el listado y borrar el estado de conexión de esa concesión. Una 403 con grant pendiente acompaña el camino al alta. Los errores de membresía, expiración y archivado usan los estados de proyecto del cliente existente.
5. La ruta `/projects/:id/integrations/proposals/:proposalId` recupera la propuesta con sesión web. Muestra el resumen y manda el hash revisado al confirmar o rechazar. Conserva la aprobación y aplicación del flujo de borradores cuando el resultado sea un borrador.

## Aceptación

- Usuario de otro proyecto, organización archivada y Viewer con permiso de solo lectura.
- Plantillas y portapapeles con URL y scopes públicos, verificadas con un marcador de secreto de prueba.
- Cliente externo de staging completa OAuth, lista y lee. Después de revocar, su siguiente llamada se rechaza. Preparar deja la propuesta pendiente y confirmarla requiere la sesión web.

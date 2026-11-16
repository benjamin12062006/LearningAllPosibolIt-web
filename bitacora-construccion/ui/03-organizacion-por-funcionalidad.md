# 03 — Organización por funcionalidad y comprobación del cierre

Fecha de creación: 2026-11-15  
Última actualización: 2026-11-15  
Estado: Implementado y verificado con el stack temporal.  
Relacionada con: [plan 06](../../docs/plans/ui/06-plan-organizar-la-web-por-funcionalidad.md), [ficha 09](../../docs/fonts/ui/09-arquitectura-nuxt-por-funcionalidad.md) y [cierre 05](../../docs/plans/ui/05-plan-cierre-de-la-ui.md).

Se aplican F2 y R1 para conservar las rutas de Nuxt, y F3 y R2 para agrupar implementación por funcionalidad. El registro de Nuxt conserva los nombres de los componentes y el acceso a los composables.


## Código

- [Registro de componentes en Nuxt](../../nuxt.config.ts) conserva nombres de componentes y carga diferida. Los composables que usa cada funcionalidad están declarados por import en sus consumidores.
- [Entrada de la hoja](../../app/pages/projects/%5Bid%5D/worksheets/%5BworksheetId%5D/index.vue) monta el [espacio de trabajo](../../app/features/worksheets/components/Workspace.vue). El [composable coordinador](../../app/features/worksheets/composables/useWorksheetWorkspace.ts) reúne borradores, filas, vistas y selección del asistente.
- [Ámbito del proyecto](../../app/features/projects/types/project-scope.ts) se comparte entre hojas, asistente e integraciones. El [layout](../../app/layouts/workspace.vue) carga el estado del lateral después del montaje para usar el mismo estado en SSR y en la hidratación.
- El [cliente HTTP](../../app/services/api-client.ts) desactiva el caché de las peticiones autenticadas. Un ETag de borrador versiona las operaciones. Una decisión de aprobación puede modificar el estado y conservar esa versión.

## Comprobaciones

Inventario de rutas idéntico antes y después. El recorrido de Chromium con Nest temporal y PGlite verificó edición, aplicación, historial, importación, exportación y revocación con cuenta de prueba. Con tema oscuro y lateral previamente guardados no apareció el aviso de hidratación. Se inspeccionaron capturas del laboratorio en claro y oscuro a 1440, 1024, 768, 375 y 320 px. El ancho del documento coincidió con el viewport.

El diagnóstico de `prisma migrate status` señaló seis migraciones pendientes entre `20261114130000_create_ai_conversations` y `20261114230000_add_mcp_oauth_grants`. El PostgreSQL de ese proceso Nest está detrás de Cloud SQL Auth Proxy. La base temporal sí aplicó las migraciones durante sus pruebas.

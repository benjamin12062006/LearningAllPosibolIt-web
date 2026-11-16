# 10 — Configuración, idioma y moneda

Fecha de creación: 2026-11-15  
Fecha de consulta: 2026-11-15  
Tipo de fuente: documentación oficial, curso local, contratos y capturas del usuario.  
Relacionada con: [plan](../../plans/ui/07-plan-configuracion-e-idioma.md).

- **F1.** La lección «48. Diseño del panel administrativo», Nuxt Full Stack de Fernando Herrera, sección 4, líneas 15–31, muestra el layout que contiene el lateral y su contenido. Se aplica al acceso a Configuración. [Ficha del original](01-curso-nuxt-full-stack-nuxt-ui.md).
- **F2.** La preferencia en una cookie se lee en el servidor y en el navegador. El proveedor de Nuxt UI acepta su catálogo de idioma en `locale`. La aplicación cambia ambas capas a partir del mismo estado. [Nuxt, useCookie](https://nuxt.com/docs/4.x/api/composables/use-cookie) y [Nuxt UI, Internationalization](https://ui.nuxt.com/docs/getting-started/integrations/i18n/nuxt).
- **F3.** Intl localiza nombres de regiones y monedas con los códigos ya validados por el servidor. La app mantiene el código como valor del formulario. [ECMA-402, Intl.DisplayNames](https://tc39.es/ecma402/#displaynames-objects) y [DTO de proyectos](../../../../LearningAllPosibolIt/src/projects/projects.dto.ts).
- **F4.** La captura de creación de proyectos muestra que BO y BOB eran ejemplos de campos vacíos. Se decidió iniciar con EE. UU. y USD y reemplazar los campos por selectores de Nuxt UI. [SelectMenu](https://ui.nuxt.com/docs/components/select-menu).

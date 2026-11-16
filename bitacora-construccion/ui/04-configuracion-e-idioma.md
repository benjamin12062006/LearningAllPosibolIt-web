# 04 — Configuración e idioma

Fecha de creación: 2026-11-15  
Estado: Implementado  
Relacionada con: [plan](../../docs/plans/ui/07-plan-configuracion-e-idioma.md) y [fuentes](../../docs/fonts/ui/10-configuracion-idioma-y-moneda.md).

La preferencia de idioma se lee desde el primer render. Se usa en Nuxt UI, en los mensajes de la app y al iniciar un turno del asistente. Los selectores guardan códigos de país y moneda desde valores válidos.

Configuración reúne cuenta, tema y preferencias en la misma pantalla. El idioma inicial es inglés y los proyectos nuevos empiezan con Estados Unidos y USD. La corrección del espacio de datos mantiene sus etiquetas localizadas como valores reactivos, porque Vue eleva los valores de `withDefaults` fuera de `setup`. Se comprobó la compilación del componente compartido y de sus vistas de Hojas y Productos.

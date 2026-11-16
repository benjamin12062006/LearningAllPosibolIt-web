# 07 — Plan de configuración, idioma y moneda

Fecha de creación: 2026-11-15  
Estado: Implementado  
Ámbito: Aplicación web y contexto del agente.  
Relacionada con: [fuentes](../../fonts/ui/10-configuracion-idioma-y-moneda.md) y [chat unificado](../feature/assistant/01-plan-chat-unificado.md).

1. Abrir Configuración desde el lateral y reunir cuenta, idioma, tema, movimiento y mascota en filas bajas de ancho flexible.
2. Activar inglés inicialmente. Guardar la preferencia inglés/español para cargar el idioma correcto al entrar y comunicarlo a Nuxt UI y a la IA.
3. Usar selectores buscables de país y moneda para crear proyectos. Empezar con Estados Unidos y USD; editar un proyecto carga sus valores guardados.
4. Verificar la selección en ambas lenguas, el valor enviado a Nest y la persistencia al recargar.

La traducción aplica a los controles de la app. Mensajes históricos y datos introducidos por el usuario se muestran con su contenido original.

# 01 — Hoja, edición y revisión

Fecha de creación: 2026-11-14  
Última actualización: 2026-11-15  
Estado: Implementado y verificado con datos sintéticos.  
Revisión de partida: `bcf5303` con trabajo previo sin commit.  
Relacionada con: [libros y transferencias](../../../docs/plans/feature/worksheets/01-plan-libros-hojas-importar-y-exportar.md), [editor y borradores](../../../docs/plans/feature/worksheets/02-plan-tabla-editable-y-borradores.md), [contrato de hojas](../../../docs/fonts/feature/worksheets/01-contrato-api-hojas.md), [tabla editable](../../../docs/fonts/feature/worksheets/02-tabla-editable-cursos-y-documentacion.md), [motor compartido](../../../docs/fonts/feature/worksheets/04-motor-de-calculo-compartido.md).

Se reutilizan los servicios REST de hojas y borradores. El foco del grid sigue F1 de la ficha de la tabla editable. Los valores canónicos y las fórmulas siguen el motor de Nest (M4–M6). El guardado envía la versión leída con `If-Match`; las decisiones se atan al hash revisado.


El [módulo de hojas](../../../app/features/worksheets) reúne la cuadrícula, el borrador, los libros, el historial y las transferencias. La navegación con teclado conserva la posición lógica con filas virtuales. El autoguardado envía `If-Match`; ante un 412 conserva los cambios en pantalla y permite leer la versión del servidor. La revisión ata la decisión al hash y la aplicación reutiliza la misma clave para el mismo contenido y revisión.

**Medición de TE7.** Chromium mostró 5.000 filas de muestra en 2.901 ms con el DOM completo. La adaptación con TanStack Virtual 3.13.51, versión ya presente en el lockfile de Nuxt UI, mostró el siguiente cuadro visible en 36 ms con 26 filas en el DOM en la misma máquina. El observador de esa ejecución no registró tareas largas y Control+Fin enfocó la última fila anunciando su índice. [Adaptador para Vue](https://tanstack.com/virtual/latest/docs/framework/vue/vue-virtual) y [API de Virtualizer](https://tanstack.com/virtual/latest/docs/api/virtualizer).

**Verificación.** Chromium recorrió edición con F2, guardado decimal exacto, envío, aprobación, aplicación, historial, importación CSV y preparación de la exportación con Nest y PGlite. El motor comparte cuatro archivos con Nest y el comprobador falló al añadir un byte a una copia temporal de la fórmula.

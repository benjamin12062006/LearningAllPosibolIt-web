# 06 — Organizar la web por funcionalidad

Fecha de creación: 2026-11-15  
Última actualización: 2026-11-15  
Estado: Implementado y verificado con el stack temporal.  
Relacionada con: [ficha de evidencia 09](../../fonts/ui/09-arquitectura-nuxt-por-funcionalidad.md) y [plan de cierre 05](05-plan-cierre-de-la-ui.md).  
Revisión de partida: `bcf5303` y trabajo de visor, hojas, asistente e integraciones en el árbol local.

## Resultado

Poder abrir una carpeta para entender cómo el producto implementa un flujo y encontrar su vista, sus datos, sus contratos y sus pruebas sin recorrer cinco árboles globales.

| Paso | Cambio | Comprobación |
| --- | --- | --- |
| 1 | Crear el punto de partida con el inventario de rutas, el código actual y las pruebas | Comparar el mismo conjunto de rutas y ejecutar los recorridos antes y después |
| 2 | Mover sesión, organizaciones, proyectos, catálogo, reglas, evaluaciones, exportaciones, feed, visor, hojas, asistente e integraciones a `app/features` | Los imports apuntan al módulo propietario. Las rutas y las autoimportaciones se generan sin colisiones |
| 3 | Dejar entradas de ruta pequeñas para libros, hoja, visor e integraciones. Dentro de hojas usar carpetas para libros, grid, revisiones y transferencias | Los enlaces profundos y la carga diferida abren la misma vista |
| 4 | Mantener compartidos tema, layout, controles, preferencias y cliente HTTP. Adaptar los tests y el comprobador del motor a las nuevas rutas | Lint, tipos, pruebas, comparación del motor y build en verde |
| 5 | Repetir el recorrido de hoja e integraciones contra Nest y comprobar SSR, hidratación, historial y acuerdos de alcance | Registrar comprobaciones, migraciones pendientes del entorno y dependencias externas |

**Aplicación de las fuentes.** F2/R1 separan la entrada de ruta de la vista. F3/R2 respaldan la agrupación por módulo. F4 decide el registro de componentes. F5 orienta las extracciones de lógica cuando crece una vista. La decisión de mantener el contrato REST viene del plan 05.

**Incidentes.** Los errores 500 de chat e integraciones corresponden a seis migraciones pendientes en la base configurada para el Nest de desarrollo. La organización del frontend es independiente de ese despliegue. Se comprobó que la base está detrás de Cloud SQL Auth Proxy. La prueba del navegador usa Nest temporal con PGlite y una identidad de prueba.


## Cierre

El inventario antes y después conserva todos los archivos de `app/pages`. Se agruparon 12 funcionalidades. Se movió la implementación de seis vistas a su módulo y se conservó su entrada de ruta. El enlace de Historial abre el panel de la hoja con `?panel=history`.

La prueba de Chromium contra Nest temporal abrió un libro y una hoja, escribió y guardó `105.00`, envió, aprobó y aplicó el borrador, recorrió las cuatro pestañas del historial, preparó una exportación, importó un CSV y emitió y revocó una credencial CLI. El mismo navegador empezó con el tema oscuro y el lateral plegado guardados. No registró advertencias de hidratación.

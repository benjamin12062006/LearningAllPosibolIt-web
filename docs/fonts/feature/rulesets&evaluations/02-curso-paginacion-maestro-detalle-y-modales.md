# 02 — Curso Nuxt Full Stack: paginación con query, detalle en cliente y modales

Fecha de creación: 2026-11-03
Tipo de fuente: transcripciones locales (originales) y paquete instalado
Origen: curso «Server API, Middleware, Layouts, Caché, NuxtUI, Tailwind, Script Setup, Auth, Sesiones, SSR, SSG, SPA, Despliegues y más» (Fernando Herrera, según el usuario; la transcripción dice «Fernando»). `@nuxt/ui` 4.12.0.
Fecha de consulta: 2026-11-03
Relacionada con: [plan 01 de reglas y evaluaciones](../../../plans/feature/rulesets&evaluations/01-plan-paginas-reglas-y-evaluaciones.md), [ficha del curso usada en ui 01](../../ui/01-curso-nuxt-full-stack-nuxt-ui.md)

## Necesidad de consulta

El informe de una evaluación es paginado y filtrable; la evaluación es el detalle de un proyecto; lanzar una evaluación pide elegir importación y revisión en un diálogo. Faltaba ver cómo lo enseña el curso.

## Localización verificable

Biblioteca: `/Users/benji/Documents/chrome-extencions/trancripciones`, ruta `Nuxt/Nuxt Full Stack/`. Búsquedas con `buscar-aprendizaje-en-cursos`: «paginación parámetros de query reactivos», «UPagination», «maestro detalle uno a muchos», «modal formulario reseñas», «descargar archivo blob», «lista dinámica formulario v-for agregar eliminar». Se excluyen guías `Reconstrucción guiada`.

| ID  | Lección (sección)                                                                                             | Líneas y frase de búsqueda                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | 70. Parámetros de query reactivos (Sección 6)                                                                 | L15 «"model-value" sería el "currentPage"»; L19 «"route" igual a "useRoute()"»; L23–25 «"route.query.page"… "Not A Number"… le voy a poner un "1"»    |
| C2  | 71. Finalizar componente de paginación (Sección 6)                                                            | L15–17 «"router.push()" estamos sobrescribiendo todos los "query"… un "spread"… "route.query"»                                                        |
| C3  | 124. Server Endpoint - Reseñas de producto y 127. Solución a la tarea y problemas de hidratación (Sección 10) | 124 L15 «carga perezosa un "ClientOnly", un mostrar un "skeleton"»; 127 L27–31 «"server:false"… problemas de hidratación»                             |
| C4  | 125. Mostrar reseñas en pantalla (Sección 10)                                                                 | L21 «la "data", el "status" y el "refresh"»                                                                                                           |
| C5  | 126. Modal de reseñas - Preparación y 129. Crear reseña desde el sitio web (Sección 10)                       | 126 L19–21 «es un "modal" que está específicamente diseñado para postear reseñas»; L31 «"@update:open"»; 129 L19 «hagamos el "emit"»                  |
| D5  | Paquete instalado `@nuxt/ui` 4.12.0                                                                           | `Form.vue.d.ts` L25–28: con `nested`, `name` es la ruta del estado dentro del formulario padre; existen `Pagination`, `Tabs`, `SelectMenu`, `Stepper` |

## Evidencia

- **C1/C2:** la página actual vive en `route.query.page`; se lee en el composable, se protege contra valores no numéricos (vuelve a 1) y, al cambiar de página, se hace `router.push` conservando los demás parámetros con `...route.query`.
- **C3:** lo que no hace falta en la primera pintada se carga solo en el cliente, con un skeleton mientras llega; `server: false` evita diferencias de hidratación.
- **C4:** el detalle devuelve `data`, `status` y `refresh`; `refresh` se usa después de crear.
- **C5:** el modal pertenece a su funcionalidad (no es genérico), se cierra con `@update:open` y, tras publicar, emite un evento para que el padre refresque.
- **D5:** Nuxt UI valida formularios anidados por ruta del estado.

## Interpretación y límites

- El curso pagina con un endpoint propio y `useFetch`; aquí se pagina contra Nest con `limit`/`offset` (`limit = perPage`, `offset = (page − 1) · perPage`) y `useAsyncData` en cliente, ya usado en ui 01.
- No hay en la biblioteca una clase de Vue o Nuxt sobre **listas dinámicas en un formulario** (añadir, quitar y ordenar elementos); la búsqueda solo devolvió `FormArray` de Angular, que no se usa. El editor de reglas será propuesta propia apoyada en D5 y en Zod.
- Ninguna clase descarga un archivo protegido por token; esa parte es propuesta propia.

# 01 — Curso Nuxt Full Stack: Nuxt UI, panel, datos y formularios

Fecha de creación: 2026-11-03
Tipo de fuente: transcripciones locales (originales)
Origen: curso «Server API, Middleware, Layouts, Caché, NuxtUI, Tailwind, Script Setup, Auth, Sesiones, SSR, SSG, SPA, Despliegues y más». La transcripción llama «Fernando» al instructor; el usuario lo identifica como Fernando Herrera.
Fecha de consulta: 2026-11-03
Relacionada con: [plan ui 01](../../plans/ui/01-plan-nuxt-ui-focus-proyectos-e-importaciones.md), [documentación y antecedentes](02-documentacion-nuxt-ui-y-antecedentes.md), [fuentes de la migración original](../01-flutter-cursos-y-documentacion.md)

## Necesidad de consulta

Pasar la web copiada de Tailwind propio a Nuxt UI, con un espacio de trabajo tipo panel (lateral + contenido) y las primeras páginas de datos de la API: listar, crear y editar proyectos, y subir un CSV de catálogo. Hacía falta saber cómo enseña el curso a instalar Nuxt UI, armar el panel, cambiar el tema, pedir datos, mostrar tablas y validar formularios.

## Localización verificable

Biblioteca: `/Users/benji/Documents/chrome-extencions/trancripciones`. Ruta relativa del curso: `Nuxt/Nuxt Full Stack/`. Se buscó con `buscar-aprendizaje-en-cursos` (consultas «Nuxt UI componentes», «UTable», «UForm validación», «dashboard sidebar», «useFetch», «useState»); todas las coincidencias fuertes estaban en este curso. Se excluyeron las guías `Reconstrucción guiada`. Localizadores leídos con `nl -ba`; las líneas son párrafos largos y se indica una frase de búsqueda.

| ID  | Lección (sección)                                                                                               | Líneas y frase de búsqueda                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | 38. NuxtUI - Instalación y configuración (Sección 4)                                                            | L21 «`@nuxt/ui`» en `modules`; L25–29 «envolvamos nuestra aplicación en este elemento… "UApp"»                                                                       |
| F2  | 39. NuxtUI - Layout y errores (Sección 4)                                                                       | L23 «Solamente es el "UError"»; L31 «tema "light" y "dark"»                                                                                                          |
| F3  | 46. Cambiar el tema global (Sección 4)                                                                          | L15 «"@theme"… "--color-primary"»; L17 «variable propia de NuxtUI»; L19–25 «"app.config"… "neutral"… "zinc"»                                                         |
| F4  | 48. Diseño del panel administrativo (Sección 4)                                                                 | L17–19 «"UDashboardGroup"… "storageKey"»; L21–23 «"Sidebar"»; L27–31 «"UDashboardPanel"… "DashboardNavbar"… el "slot"»                                               |
| F5  | 69. Products Composable - Personalizado (Sección 6)                                                             | L15 «carpeta que se llama "composables"»; L21 «la "data", el "error", el "status"»; L39 «regresarlo… detonar manualmente»                                            |
| F6  | 72. NuxtUI Table - TanStack Table (Sección 6) y 95. Componentes dinámicos de Nuxt en TanStack Table (Sección 8) | 72: L15 «la función "h" y luego el "resolveComponent"»; L29–37 «"accessorKey"… "cell"». 95: L17 «"UTable" es básicamente una forma de trabajar con "TanStack Table"» |
| F7  | 75. useFetch y useLazyFetch (Sección 6)                                                                         | L29 «hasta que tenga la respuesta»; L33–35 «"lazy" en "true"»                                                                                                        |
| F8  | 98. Composable - Control de creación y actualización y 99. Pantalla de edición y creación (Sección 8)           | 98: L21–23 «"createOrUpdate"». 99: L15 «"navigateTo"… al 404»; L21 «"submit.prevent"»; L25–29 «"useState"… "ref"… "structuredClone()"»                               |
| F9  | 100. Validar campos del formulario (Sección 8)                                                                  | L15–17 «"from 'zod'"… "productSchema"»; L23–25 «"checkValidations"»; L27–29 «"watch"… "deep"»                                                                        |
| F10 | 103. Mostrar mensaje de actualización (Sección 8)                                                               | L13 «"useToast()" que ya es un composable puesto de manera global por Nuxt UI»                                                                                       |
| F11 | 113. Enviar y recibir archivos (Sección 9)                                                                      | L29–33 «el "append" de los archivos… van a viajar a nuestro "formData"»                                                                                              |

## Evidencia

- **F1:** Nuxt UI es opcional, pero el curso lo usa por sus componentes. Se registra el módulo y se envuelve la app en `UApp`:

  > esto es necesario porque algunos "tooltips", algunos componentes requieren

  (L29; la frase continúa explicando que necesitan el proveedor).

- **F2:** `error.vue` usa `UError`; el modo claro/oscuro llega con Nuxt UI.
- **F3:** dos vías para el tema: variables en `@theme` del CSS (incluida la propia de Nuxt UI para el primario) y `app/app.config.ts` con `ui.colors.primary` y `neutral` (`indigo`, `zinc` en la clase).
- **F4:** el panel se arma con `UDashboardGroup` (con `storage`/`storageKey` para recordar el lateral), un componente `Sidebar` con `UDashboardSidebar`, y `UDashboardPanel` con `UDashboardNavbar` y el `slot` de la página.
- **F5:** la lógica de datos reutilizable va en `composables/`; el composable devuelve datos y también `error`, `status` y `refresh` para poder volver a pedir.
- **F6:** `UTable` es TanStack Table con estilo Nuxt UI: `columns` con `accessorKey`, `header` y `cell`; las celdas con componentes se crean con `h()` y `resolveComponent`.
- **F7:** `await useFetch` bloquea el render del servidor hasta tener respuesta; `lazy: true` (o `useLazyFetch`) deja pintar antes y mostrar la carga.
- **F8:** creación y edición comparten pantalla y un composable con `createOrUpdate`; un recurso inexistente navega fuera; el formulario se copia a un `ref` local para editar sin tocar el original.
- **F9:** validación con un esquema Zod y una función manual `checkValidations` que llena `fieldErrors`, más un `watch` con `deep` para revalidar mientras se escribe. El instructor dice que la función la generó con ChatGPT y la corrigió.
- **F10:** `useToast()` de Nuxt UI para avisar del guardado.
- **F11:** los archivos viajan en un `FormData` con `append`.

## Interpretación y límites

- El curso trabaja con su propio servidor Nuxt (`/api/...`) y sesión de servidor. Aquí la API es Nest externa y el token Descope solo existe en el navegador, así que `useFetch` con SSR (F7) no aplica tal cual: la carga debe correr en el cliente después de la sesión.
- El curso no enseña el diseño Focus, Descope ni la API de esta app; esas partes son adaptación o propuesta propia.
- F9 resuelve a mano lo que `UForm` ya hace con un esquema (errores por campo y validación al escribir). El curso no usa `UForm`; usarlo es decisión propia apoyada en la [documentación](02-documentacion-nuxt-ui-y-antecedentes.md).
- No se reconstruyó código de estas lecciones: se usan como principios (estructura del panel, composables, columnas, esquema), no para copiar un fragmento concreto.

## Aplicación en el proyecto

Ver la relación necesidad → fuente → decisión en el [plan ui 01](../../plans/ui/01-plan-nuxt-ui-focus-proyectos-e-importaciones.md) y la aplicación real en la bitácora ([ui 01](../../../bitacora-construccion/ui/01-nuxt-ui-y-tema-focus.md), [proyectos](../../../bitacora-construccion/feature/projects&catalog-import/01-paginas-de-proyectos.md), [importaciones](../../../bitacora-construccion/feature/projects&catalog-import/02-subir-y-seguir-importaciones.md)).

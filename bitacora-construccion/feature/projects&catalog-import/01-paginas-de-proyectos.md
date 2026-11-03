# 01 — Páginas de proyectos

Fecha de creación: 2026-11-03
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 2 del [plan ui 01](../../../docs/plans/ui/01-plan-nuxt-ui-focus-proyectos-e-importaciones.md)
Relacionada con: [contrato API](../../../docs/fonts/feature/projects&catalog-import/01-contrato-api-proyectos-e-importaciones.md), [curso](../../../docs/fonts/ui/01-curso-nuxt-full-stack-nuxt-ui.md), [ui 01](../../ui/01-nuxt-ui-y-tema-focus.md)
Revisión de partida: `57752dc`

## Necesidad y punto de partida

Primeras páginas con datos de la API: listar, crear, ver, editar y eliminar proyectos. No existía cliente HTTP general; solo el servicio de perfil.

## Evidencia y decisiones

| Decisión                                                     | Evidencia                                     | Aplicación                                                                                                                                                                                                            |
| ------------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cliente con token, un reintento tras 401 y mensaje de la API | Original `profile.ts`; D4 `api-client.ts`; A8 | [api-client.ts](../../../app/services/api-client.ts) `createApiClient`, `toApiFailure` (usa `message.es` e `issues`), `invalidResponse`                                                                               |
| Respuestas comprobadas, sin `as`                             | A2, A3; skill de código legible (regla 3)     | [types/projects.ts](../../../app/types/projects.ts) `isProject`, `isPageInfo`; [utils/guards.ts](../../../app/utils/guards.ts)                                                                                        |
| Composable que devuelve datos, estado, error y `refresh`     | F5 L15–21, L39                                | [useProjects.ts](../../../app/composables/useProjects.ts) `useProjects`, `useProject`                                                                                                                                 |
| Carga solo en cliente                                        | F7 L29–35 (interpretación), A1                | `useAsyncData(..., { server: false })`: el token no existe en el servidor. La clave lleva el id del usuario para no mezclar cuentas                                                                                   |
| Un formulario para crear y editar                            | F8 (98 L21–23, 99 L21–29)                     | [ProjectForm.vue](../../../app/components/ProjectForm.vue): `save` elige `create` o `update`; `initialState` copia el proyecto a un estado local                                                                      |
| Validación con esquema Zod                                   | F9 L15–29 (alternativa manual), D1            | `UForm` + `projectSchema` (mismas reglas que `CreateProjectDto`, A3). Sustituye a `checkValidations` + `watch deep` del curso. Los `issues` de la API se pasan a `form.setErrors`                                     |
| Aviso al guardar                                             | F10 L13                                       | `useToast` en guardar y eliminar                                                                                                                                                                                      |
| Lista estilo Focus                                           | D3                                            | [ProjectRow.vue](../../../app/components/ProjectRow.vue): círculo de estado, nombre y detalle; [pages/projects/index.vue](../../../app/pages/projects/index.vue) con filtro `?estado=` desde las tarjetas del lateral |
| Eliminar con confirmación                                    | A5                                            | `UModal` en [pages/projects/[id]/index.vue](../../../app/pages/projects/[id]/index.vue) `deleteProject`                                                                                                               |

### Ajustes al escribir el código

- **404 sin navegar fuera:** el curso navega a la página 404 (F8, 99 L15). Aquí se muestra el mensaje de la API con «Reintentar» y «Volver a proyectos», para no perder la causa.
- **Lista limitada a 100** (máximo de la API, A4). Si hay más se avisa; la paginación queda pendiente porque no se espera ese volumen ahora.
- **Proyecto sin configurar:** la API los admite (`configurationStatus: 'required'`, campos `null`). El detalle muestra un aviso con «Configurar», y el formulario de edición los exige completos.
- **Parámetro de ruta:** las rutas tipadas de Nuxt no están activadas; se usa `String(route.params.id)` porque `[id]` es un solo segmento.

## Comprobación

| Comprobación                                            | Resultado                   |
| ------------------------------------------------------- | --------------------------- |
| `pnpm typecheck` (antes y después de las importaciones) | Sin errores                 |
| `pnpm lint`, `pnpm format:check`, `pnpm build`          | Sin errores; build completo |

**No verificado:** ninguna petición real a la API. Exige la API en el puerto 8080 y una sesión Descope; queda para el usuario: crear un proyecto, verlo en el lateral, editarlo, provocar un error de validación (por ejemplo país `XX`) y eliminarlo.

## Consecuencias y continuidad

Los servicios y composables son el patrón para los siguientes módulos (reglas, evaluaciones, exportaciones, feeds). Siguiente: [importaciones](02-subir-y-seguir-importaciones.md).

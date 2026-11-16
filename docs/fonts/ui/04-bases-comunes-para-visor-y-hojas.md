# 04 — Bases comunes para el visor y las hojas (I5) y mapa final

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: código de la web, transcripciones locales (originales), paquetes instalados, registro de npm y documentación oficial de Nuxt.  
Relacionada con: [plan de investigación ui 02](../../plans/ui/02-plan-investigacion-visor-y-hojas.md), [ficha ui 03](03-ark-ui-tema-y-organizacion-por-funcion.md), [contrato del visor](../feature/feed-viewer/01-contrato-api-visor-y-diagnostico.md), [interfaz del visor](../feature/feed-viewer/02-cursos-y-documentacion-interfaz-del-visor.md), [contrato de hojas](../feature/worksheets/01-contrato-api-hojas.md), [tabla editable](../feature/worksheets/02-tabla-editable-cursos-y-documentacion.md), [23 — GraphQL para Nuxt](../../../../docs-diagrams/23-graphql-nest-para-fastapi-y-nuxt.md).

## Necesidad

Hay piezas que necesitan las dos puntas y conviene hacer **una vez, antes de la primera pantalla**: el cliente HTTP, los permisos visibles, la página en la URL y, sobre todo, **pruebas automáticas**, que la web no tiene.

## Evidencia (E, F, C)

| ID  | Fuente                                                                    | Qué se observa                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `app/services/api-client.ts`                                              | Solo devuelve el cuerpo; no envía cabeceras propias ni lee las de respuesta                                                                                                                                                                                                                                                                                                                               |
| E2  | ofetch 1.5.1, `shared/ofetch.BbrTaNPp.d.ts:5`                             | `$fetch.raw(...)` devuelve la respuesta entera (`headers` y `_data`): sirve para leer `ETag`                                                                                                                                                                                                                                                                                                              |
| E3  | Contrato de hojas, E16                                                    | `If-Match` al guardar (428/412), `ETag` en la respuesta e `Idempotency-Key` al aplicar                                                                                                                                                                                                                                                                                                                    |
| E4  | Ficha ui 03, E9; contrato de hojas, E10                                   | Permisos: `access.permissions` en el detalle de la organización y `capabilities { write, approve }` en cada hoja                                                                                                                                                                                                                                                                                          |
| E5  | `package.json`                                                            | Sin Vitest, sin Playwright y sin script `test`. Lo que se comprobaba hasta ahora: `typecheck`, `lint`, Prettier y el uso a mano en el navegador (bitácoras de la web)                                                                                                                                                                                                                                     |
| E6  | Tres composables leen la página de la URL a mano                          | `useEvaluationReport`, el listado de evaluaciones y el futuro visor                                                                                                                                                                                                                                                                                                                                       |
| F1  | npm                                                                       | `vitest` 5.1.0 (2026-11-02), `@nuxt/test-utils` 4.4.0 (2026-11-08; admite `vitest ^4 \|\| ^5`, `happy-dom`, `@vue/test-utils ^2.4.2` y `@playwright/test`), `@vue/test-utils` 2.5.1, `happy-dom` 21.0.4, `@playwright/test` 1.65.1 (2026-11-13)                                                                                                                                                           |
| F2  | Nuxt, _Testing_ (`nuxt.com/docs/4.x/getting-started/testing`)             | Instalar `@nuxt/test-utils vitest @vue/test-utils happy-dom playwright-core`. Proyectos de Vitest: `unit` (entorno `node`) y `nuxt` (`defineVitestProject`). `mountSuspended` monta un componente «within the Nuxt environment», con plugins; `mockNuxtImport` simula una importación automática; `registerEndpoint` crea un _endpoint_ de prueba. Para E2E, Playwright con `@nuxt/test-utils/playwright` |
| C1  | Vue con Pinia y Testing, `Sección 6…/67. Configuración de Vitest.md`, L19 | Vitest es «muy similar y compatible con Jest» (lo que ya se usa en Nest) y va sobre Vite, como Nuxt                                                                                                                                                                                                                                                                                                       |
| C2  | Misma sección, `73. Probar composables - useCounter.md`, L13 y L17        | Empezar «por lo más atómico»; los _composables_ son funciones y se prueban sin montar nada                                                                                                                                                                                                                                                                                                                |
| C3  | Misma sección, `82. Mock del Fetch API.md`, L13–L19                       | Sustituir `fetch` por una función de prueba con su respuesta simulada                                                                                                                                                                                                                                                                                                                                     |
| C4  | `Sección 8…/108. Flush Promises.md`, L13–L17                              | Comprobar los valores reactivos que devuelve un _composable_ (`.value`) tras resolver sus promesas                                                                                                                                                                                                                                                                                                        |

## Interpretación

1. **El cliente HTTP crece una vez** (E1–E3): `request` admite `headers` (para `If-Match` e `Idempotency-Key`) y una variante que devuelve el cuerpo **y** el `ETag` (con `$fetch.raw`). El resto del cliente (token, reintento ante 401 y errores bilingües) no cambia. Es la única pieza de las hojas que también toca a todas las pantallas, así que se prueba primero.
2. **Pruebas antes de la primera pantalla nueva** (E5, F1, F2, C1–C4). Por orden:
   - **Unidad** (`node`): funciones puras de `utils/` (formato de precios, cortar el TSV pegado, convertir filtros) y los predicados `isX` de `types/`.
   - **Servicios** con `$fetch` simulado (C3): rutas, consultas y la lectura de respuestas inválidas.
   - **Composables y componentes** en el entorno `nuxt` con `mountSuspended` (F2, C2, C4): página y búsqueda en la URL, teclado de la tabla (Intro, F2 y Escape) y foco del panel lateral.
   - **E2E con Playwright** después, contra Nest local con datos de prueba, para los recorridos de aceptación de los documentos 22 y 16.

   Se añaden los _scripts_ `test` y `test:e2e`, y se incluye `test` en la verificación de cada etapa, como ya se hace en Nest y FastAPI.

3. **Un composable común para la página en la URL** (E6; C5 de la ficha feed-viewer 02): `usePageInUrl` con página, búsqueda y su `router.push`. El informe existente se pasa a él cuando se trabaje su flujo.
4. **Permisos visibles** (E4): `capabilities` en hojas; en el visor, solo «Probar reglas» depende del rol. Los dos salen de `GET /projects/:id/access` (rol, permisos y `organizationId`), con el 403 como red de seguridad.
5. **GraphQL (C7) todavía no.** Las 85 operaciones para Nuxt aún no existen (23). Se usa REST, y los servicios aíslan el transporte: cuando C7 exista, solo cambian `services/`, no las pantallas.

## Propuesta de etapas de construcción (para escribir los planes)

**Bases (una vez):**

- **B1.** Pruebas: Vitest, `@nuxt/test-utils` y `happy-dom`, con los proyectos `unit` y `nuxt`; primeras pruebas de lo que ya existe (`api-client`, `useEvaluationReport`).
- **B2.** Ark UI 5.40.0 con el tema de Nuxt UI y los primeros envoltorios `components/ui/` que pida el visor (`AppDialog`, `AppTabs`, `AppPagination` y `AppAccordion`).
- **B3.** `usePageInUrl` y cabeceras en `api-client`.

**Post (visor, la API ya está):**

- **V-web 1.** Tabla de productos de una exportación y de una versión, con búsqueda, paginación y estados 410/503.
- **V-web 2.** Ficha lateral y estado de la entrega.
- **V-web 3.** «Requiere atención».
- **V-web 4.** Comparar con la versión vigente.
- **V-web 5.** Probar reglas sin publicar.

**Pre (hojas):**

- **H-web 1.** Libros y hojas: listar, crear, renombrar, archivar, duplicar e historial.
- **H-web 2.** Importar con vista previa, mapeo y plantillas; exportar; puente con el catálogo.
- **H-web 3.** Ver las filas (solo lectura) con filtros, orden, vistas guardadas y «cargar más».
- **H-web 4 (E7.0).** Prueba de la tabla editable: teclado, editores por tipo, pegado y autoguardado, con la medición del volumen.
- **H-web 5.** Borradores: diferencias, enviar, aprobar, aplicar, conflictos y revertir.

H-web 1–3 no necesitan la tabla editable y se pueden hacer antes que H-web 4. La H-web 1 saca `organizationId` de `GET /projects/:id/access` (corregido el 2026-11-14: no hace falta tocar Nest).

**Planes escritos (2026-11-14):** la propuesta se concretó en el [plan del visor](../../plans/feature/feed-viewer/01-plan-visor-y-diagnostico.md) (V0–V5; V0 incluye B2 y el resto de B3), el [plan 01 de hojas](../../plans/feature/worksheets/01-plan-libros-hojas-importar-y-exportar.md) (HW-0 a HW-5) y el [plan 02 de hojas](../../plans/feature/worksheets/02-plan-tabla-editable-y-borradores.md) (TE-0 a TE-7). B1 y parte de B3 ya están hechos ([bitácora ui 02](../../../bitacora-construccion/ui/02-pruebas-y-cliente-http.md)).

## Mapa final necesidad → fuentes → decisión pendiente

| Necesidad                     | Fuentes           | Decisión pendiente                                       |
| ----------------------------- | ----------------- | -------------------------------------------------------- |
| Pruebas de la web             | E5, F1, F2, C1–C4 | B1 antes de la primera pantalla nueva                    |
| Cabeceras y `ETag`            | E1–E3             | Ampliar `api-client` (B3), con pruebas                   |
| Página en la URL              | E6                | `usePageInUrl` (B3)                                      |
| Permisos visibles             | E4                | `capabilities` y `GET projects/:id/access`; 403 como red |
| Transporte                    | 23                | REST ahora; GraphQL solo en `services/` cuando exista C7 |
| `organizationId` del proyecto | Contrato de hojas | `GET projects/:id/access` (ya existe en Nest)            |

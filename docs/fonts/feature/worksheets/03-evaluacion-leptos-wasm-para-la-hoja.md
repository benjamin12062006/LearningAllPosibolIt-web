# 03 — Evaluación: Leptos y WebAssembly para la hoja de cálculo

Fecha de creación: 2026-11-14  
Fecha de consulta: 2026-11-14  
Tipo de fuente: prototipo local `prueba-web-leptos` (solo lectura), motor de fórmulas de la API (código y medición) y documentos de diseño.  
Estado: Evaluación cerrada; recomendación al final.  
Relacionada con: [tabla editable (02)](02-tabla-editable-cursos-y-documentacion.md), [contrato de hojas (01)](01-contrato-api-hojas.md), [16 — tabla y cálculos](../../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md#tabla-de-hojas-y-cálculos), [ficha ui 03 (Ark UI)](../../ui/03-ark-ui-tema-y-organizacion-por-funcion.md).

## Pregunta del usuario

¿Ayudaría hacer «nuestro Excel» de la web, o la parte que calcula, con Leptos y WebAssembly, como en `prueba-web-leptos`? ¿Es factible conociendo nuestra API y cómo funciona?

## Qué demuestra el prototipo (E)

| ID  | Dónde                         | Qué se observa                                                                                                                                                                                                   |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `prueba-web-leptos/README.md` | Una **isla Leptos** (CSR) dentro de una página Nuxt: `ClientOnly` → `LeptosCard.vue` → módulo WASM. Vue y Rust se comunican por `set_title()` y un _callback_; Leptos es el único dueño del DOM de su contenedor |
| E2  | Mismo README                  | Construcción: `cargo build --target wasm32-unknown-unknown` + `wasm-bindgen` (instalado en `.tools/`). En producción solo va `.output/`. **Sin HMR de Rust**: tras cada cambio, `pnpm wasm:build` y recargar     |
| E3  | Mismo README                  | El CSS es global, porque los atributos `scoped` de Vue no llegan al DOM que genera Rust. La tarjeta no se renderiza en el servidor                                                                               |
| E4  | Mismo README                  | Hay dos Rust instalados en este Mac (Homebrew 1.87 sin destino WASM y 1.96.1 con él): fuente de errores de entorno                                                                                               |
| E5  | `wasm/pkg/` (`stat`)          | Una tarjeta con un título y un contador: **217 KB de `.wasm`** (unos 70 KB comprimido con gzip) más 31 KB de JS de enlace                                                                                        |
| E6  | `tests/integration.spec.ts`   | 5 pruebas Playwright: puente en las dos direcciones, montar y desmontar, cancelar la descarga, reintento y móvil. Funciona y está bien probado como **laboratorio**                                              |

## Lo que la hoja necesita (H)

| ID  | Fuente                          | Requisito                                                                                                                                                                              |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | 16, «Componentes y tema»        | Ark UI para Vue como **única** biblioteca de controles, con el tema de Nuxt UI                                                                                                         |
| H2  | 16, «Tabla de hojas y cálculos» | **Nest conserva la validación y los cálculos oficiales.** Las previsualizaciones se marcan como tales y se confirman con el servidor. Medir antes de llevar un cálculo a un Web Worker |
| H3  | Ficha worksheets 02             | Patrón «grid» de WAI-ARIA, editores por tipo, pegado, autoguardado del borrador y decimales exactos como texto                                                                         |
| H4  | Contrato de hojas, E11          | Hasta 5.000 filas y 200 columnas por hoja                                                                                                                                              |

## El motor de cálculo actual (M)

| ID  | Fuente                                                                                       | Qué se observa                                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | API, `src/worksheets/formula.ts`, `exact-decimal.ts`, `row-evaluation.ts` y `cell-values.ts` | **Unas 490 líneas de TypeScript puro**: solo se importan entre ellas, sin Nest ni base de datos. Árbol de fórmulas versionado (`calc-v1`), decimales exactos con racionales, un solo redondeo al final y sin `eval`                                                                                   |
| M2  | Medición (2026-11-14), script en la carpeta temporal con el motor compilado de `.test-build` | **5.000 filas × 20 columnas, 5 calculadas** (una de profundidad 5 y otra que usa otra calculada): **mediana de 43,8 ms la hoja entera** (7 pasadas, entre 43,2 y 63,1 ms) en Node 26.9 (V8, el motor de Chrome). Una fila sale a unos **0,009 ms**. Resultado de ejemplo: `total 237.98`, `iva 49.98` |

## Opciones

| Opción                                                     | Qué sería                                                                           | A favor                                                                                                                                | En contra                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. La tabla entera en Leptos** (isla, como el prototipo) | Rust dibuja la tabla y maneja el teclado; Vue la monta                              | Rendimiento de Rust en el DOM                                                                                                          | Rompe H1: dos sistemas de componentes, sin Ark ni su accesibilidad, CSS global (E3) y sin el tema. Puente Vue ↔ Rust para cada evento (selección, guardado, chat, foco). Sin HMR (E2), una herramienta más en la construcción (E4) y pruebas en dos lenguajes. Los editores, el pegado y el autoguardado habría que reescribirlos en Rust |
| **B. Solo el motor en Rust/WASM**                          | La tabla en Vue; los cálculos de vista previa en WASM                               | La interfaz sigue siendo Vue y Ark                                                                                                     | **Segunda implementación del motor**: la vista previa podría no coincidir con Nest (H2). 70 KB o más por algo que JS ya hace en 44 ms (M2). Mantener los dos motores iguales exige pruebas cruzadas                                                                                                                                       |
| **C. Reutilizar el motor TS de Nest en el navegador**      | Las mismas ~490 líneas (M1), compartidas con la web, para la vista previa al editar | **El mismo código que el servidor**: la vista previa da lo mismo que el cálculo oficial. Sin herramientas nuevas. Rápido de sobra (M2) | Hay que decidir cómo compartirlo (paquete del espacio de trabajo o copia versionada por `calc-v1`). Nest sigue siendo la referencia                                                                                                                                                                                                       |

## Interpretación y recomendación

1. **Para la interfaz de la hoja, Leptos no ayuda; complica.** Va contra la decisión vigente de Ark UI (H1) y obliga a reescribir en Rust lo que ya está diseñado en Vue (H3), con peor integración (CSS, tema, foco y pruebas). El prototipo demuestra que **se puede** incrustar Leptos, pero no que convenga para una tabla editable con chat, autoguardado y accesibilidad.
2. **Para los cálculos, WebAssembly no hace falta.** El caso más pesado que admite la API, una hoja entera de 5.000 filas, se calcula en unos 44 ms en JavaScript (M2), y al editar se recalcula una fila (0,009 ms). WASM tiene sentido con millones de celdas o cálculos numéricos intensivos, no con estos límites.
3. **Lo que sí aporta valor es la opción C:** usar en la web **el mismo motor TypeScript** que Nest para la vista previa mientras se edita. Así el «Excel» responde al instante y no hay riesgo de que la web calcule distinto que el servidor. Nest sigue mandando: la vista previa se marca como tal y se confirma al guardar el borrador (H2).
4. **Cuándo volver a mirar Leptos o WASM:** si en el futuro se suben mucho los límites (por ejemplo, 100.000 filas con cálculo local), si aparecen cálculos pesados que JS no pueda hacer a tiempo (medido, como en M2), o si se quiere un componente aislado y sin interacción con el resto (un gráfico o un visor). Para eso el prototipo queda como referencia útil.

## Mapa necesidad → fuentes → decisión pendiente

| Necesidad                          | Fuentes       | Decisión pendiente                                                                      |
| ---------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| Interfaz de la hoja                | H1, H3, E1–E4 | Vue con Ark UI (no Leptos)                                                              |
| Vista previa de fórmulas al editar | M1, M2, H2    | Motor TS de Nest compartido; decidir cómo compartirlo en E7.0                           |
| Rendimiento                        | M2            | No hace falta WASM ni un Web Worker con los límites actuales; volver a medir si cambian |

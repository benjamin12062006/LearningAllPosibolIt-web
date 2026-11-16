# 02 — Plan: tabla editable, motor de cálculo compartido y borradores («pre», E7.0)

Fecha de creación: 2026-11-14  
Estado: Plan. Se revisará cuando la API esté cerrada (C7, GraphQL).  
Revisión de partida: rama `feature/pruebas-y-cliente-http`.  
Relacionada con: [16 — tabla central](../../../../../docs-diagrams/16-nuxt-tabla-central-chat-y-contratos.md), [13 — revisiones y conflictos](../../../../../docs-diagrams/13-revisiones-aprobaciones-y-conflictos.md), [contrato de hojas](../../../fonts/feature/worksheets/01-contrato-api-hojas.md), [tabla editable](../../../fonts/feature/worksheets/02-tabla-editable-cursos-y-documentacion.md), [evaluación de Leptos](../../../fonts/feature/worksheets/03-evaluacion-leptos-wasm-para-la-hoja.md), [motor compartido](../../../fonts/feature/worksheets/04-motor-de-calculo-compartido.md), [rendimiento](../../../fonts/ui/05-rendimiento-vue-nuxt-y-typescript.md), [plan 01 de hojas](01-plan-libros-hojas-importar-y-exportar.md).

## Objetivo

La prueba E7.0 del documento 16 convertida en producto: una **tabla editable accesible**, que calcula **al instante con el mismo motor que Nest**, guarda el **borrador** sin perder cambios y lleva el cambio hasta su **aplicación** con revisión humana. Con el mejor rendimiento posible de Vue y TypeScript, medido, y con código legible.

## Decisiones

| ID   | Decisión                                                                                                                                                                                                                                                                                                             | Respaldo                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| TE1  | **Vue y Ark UI, no Leptos ni WASM.**                                                                                                                                                                                                                                                                                 | Evaluación 03: opciones A y B descartadas; M2                        |
| TE2  | **Motor compartido:** copia exacta de `exact-decimal.ts`, `formula.ts`, `cell-values.ts` y `row-evaluation.ts` en `app/features/worksheets/calc-engine/`, con dos archivos de tipos de los mismos nombres. `scripts/check-calc-engine.mjs` compara con Nest, y unas pruebas con casos fijos (división por cero, redondeo y vacíos) | Motor compartido: opción C, interpretaciones 1 y 2                   |
| TE3  | **Vista previa al editar, fila a fila:** al cambiar una celda se ejecuta `evaluateRow` solo en esa fila; la hoja entera al abrirla o al cambiar el esquema. Lo calculado se marca como vista previa; manda Nest                                                                                                      | Motor compartido: M2, M6 e interpretaciones 3 y 4; 16                |
| TE4  | **`role="grid"`** con un solo elemento en la tabulación y foco gestionado: flechas, Inicio/Fin, Ctrl+Inicio/Fin, RePág/AvPág, Intro o F2 para editar, Escape para cancelar y deshacer. `aria-readonly` sin permiso; `aria-rowcount` y `aria-rowindex` si se virtualiza                                               | Tabla editable: F1 e interpretaciones 1 y 2                          |
| TE5  | **Editores por tipo** solo en la celda activa: `Editable` (`activationMode: "none"`, `submitMode: "enter"`), `NumberInput` con el valor como texto (decimales exactos), `Checkbox`, `Select` y `DatePicker`. Un `CellEditor` por tipo con `modelValue` y `error`                                                     | Tabla editable: F3–F5, C2 e interpretaciones 2 y 3                   |
| TE6  | **Rendimiento:** filas en `shallowRef` y sustituidas al editar; celdas como HTML; props booleanas (`isActive`, `isSelected`); `v-memo` por fila con su versión y su estado; mapas del esquema creados una vez; `computed` estables para la selección                                                                 | Ficha ui 05: F1–F5 y «TypeScript para el rendimiento»                |
| TE7  | **Virtualizar solo si se mide.** Con la medición de HW-5 (5.000 filas): si dibujar o desplazarse produce tareas largas (≥ 50 ms), TanStack Virtual con `aria-rowcount`; si no, sin virtualizar. Web Worker para el motor solo si `evaluateRow` pasa de 50 ms                                                         | Ficha ui 05: F5, F9; motor compartido, interpretación 3              |
| TE8  | **Pegado** desde Excel o Sheets: texto separado por tabuladores y saltos de línea → `set_cell` desde la celda activa, recortado a 1.000 operaciones con aviso                                                                                                                                                        | Tabla editable: F2 e interpretación 6; contrato E14                  |
| TE9  | **Borrador con autoguardado:** búfer local de operaciones; guardar tras una pausa con `If-Match` (el `ETag` de `requestWithETag`); ante un 412, releer el borrador y avisar sin pisar nada; «guardado» y «aplicado» se muestran distintos; aviso al salir con cambios sin guardar                                    | Tabla editable: interpretaciones 7 y 8; contrato E16; bitácora ui 02 |
| TE10 | **Ciclo de revisión:** diferencias, enviar, aprobar o rechazar (`capabilities.approve`), aplicar con `Idempotency-Key` (una clave por intento de aplicar, reutilizada si se reintenta), conflicto con _rebase_ y propuesta para revertir. Después de aplicar se invalidan filas e historial                          | Contrato: E5, E15 y E16; tabla editable, C4                          |
| TE11 | **Cambios de esquema** en el mismo borrador: añadir, renombrar, borrar o cambiar el tipo de una columna, avisando de las fórmulas y mapeos que dependen de ella                                                                                                                                                      | Contrato E14; 16 (estado H4)                                         |

## Etapas

| Etapa    | Qué                                                                    | Comprobación prevista                                                                                                                                               |
| -------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TE-0** | Motor compartido: copia, tipos, _script_ de comprobación y casos fijos | `pnpm test` con los casos; el _script_ detecta un byte cambiado; `pnpm build` resuelve las importaciones `.js` del motor                                            |
| **TE-1** | `grid` de solo lectura con el teclado completo                         | Pruebas de teclado y foco (`mountSuspended`); lector de pantalla y zoom a mano                                                                                      |
| **TE-2** | Editores por tipo y vista previa fila a fila                           | Decimal `105.00` sin perder ceros ni precisión; calculada que cambia al editar su entrada; Escape deshace; **medición** del tiempo por edición                      |
| **TE-3** | Pegado acotado                                                         | Bloque de 3×3 desde Sheets; recorte con aviso al pasar de 1.000                                                                                                     |
| **TE-4** | Borrador y autoguardado                                                | `If-Match` y `ETag` correctos; 412 → releer sin pisar; aviso al salir; recargar la página y recuperar el borrador                                                   |
| **TE-5** | Revisión y aplicación                                                  | Enviar, aprobar (solo con permiso), aplicar con la misma clave en un reintento sin duplicar, conflicto y _rebase_, revertir; filas e historial frescos tras aplicar |
| **TE-6** | Cambios de esquema                                                     | Aviso de dependencias al borrar una columna usada en una fórmula                                                                                                    |
| **TE-7** | Volumen y decisión de virtualizar (TE7)                                | Medición con 5.000 filas: tiempo de dibujo, desplazamiento y tareas largas; decisión registrada en la bitácora                                                      |

En cada etapa: bitácora en `bitacora-construccion/feature/worksheets/`, pruebas, defectos a propósito, verificación completa y recorrido contra Nest local. Al terminar, el recorrido de aceptación del documento 16: crear hoja → pegar o importar → guardar borrador → recargar → ver la propuesta → validar → revisar → aplicar → historial → exportar, repetido con sesión caducada, sin red, recurso ajeno y conflicto.

## Diseño y sensación ([plan ui 04](../../ui/04-plan-sistema-visual-interaccion-y-mascota.md))

- Estados de la celda y del guardado según el §5 (celda activa con contorno primario, «Guardando…» → «Guardado ✓», sin saltos al confirmar).
- Marcas de color por autor (§1): **violeta discontinuo** para lo editado por la persona y sin guardar; **azul con icono** para lo que propone la IA; **rojo con icono** para los errores. Nunca solo color.
- Cambios de la IA en vivo (§7) y mascota (§8): las marcas y la mascota entran con M1 (eventos simulados) y se conectan en M2, cuando exista E6.4 con `target` en los eventos.
- Filas que entran o se reordenan con `<TransitionGroup>` (§6), compatible con `v-memo` y `shallowRef` (TE6).

## Límites

- El chat lateral y las propuestas del agente (`AssistantPanel`, `ProposalCard`) no entran: dependen de E6.2, E6.3a y E6.4.
- Sin cambios en Nest. Si el motor cambia allí (`calc-v2`), la comprobación de TE-0 lo detecta y se actualiza la copia.
- REST por ahora; revisar con C7.

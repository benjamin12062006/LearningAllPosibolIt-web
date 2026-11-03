# 01 — Revisiones de reglas en modo lectura

Fecha de creación: 2026-11-03
Estado: Implementado, pendiente de verificación con sesión real
Ámbito: incremento 1 del [plan 01 de reglas y evaluaciones](../../../docs/plans/feature/rulesets&evaluations/01-plan-paginas-reglas-y-evaluaciones.md)
Relacionada con: [contrato API](../../../docs/fonts/feature/rulesets&evaluations/01-contrato-api-reglas-y-evaluaciones.md), [curso](../../../docs/fonts/feature/rulesets&evaluations/02-curso-paginacion-maestro-detalle-y-modales.md), [páginas de proyectos](../projects&catalog-import/01-paginas-de-proyectos.md)
Revisión de partida: `59b2d9f`

## Necesidad y punto de partida

El usuario pidió empezar el plan. Este incremento solo lee: lista de revisiones de un proyecto y cada revisión con su mapeo y sus reglas. Crear revisiones es el incremento 2.

## Evidencia y decisiones

| Decisión                                          | Evidencia                                                 | Aplicación                                                                                                                                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipos fieles a la API y comprobados sin `as`      | B2, B3, B4                                                | [types/rulesets.ts](../../../app/types/rulesets.ts): listas de atributos, `Rule` como unión por `type`, `isRulesetVersion` e `isRule` (un tipo desconocido no es una regla)                                                      |
| `exclude_when` siempre trae `value`               | `rulesets.service.ts` de la API, `value: dto.value ?? ''` | El tipo usa `value: string`; con `is_empty` llega `''`                                                                                                                                                                           |
| Servicio y composables con el patrón de proyectos | B1; C4                                                    | [services/rulesets.ts](../../../app/services/rulesets.ts) `list` (límite 100) y `find`; [useRulesets.ts](../../../app/composables/useRulesets.ts) `useRulesets`, `useRuleset` con `server: false`                                |
| Secciones del proyecto como rutas                 | Plan, decisión «Dónde viven las páginas»                  | [ProjectNav.vue](../../../app/components/ProjectNav.vue): Catálogo y Reglas con `UNavigationMenu`; añadido a [pages/projects/[id]/index.vue](../../../app/pages/projects/[id]/index.vue)                                         |
| Lista de revisiones estilo Focus                  | D3 (ui 01)                                                | [rules/index.vue](../../../app/pages/projects/[id]/rules/index.vue) y [RulesetRow.vue](../../../app/components/RulesetRow.vue): número, datos mapeados, reglas, fecha y marca «La más reciente»                                  |
| Revisión legible                                  | B3, B4, motor `cleanAttributes`                           | [rules/[revision].vue](../../../app/pages/projects/[id]/rules/[revision].vue): los 8 datos en orden fijo con su columna o «Sin mapear» y «Obligatorio»; reglas numeradas con [describeRule](../../../app/utils/describe-rule.ts) |

### Ajustes al escribir el código

- **Texto de `clean_text`:** se escribió primero «Limpiar espacios». Al leer el motor (`cleanText` normaliza a NFC y junta cualquier tramo de espacios, incluidos los saltos de línea) se cambió a «Limpiar espacios y saltos de línea».
- **Revisión no numérica en la URL:** no se valida en la web; la API responde `404 RULESET_NOT_FOUND` y se muestra su mensaje.
- **Sin botón «Nueva revisión» todavía**, para no dejar un enlace a una página que no existe; llega con el incremento 2.

## Comprobación

| Comprobación                                                                                                                                       | Resultado                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`                                                                                                 | Sin errores                                                                                                                                       |
| `pnpm build`                                                                                                                                       | Completo en 9,73 s                                                                                                                                |
| `describeRule` empaquetado con esbuild y ejecutado con Node sobre 5 reglas (una y tres limpiezas, plantilla, exclusión con valor y con `is_empty`) | Frases correctas, por ejemplo «Limpiar espacios y saltos de línea en título, marca y estado del producto» y «Excluir si identificador está vacío» |

**No verificado:** las páginas en el navegador y las peticiones reales: exigen sesión Descope y la API. Recorrido para el usuario: crear una revisión con `requests/rulesets.http` de la API, abrir Reglas en el proyecto, ver la lista y abrir la revisión.

## Consecuencias y continuidad

Siguiente: incremento 2, crear una revisión (mapeo con las cabeceras del CSV y editor de reglas).

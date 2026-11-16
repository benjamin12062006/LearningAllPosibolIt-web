import { z } from 'zod';
import {
  CLEANABLE_ATTRIBUTES,
  EXCLUDE_OPERATORS,
  PRODUCT_ATTRIBUTES,
  isProductAttribute,
  type AttributeMapping,
  type ProductAttribute,
  type Rule,
  type RulesetInput,
  type RulesetVersion,
} from '../types/rulesets';

/**
 * Borrador de una revisión mientras se edita. El mapeo tiene una entrada por
 * atributo (`''` = sin mapear) para que no pueda repetirse ninguno; al guardar
 * se convierte en la lista de pares que espera la API.
 */
export type MappingDraft = Record<ProductAttribute, string>;

export interface RulesetDraft {
  mapping: MappingDraft;
  rules: Rule[];
}

/** Mismos límites que `RULESET_LIMITS` de la API. */
export const RULESET_LIMITS = {
  columnLength: 128,
  rules: 20,
  cleanAttributes: 5,
  templateLength: 300,
  conditionValueLength: 200,
} as const;

/**
 * Solo la forma de cada campo. La coherencia (referencias de las reglas y
 * obligatorios que faltan) la decide la API: sus errores se sitúan con
 * `issueLocation` en la fila que los causa.
 */
export const rulesetDraftSchema = z.object({
  mapping: z
    .record(
      z.enum(PRODUCT_ATTRIBUTES),
      z
        .string()
        .max(
          RULESET_LIMITS.columnLength,
          'El nombre de la columna es demasiado largo.',
        ),
    )
    .refine(hasSomeMapping, 'Mapea al menos un dato.'),
  rules: z
    .array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('clean_text'),
          attributes: z
            .array(z.enum(CLEANABLE_ATTRIBUTES))
            .min(1, 'Elige al menos un dato.')
            .max(RULESET_LIMITS.cleanAttributes),
        }),
        z.object({
          type: z.literal('build_title'),
          template: z
            .string()
            .trim()
            .min(1, 'Escribe cómo se forma el título.')
            .max(
              RULESET_LIMITS.templateLength,
              'Usa como máximo 300 caracteres.',
            ),
        }),
        z
          .object({
            type: z.literal('exclude_when'),
            attribute: z.enum(['id', ...PRODUCT_ATTRIBUTES]),
            operator: z.enum(EXCLUDE_OPERATORS),
            value: z
              .string()
              .max(
                RULESET_LIMITS.conditionValueLength,
                'Usa como máximo 200 caracteres.',
              ),
          })
          .refine(hasComparisonValue, {
            message: 'Escribe el valor con el que comparar.',
            path: ['value'],
          }),
      ]),
    )
    .max(RULESET_LIMITS.rules, 'Una revisión admite como máximo 20 reglas.'),
});

/**
 * Parte de una revisión guardada o de cero. `structuredClone` copia las reglas
 * para que editar el borrador no toque la revisión original (como en el curso).
 */
export function draftFromRuleset(base: RulesetVersion | null): RulesetDraft {
  const mapping = emptyMapping();
  for (const pair of base?.mapping ?? []) {
    mapping[pair.attribute] = pair.column;
  }
  return { mapping, rules: structuredClone(base?.rules ?? []) };
}

/** Pares en el orden del perfil; con `is_empty` el valor va vacío, como exige la API. */
export function inputFromDraft(draft: RulesetDraft): RulesetInput {
  const mapping: AttributeMapping[] = PRODUCT_ATTRIBUTES.filter(
    (attribute) => draft.mapping[attribute] !== '',
  ).map((attribute) => ({ attribute, column: draft.mapping[attribute] }));

  const rules = draft.rules.map((rule) => {
    if (rule.type === 'exclude_when' && rule.operator === 'is_empty') {
      return { ...rule, value: '' };
    }
    return rule;
  });

  return { mapping, rules };
}

/** Regla nueva de cada tipo, con valores que el usuario completa. */
export function newRule(type: Rule['type']): Rule {
  if (type === 'clean_text')
    return { type, attributes: ['title', 'description'] };
  if (type === 'build_title') return { type, template: '{brand} {title}' };
  return { type, attribute: 'availability', operator: 'equals', value: '' };
}

/**
 * Traduce el `field` de un error de la API al nombre de campo del formulario:
 * - `mapping.price` (coherencia) → la fila de ese atributo;
 * - `mapping.0.column` (DTO, índice del arreglo enviado) → la fila de ese par;
 * - `rules.2.<lo que sea>` → la tarjeta de la regla 2.
 * Devuelve `null` si el error no pertenece a una fila (se muestra en general).
 */
export function issueLocation(
  field: string,
  submittedMapping: readonly AttributeMapping[],
): string | null {
  const [section, position] = field.split('.');
  if (section === 'mapping') {
    if (isProductAttribute(position)) return `mapping.${position}`;
    const pair = submittedMapping[Number(position)];
    return pair ? `mapping.${pair.attribute}` : 'mapping';
  }
  if (section === 'rules') {
    return isIndex(position) ? `rules.${position}` : 'rules';
  }
  return null;
}

function emptyMapping(): MappingDraft {
  return { ...EMPTY_MAPPING };
}

/** El tipo `Record` obliga a listar todos los atributos del perfil. */
const EMPTY_MAPPING: MappingDraft = {
  title: '',
  description: '',
  link: '',
  image_link: '',
  price: '',
  availability: '',
  condition: '',
  brand: '',
};

function hasSomeMapping(mapping: Record<string, string>) {
  return Object.values(mapping).some((column) => column !== '');
}

/** `is_empty` no compara con nada; los demás operadores necesitan un valor. */
function hasComparisonValue(rule: { operator: string; value: string }) {
  return rule.operator === 'is_empty' || rule.value.length > 0;
}

function isIndex(value: string | undefined): value is string {
  return value !== undefined && /^\d+$/.test(value);
}

import {
  isDateString,
  isNonEmptyString,
  isRecord,
} from '../../../utils/guards';
import { isPageInfo, type PageInfo } from '../../projects/types/projects';

/**
 * Atributos del perfil `google_merchant` de la API
 * (`src/evaluations/engine/google-merchant.profile.ts`).
 */
export const PRODUCT_ATTRIBUTES = [
  'title',
  'description',
  'link',
  'image_link',
  'price',
  'availability',
  'condition',
  'brand',
] as const;

export type ProductAttribute = (typeof PRODUCT_ATTRIBUTES)[number];

/** `id` no se mapea (sale de la columna elegida al importar), pero una condición puede leerlo. */
export type ConditionAttribute = ProductAttribute | 'id';

export const REQUIRED_ATTRIBUTES: readonly ProductAttribute[] = [
  'title',
  'description',
  'link',
  'image_link',
  'price',
  'availability',
];

export const CLEANABLE_ATTRIBUTES = [
  'title',
  'description',
  'brand',
  'availability',
  'condition',
] as const;

export type CleanableAttribute = (typeof CLEANABLE_ATTRIBUTES)[number];

export const EXCLUDE_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'is_empty',
] as const;

export type ExcludeOperator = (typeof EXCLUDE_OPERATORS)[number];

export const ATTRIBUTE_LABELS: Record<ConditionAttribute, string> = {
  id: 'Identificador',
  title: 'Título',
  description: 'Descripción',
  link: 'Enlace',
  image_link: 'Imagen',
  price: 'Precio',
  availability: 'Disponibilidad',
  condition: 'Estado del producto',
  brand: 'Marca',
};

export const OPERATOR_LABELS: Record<ExcludeOperator, string> = {
  equals: 'es igual a',
  not_equals: 'no es igual a',
  contains: 'contiene',
  is_empty: 'está vacío',
};

export interface AttributeMapping {
  attribute: ProductAttribute;
  column: string;
}

export interface CleanTextRule {
  type: 'clean_text';
  attributes: CleanableAttribute[];
}

export interface BuildTitleRule {
  type: 'build_title';
  template: string;
}

export interface ExcludeWhenRule {
  type: 'exclude_when';
  attribute: ConditionAttribute;
  operator: ExcludeOperator;
  value: string;
}

/** Las reglas se aplican en el orden del arreglo. */
export type Rule = CleanTextRule | BuildTitleRule | ExcludeWhenRule;

/** Versión guardada: no cambia; corregir crea la revisión siguiente. */
export interface RulesetVersion {
  id: string;
  revision: number;
  mapping: AttributeMapping[];
  rules: Rule[];
  createdAt: string;
}

/** Body de `POST /projects/:id/rulesets`. */
export interface RulesetInput {
  mapping: AttributeMapping[];
  rules: Rule[];
}

export interface RulesetList {
  rulesets: RulesetVersion[];
  page: PageInfo;
}

/** Nombre legible de un atributo que llega como texto (por ejemplo, en un problema). */
export function attributeLabel(name: string) {
  const match = Object.entries(ATTRIBUTE_LABELS).find(([key]) => key === name);
  return match ? match[1] : name;
}

export function isRequiredAttribute(attribute: ProductAttribute) {
  return REQUIRED_ATTRIBUTES.includes(attribute);
}

export function isRulesetVersion(value: unknown): value is RulesetVersion {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    Number.isInteger(value.revision) &&
    Array.isArray(value.mapping) &&
    value.mapping.every(isAttributeMapping) &&
    Array.isArray(value.rules) &&
    value.rules.every(isRule) &&
    isDateString(value.createdAt)
  );
}

export function isRulesetList(value: unknown): value is RulesetList {
  return (
    isRecord(value) &&
    Array.isArray(value.rulesets) &&
    value.rulesets.every(isRulesetVersion) &&
    isPageInfo(value.page)
  );
}

function isAttributeMapping(value: unknown): value is AttributeMapping {
  return (
    isRecord(value) &&
    isProductAttribute(value.attribute) &&
    typeof value.column === 'string'
  );
}

/** Cada tipo de regla tiene sus propios campos; un tipo desconocido no es una regla. */
export function isRule(value: unknown): value is Rule {
  if (!isRecord(value)) return false;
  if (value.type === 'clean_text') {
    return (
      Array.isArray(value.attributes) &&
      value.attributes.every(isCleanableAttribute)
    );
  }
  if (value.type === 'build_title') {
    return typeof value.template === 'string';
  }
  if (value.type === 'exclude_when') {
    return (
      isConditionAttribute(value.attribute) &&
      isExcludeOperator(value.operator) &&
      typeof value.value === 'string'
    );
  }
  return false;
}

export function isProductAttribute(value: unknown): value is ProductAttribute {
  return PRODUCT_ATTRIBUTES.some((attribute) => attribute === value);
}

function isConditionAttribute(value: unknown): value is ConditionAttribute {
  return value === 'id' || isProductAttribute(value);
}

function isCleanableAttribute(value: unknown): value is CleanableAttribute {
  return CLEANABLE_ATTRIBUTES.some((attribute) => attribute === value);
}

function isExcludeOperator(value: unknown): value is ExcludeOperator {
  return EXCLUDE_OPERATORS.some((operator) => operator === value);
}

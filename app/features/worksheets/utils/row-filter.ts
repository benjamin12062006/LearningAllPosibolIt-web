import type {
  ColumnType,
  FilterOperator,
  FilterPredicate,
  RowFilter,
  WorksheetColumn,
} from '../types/worksheets';
import { parseCellInput } from './cell-text';

/**
 * El filtro de la tabla tal como lo arma la persona: una lista de condiciones
 * que se cumplen todas («y»). Nest admite árboles más profundos; la interfaz
 * ofrece la forma que cubre el uso diario y nunca manda algo que Nest rechace.
 */
export interface FilterCondition {
  columnId: string;
  operator: FilterOperator;
  /** Lo escrito; vacío en `is_null`. */
  text: string;
}

const ORDERED: FilterOperator[] = ['lt', 'lte', 'gt', 'gte'];

/** Qué operadores tienen sentido en cada tipo (`row-query.ts` de la API). */
export const OPERATORS_BY_TYPE: Record<ColumnType, FilterOperator[]> = {
  text: ['contains', 'equals', 'not_equals', 'is_null'],
  integer: ['equals', 'not_equals', ...ORDERED, 'is_null'],
  decimal: ['equals', 'not_equals', ...ORDERED, 'is_null'],
  date: ['equals', 'not_equals', ...ORDERED, 'is_null'],
  boolean: ['equals', 'not_equals', 'is_null'],
  selection: ['equals', 'not_equals', 'is_null'],
  // Su valor no está en la base: Nest no deja filtrar ni ordenar por ella.
  calculated: [],
};

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'es igual a',
  not_equals: 'no es igual a',
  contains: 'contiene',
  lt: 'es menor que',
  lte: 'es menor o igual que',
  gt: 'es mayor que',
  gte: 'es mayor o igual que',
  in: 'es uno de',
  is_null: 'está vacía',
};

/** Las columnas por las que se puede filtrar y ordenar. */
export function isQueryableColumn(column: WorksheetColumn) {
  return OPERATORS_BY_TYPE[column.type].length > 0;
}

/**
 * El filtro que entiende Nest. Una condición incompleta o con un valor que no
 * tiene la forma de su columna no se manda: la tabla no debe vaciarse por una
 * condición a medio escribir.
 */
export function buildFilter(
  conditions: readonly FilterCondition[],
  columns: readonly WorksheetColumn[],
): RowFilter | undefined {
  const predicates = conditions
    .map((condition) => toPredicate(condition, columns))
    .filter((predicate) => predicate !== null);
  if (predicates.length === 0) return undefined;
  if (predicates.length === 1) return predicates[0];
  return { and: predicates };
}

/**
 * Las condiciones de un filtro guardado, si tiene la forma que la interfaz
 * sabe editar (una condición o una lista «y»). `null` es un filtro avanzado:
 * se aplica tal cual, pero no se desmonta en condiciones.
 */
export function conditionsFromFilter(
  filter: RowFilter | undefined,
): FilterCondition[] | null {
  if (filter === undefined) return [];
  if ('or' in filter) return null;
  const nodes = 'and' in filter ? filter.and : [filter];

  const conditions: FilterCondition[] = [];
  for (const node of nodes) {
    if ('and' in node || 'or' in node || Array.isArray(node.value)) return null;
    conditions.push({
      columnId: node.column,
      operator: node.op,
      text: textOfValue(node.value),
    });
  }
  return conditions;
}

function toPredicate(
  condition: FilterCondition,
  columns: readonly WorksheetColumn[],
): FilterPredicate | null {
  const column = columns.find((item) => item.id === condition.columnId);
  if (!column) return null;
  if (!OPERATORS_BY_TYPE[column.type].includes(condition.operator)) return null;

  if (condition.operator === 'is_null') {
    return { column: column.id, op: 'is_null' };
  }
  const parsed = parseCellInput(column, condition.text);
  if (!parsed.ok || parsed.value === null) return null;
  return { column: column.id, op: condition.operator, value: parsed.value };
}

function textOfValue(value: string | boolean | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'sí' : 'no';
  return value;
}

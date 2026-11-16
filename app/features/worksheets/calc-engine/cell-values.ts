import type { ColumnType, SelectionOption } from './worksheet-columns.js';

/**
 * Forma canónica de cada tipo de celda (plan worksheets 02, R4). Entero y
 * decimal viajan como cadena para no perder dígitos; la fecha es una fecha
 * civil sin zona. La misma forma la exigen los filtros y la exigirá el
 * escritor de E4.
 */
const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Las mismas expresiones en sintaxis POSIX de PostgreSQL, para las consultas. */
export const SQL_PATTERNS = {
  decimal: '^-?[0-9]+(\\.[0-9]+)?$',
  date: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
} as const;

/** 8 KiB por celda de texto ([12], «Identidad y tipos de celda»). */
export const MAX_TEXT_LENGTH = 8192;

export type CellLiteral = string | boolean;

/** Lo que hace falta de una columna para validar un valor. */
export type ValueRules = Readonly<{
  type: ColumnType;
  options?: readonly SelectionOption[];
}>;

export type CellProblem = 'CELL_REQUIRED' | 'CELL_VALUE_INVALID';

/**
 * El valor tiene la forma canónica de la columna. Una calculada no guarda
 * valor (V6): nada es canónico para ella.
 */
export function isCanonicalValue(
  column: ValueRules,
  value: unknown,
): value is CellLiteral {
  switch (column.type) {
    case 'text':
      return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH;
    case 'integer':
      return typeof value === 'string' && INTEGER_PATTERN.test(value);
    case 'decimal':
      return typeof value === 'string' && DECIMAL_PATTERN.test(value);
    case 'date':
      return typeof value === 'string' && isCivilDate(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'selection':
      return (
        typeof value === 'string' &&
        (column.options ?? []).some((option) => option.id === value)
      );
    case 'calculated':
      return false;
  }
}

/**
 * Problema de una celda guardada (V7), o `null`. Una hoja libre admite datos
 * incompletos en borrador (H17): esto informa, no rechaza.
 */
export function cellProblem(
  column: ValueRules & Readonly<{ required: boolean }>,
  value: unknown,
): CellProblem | null {
  if (value === undefined || value === null) {
    return column.required ? 'CELL_REQUIRED' : null;
  }
  return isCanonicalValue(column, value) ? null : 'CELL_VALUE_INVALID';
}

/** `2026-02-30` tiene la forma, pero no existe: `Date` lo desplazaría a marzo. */
function isCivilDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

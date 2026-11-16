import { isCanonicalValue } from '../calc-engine/cell-values';
import type { CellValue, WorksheetColumn } from '../types/worksheets';

/**
 * Lo que se ve en una celda y lo que se guarda al escribir en ella. La forma
 * que guarda Nest es la «canónica» de cada tipo (`cell-values.ts`): entero,
 * decimal y fecha como texto, para no perder dígitos ni ceros (`105.00`).
 */
export type ParsedCell =
  { ok: true; value: CellValue } | { ok: false; message: string };

const TRUE_WORDS = ['sí', 'si', 'true', 'verdadero', '1', 'x'];
const FALSE_WORDS = ['no', 'false', 'falso', '0'];

/** Con coma decimal, como se escribe en español: `12,50` se guarda `12.50`. */
const DECIMAL_WITH_COMMA = /^-?\d+,\d+$/;

const FORMAT_HINTS: Record<WorksheetColumn['type'], string> = {
  text: 'El texto es demasiado largo.',
  integer: 'Escribe un número entero, sin decimales.',
  decimal: 'Escribe un número, por ejemplo 12,50.',
  date: 'Escribe una fecha que exista, como 2026-11-14.',
  boolean: 'Escribe sí o no.',
  selection: 'Elige una de las opciones de la columna.',
  calculated: 'Esta columna se calcula sola.',
};

/** El texto de una celda en la tabla; vacío si no tiene valor. */
export function displayCell(column: WorksheetColumn, value: CellValue): string {
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (column.type === 'selection') {
    return optionLabel(column, value) ?? value;
  }
  return value;
}

/** El texto con el que empieza el editor: lo guardado, sin traducir. */
export function editableText(
  column: WorksheetColumn,
  value: CellValue,
): string {
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'sí' : 'no';
  return value;
}

/**
 * Convierte lo escrito a la forma canónica de la columna. Vacío es «sin
 * valor». Lo que no tenga la forma de su tipo no se guarda: Nest rechazaría
 * todo el borrador por una sola celda mal formada.
 */
export function parseCellInput(
  column: WorksheetColumn,
  text: string,
): ParsedCell {
  if (column.type === 'calculated') return invalid(column);

  const trimmed = column.type === 'text' ? text : text.trim();
  if (trimmed === '') return { ok: true, value: null };

  const value = canonicalCandidate(column, trimmed);
  if (value === null || !isCanonicalValue(column, value))
    return invalid(column);
  return { ok: true, value };
}

/** Las columnas numéricas se alinean a la derecha, con cifras tabulares. */
export function isNumericColumn(column: WorksheetColumn) {
  return (
    column.type === 'integer' ||
    column.type === 'decimal' ||
    column.type === 'calculated'
  );
}

function canonicalCandidate(
  column: WorksheetColumn,
  text: string,
): string | boolean | null {
  if (column.type === 'decimal' && DECIMAL_WITH_COMMA.test(text)) {
    return text.replace(',', '.');
  }
  if (column.type === 'boolean') return booleanFromWord(text);
  if (column.type === 'selection') return optionId(column, text);
  return text;
}

function booleanFromWord(text: string): boolean | null {
  const word = text.toLowerCase();
  if (TRUE_WORDS.includes(word)) return true;
  if (FALSE_WORDS.includes(word)) return false;
  return null;
}

/** Se puede escribir la etiqueta («Rojo») o pegar el ID de la opción. */
function optionId(column: WorksheetColumn, text: string): string | null {
  const options = column.options ?? [];
  const wanted = text.toLowerCase();
  const match = options.find(
    (option) => option.id === text || option.label.toLowerCase() === wanted,
  );
  return match?.id ?? null;
}

function optionLabel(column: WorksheetColumn, id: string): string | null {
  return column.options?.find((option) => option.id === id)?.label ?? null;
}

function invalid(column: WorksheetColumn): ParsedCell {
  return { ok: false, message: FORMAT_HINTS[column.type] };
}

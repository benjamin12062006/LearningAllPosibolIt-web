import type { WorksheetColumn } from '../types/worksheets';
import type { CellEdit, GridRow } from './draft-overlay';
import { parseCellInput } from './cell-text';
import type { CellPosition } from './grid-keys';

/**
 * Pegar un bloque copiado de Excel o de Sheets (plan worksheets 02, TE8): el
 * portapapeles trae texto con tabuladores entre columnas y saltos de línea
 * entre filas. Se escribe desde la celda activa hacia abajo y a la derecha.
 */
export interface PasteResult {
  edits: CellEdit[];
  /** Celdas cuyo texto no tenía la forma del tipo de su columna. */
  invalidCells: number;
  /** Celdas que caían fuera de la tabla o en una columna calculada. */
  outsideCells: number;
  /** Celdas que no entraron porque el borrador ya iba por su máximo. */
  overLimitCells: number;
}

export interface PasteTarget {
  start: CellPosition;
  rows: readonly GridRow[];
  columns: readonly WorksheetColumn[];
  /** Cuántas operaciones más admite el borrador (1.000 en total). */
  budget: number;
}

/**
 * Las celdas del texto copiado. Excel termina con un salto de línea de más y
 * usa `\r\n`: ninguno de los dos crea una fila vacía.
 */
export function parseClipboardTable(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines.map((line) => line.split('\t'));
}

/** Qué se escribiría al pegar esa tabla en ese sitio, sin tocar nada todavía. */
export function pasteEdits(
  table: string[][],
  target: PasteTarget,
): PasteResult {
  const result: PasteResult = {
    edits: [],
    invalidCells: 0,
    outsideCells: 0,
    overLimitCells: 0,
  };

  table.forEach((cells, rowOffset) => {
    cells.forEach((text, columnOffset) => {
      const row = target.rows[target.start.row + rowOffset];
      const column = target.columns[target.start.column + columnOffset];
      const isWritable =
        row !== undefined &&
        column !== undefined &&
        row.state !== 'deleted' &&
        column.type !== 'calculated';
      if (!isWritable) {
        result.outsideCells += 1;
        return;
      }

      const parsed = parseCellInput(column, text);
      if (!parsed.ok) {
        result.invalidCells += 1;
        return;
      }
      if (result.edits.length >= target.budget) {
        result.overLimitCells += 1;
        return;
      }
      result.edits.push({
        rowId: row.rowId,
        columnId: column.id,
        value: parsed.value,
      });
    });
  });
  return result;
}

/** Una frase con lo que no se pegó, o `null` si se pegó todo. */
export function describeSkipped(result: PasteResult): string | null {
  const parts: string[] = [];
  if (result.overLimitCells > 0) {
    parts.push(
      `${result.overLimitCells} no entraron: un borrador admite 1.000 cambios`,
    );
  }
  if (result.invalidCells > 0) {
    parts.push(`${result.invalidCells} no tenían el formato de su columna`);
  }
  if (result.outsideCells > 0) {
    parts.push(`${result.outsideCells} caían fuera de la tabla`);
  }
  return parts.length === 0 ? null : `Celdas sin pegar: ${parts.join('; ')}.`;
}

import type { StoredFormula } from './formula.js';
import type { ColumnType, SelectionOption } from './worksheet-columns.js';

/**
 * `WorksheetColumn` de `src/worksheets/worksheets.types.ts` de la API: el
 * único tipo de ese archivo que usa el motor (`row-evaluation.ts`). `options`
 * solo aparece en las de selección y `formula` solo en las calculadas.
 */
export type WorksheetColumn = Readonly<{
  id: string;
  name: string;
  type: ColumnType;
  position: number;
  required: boolean;
  options?: readonly SelectionOption[];
  formula?: StoredFormula;
}>;

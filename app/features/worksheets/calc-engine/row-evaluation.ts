import {
  cellProblem,
  isCanonicalValue,
  type CellProblem,
} from './cell-values.js';
import { parseDecimal } from './exact-decimal.js';
import {
  calculate,
  roundOutcome,
  type CalculationProblem,
  type Outcome,
  type StoredFormula,
} from './formula.js';
import type { WorksheetColumn } from './worksheets.types.js';

export type RowProblem = Readonly<{
  columnId: string;
  code: CellProblem | CalculationProblem;
}>;

export type EvaluatedRow = Readonly<{
  values: Readonly<Record<string, unknown>>;
  problems: readonly RowProblem[];
}>;

/**
 * Valores y problemas de una fila para las columnas pedidas (plan worksheets
 * 03, V5–V8). Las calculadas salen del motor; si la celda guardada trae algo
 * para ellas, se ignora (V6). Las demás se devuelven tal como están y se
 * validan (V7).
 */
export function evaluateRow(
  columns: readonly WorksheetColumn[],
  cellValues: Readonly<Record<string, unknown>>,
  selectedIds: readonly string[],
): EvaluatedRow {
  const inputs = new RowInputs(columns, cellValues);
  const values: Record<string, unknown> = {};
  const problems: RowProblem[] = [];

  for (const columnId of selectedIds) {
    const column = inputs.column(columnId);
    if (!column) {
      continue;
    }
    if (column.formula) {
      const result = calculate(column.formula, (id) => inputs.read(id));
      values[columnId] = result.value;
      if (result.problem) {
        problems.push({ columnId, code: result.problem });
      }
      continue;
    }

    const value = cellValues[columnId] ?? null;
    values[columnId] = value;
    const problem = cellProblem(column, value);
    if (problem) {
      problems.push({ columnId, code: problem });
    }
  }
  return { values, problems };
}

/**
 * Lee las entradas de las fórmulas de una fila. Guarda el resultado de cada
 * calculada para no repetirla si varias la usan, y marca las que está
 * evaluando: un ciclo no debería existir (se rechaza al crear la hoja), pero si
 * llegara uno de la base no se entra en un bucle.
 */
class RowInputs {
  private readonly byId: ReadonlyMap<string, WorksheetColumn>;
  private readonly results = new Map<string, Outcome>();
  private readonly evaluating = new Set<string>();

  constructor(
    columns: readonly WorksheetColumn[],
    private readonly cellValues: Readonly<Record<string, unknown>>,
  ) {
    this.byId = new Map(columns.map((column) => [column.id, column]));
  }

  column(columnId: string) {
    return this.byId.get(columnId);
  }

  read(columnId: string): Outcome {
    const column = this.byId.get(columnId);
    if (!column) {
      return { kind: 'problem', problem: 'CALC_INPUT_INVALID' };
    }
    if (column.formula) {
      return this.readCalculated(columnId, column.formula);
    }
    return this.readStored(column);
  }

  /** Una calculada que lee a otra usa el valor ya redondeado, el que se ve. */
  private readCalculated(columnId: string, formula: StoredFormula): Outcome {
    const known = this.results.get(columnId);
    if (known) {
      return known;
    }
    if (this.evaluating.has(columnId)) {
      return { kind: 'problem', problem: 'CALC_INPUT_INVALID' };
    }

    this.evaluating.add(columnId);
    const result = calculate(formula, (id) => this.read(id));
    this.evaluating.delete(columnId);

    const outcome = toOutcome(formula, result);
    this.results.set(columnId, outcome);
    return outcome;
  }

  /** Vacía no es un problema; un valor sin forma canónica, sí. */
  private readStored(column: WorksheetColumn): Outcome {
    const value = this.cellValues[column.id];
    if (value === undefined || value === null) {
      return { kind: 'empty' };
    }
    if (!isCanonicalValue(column, value) || typeof value !== 'string') {
      return { kind: 'problem', problem: 'CALC_INPUT_INVALID' };
    }
    return { kind: 'value', value: parseDecimal(value) };
  }
}

/** Vuelve a la forma interna el resultado ya redondeado de una calculada. */
function toOutcome(
  formula: StoredFormula,
  result: ReturnType<typeof calculate>,
): Outcome {
  if (result.problem) {
    return { kind: 'problem', problem: result.problem };
  }
  if (result.value === null) {
    return { kind: 'empty' };
  }
  return roundOutcome(formula, {
    kind: 'value',
    value: parseDecimal(result.value),
  });
}

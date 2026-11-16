import { evaluateRow } from '../calc-engine/row-evaluation';
import type {
  InsertRow,
  Operation,
  RowOperation,
  SchemaOperation,
} from '../types/changesets';
import { isRowOperation } from '../types/changesets';
import type { CellValue, RowItem, WorksheetColumn } from '../types/worksheets';

/**
 * El borrador sobre la hoja: cómo se ven las filas con las operaciones que la
 * persona lleva hechas, y cómo cambia la lista de operaciones con cada edición.
 * Todo son funciones puras: la tabla las llama y sustituye sus datos.
 *
 * Lo calculado aquí es una **vista previa** con el mismo motor que Nest
 * (`calc-engine`); el valor oficial es el que Nest devuelve al aplicar.
 */
export type RowState = 'clean' | 'edited' | 'inserted' | 'deleted';

export interface GridRow {
  rowId: string;
  values: Record<string, CellValue>;
  /** Columnas con un problema: valor obligatorio, mal formado o cálculo imposible. */
  problemColumnIds: ReadonlySet<string>;
  /** Columnas que la persona cambió y aún no se aplicaron. */
  editedColumnIds: ReadonlySet<string>;
  state: RowState;
}

export interface CellEdit {
  rowId: string;
  columnId: string;
  value: CellValue;
}

const NO_COLUMNS: ReadonlySet<string> = new Set();

/** Las columnas tal como quedan con los cambios de esquema del borrador. */
export function columnsWithDraft(
  columns: readonly WorksheetColumn[],
  operations: readonly Operation[],
): WorksheetColumn[] {
  let result = [...columns];
  for (const operation of operations) {
    if (isRowOperation(operation)) continue;
    result = applySchemaOperation(result, operation);
  }
  return result;
}

/**
 * Las filas de la hoja con el borrador encima. Solo se recalculan las filas
 * que el borrador toca (una fórmula solo lee columnas de su misma fila); el
 * resto conserva el objeto que ya tenía, para que la tabla no las redibuje.
 */
export function rowsWithDraft(
  rows: readonly RowItem[],
  operations: readonly Operation[],
  columns: readonly WorksheetColumn[],
  previous: ReadonlyMap<string, GridRow> = new Map(),
): GridRow[] {
  const touched = touchedRows(operations);
  const columnIds = columns.map((column) => column.id);
  const result: GridRow[] = [];

  for (const row of rows) {
    const draft = touched.get(row.rowId);
    if (!draft) {
      result.push(previous.get(row.rowId) ?? cleanRow(row));
      continue;
    }
    result.push(draftedRow(row.rowId, row.values, draft, columns, columnIds));
  }
  for (const [rowId, draft] of touched) {
    if (draft.inserted) {
      result.push(draftedRow(rowId, {}, draft, columns, columnIds));
    }
  }
  return result;
}

/**
 * La lista de operaciones después de escribir en una celda: una sola escritura
 * por celda. Volver al valor de la hoja quita la operación; en una fila
 * insertada en este borrador, el valor va dentro de su inserción.
 */
export function withCellEdit(
  operations: readonly Operation[],
  edit: CellEdit,
  sheetValue: CellValue,
): Operation[] {
  const insertion = operations.find(
    (operation): operation is InsertRow =>
      operation.type === 'insert_row' && operation.rowId === edit.rowId,
  );
  if (insertion) {
    return operations.map((operation) =>
      operation === insertion ? insertionWithValue(insertion, edit) : operation,
    );
  }

  const others = operations.filter(
    (operation) => !isWriteTo(operation, edit.rowId, edit.columnId),
  );
  if (edit.value === sheetValue) return others;
  return [...others, { type: 'set_cell', ...edit }];
}

export function withInsertedRow(
  operations: readonly Operation[],
  rowId: string,
): Operation[] {
  return [...operations, { type: 'insert_row', rowId, values: {} }];
}

/** Borrar una fila insertada aquí anula su inserción: nunca llegó a la hoja. */
export function withDeletedRow(
  operations: readonly Operation[],
  rowId: string,
): Operation[] {
  const wasInsertedHere = operations.some(
    (operation) => operation.type === 'insert_row' && operation.rowId === rowId,
  );
  const others = operations.filter(
    (operation) => !isRowOperation(operation) || operation.rowId !== rowId,
  );
  if (wasInsertedHere) return others;
  return [...others, { type: 'delete_row', rowId }];
}

export function withRestoredRow(
  operations: readonly Operation[],
  rowId: string,
): Operation[] {
  return operations.filter(
    (operation) =>
      !(operation.type === 'delete_row' && operation.rowId === rowId),
  );
}

/** Los cambios de esquema van siempre delante de los de filas, como en Nest. */
export function withSchemaOperation(
  operations: readonly Operation[],
  schemaOperation: SchemaOperation,
): Operation[] {
  const schema = operations.filter((operation) => !isRowOperation(operation));
  const rows = operations.filter(isRowOperation);
  return [...schema, schemaOperation, ...rows];
}

/** Columnas calculadas cuya fórmula lee esa columna: avisan antes de borrarla. */
export function columnsDependingOn(
  columns: readonly WorksheetColumn[],
  columnId: string,
): WorksheetColumn[] {
  return columns.filter(
    (column) =>
      column.formula !== undefined &&
      formulaColumns(column.formula.expression).includes(columnId),
  );
}

interface RowDraft {
  inserted: boolean;
  deleted: boolean;
  values: Map<string, CellValue>;
}

/** Lo que el borrador hace en cada fila, por `rowId`. */
function touchedRows(operations: readonly Operation[]): Map<string, RowDraft> {
  const touched = new Map<string, RowDraft>();
  for (const operation of operations) {
    if (!isRowOperation(operation)) continue;
    const draft = touched.get(operation.rowId) ?? emptyDraft();
    recordOperation(draft, operation);
    touched.set(operation.rowId, draft);
  }
  return touched;
}

function recordOperation(draft: RowDraft, operation: RowOperation) {
  if (operation.type === 'delete_row') {
    draft.deleted = true;
    return;
  }
  if (operation.type === 'insert_row') {
    draft.inserted = true;
    for (const [columnId, value] of Object.entries(operation.values)) {
      draft.values.set(columnId, value);
    }
    return;
  }
  draft.values.set(operation.columnId, operation.value);
}

function emptyDraft(): RowDraft {
  return { inserted: false, deleted: false, values: new Map() };
}

function cleanRow(row: RowItem): GridRow {
  return {
    rowId: row.rowId,
    values: row.values,
    problemColumnIds:
      row.problems.length === 0
        ? NO_COLUMNS
        : new Set(row.problems.map((problem) => problem.columnId)),
    editedColumnIds: NO_COLUMNS,
    state: 'clean',
  };
}

/** Los valores guardados más los del borrador, con las calculadas recalculadas. */
function draftedRow(
  rowId: string,
  sheetValues: Record<string, CellValue>,
  draft: RowDraft,
  columns: readonly WorksheetColumn[],
  columnIds: readonly string[],
): GridRow {
  const stored: Record<string, CellValue> = { ...sheetValues };
  for (const [columnId, value] of draft.values) stored[columnId] = value;

  const evaluated = evaluateRow(columns, stored, columnIds);
  return {
    rowId,
    values: readCellValues(evaluated.values),
    problemColumnIds: new Set(
      evaluated.problems.map((problem) => problem.columnId),
    ),
    editedColumnIds: new Set(draft.values.keys()),
    state: rowState(draft),
  };
}

function rowState(draft: RowDraft): RowState {
  if (draft.deleted) return 'deleted';
  if (draft.inserted) return 'inserted';
  return 'edited';
}

/** El motor devuelve `unknown`: solo texto, booleano o vacío llegan a la tabla. */
function readCellValues(
  values: Readonly<Record<string, unknown>>,
): Record<string, CellValue> {
  const result: Record<string, CellValue> = {};
  for (const [columnId, value] of Object.entries(values)) {
    const isCell = typeof value === 'string' || typeof value === 'boolean';
    result[columnId] = isCell ? value : null;
  }
  return result;
}

function insertionWithValue(insertion: InsertRow, edit: CellEdit): InsertRow {
  const values = { ...insertion.values };
  if (edit.value === null) {
    // `delete` con clave calculada: la inserción no lleva celdas vacías.
    return {
      ...insertion,
      values: Object.fromEntries(
        Object.entries(values).filter(
          ([columnId]) => columnId !== edit.columnId,
        ),
      ),
    };
  }
  values[edit.columnId] = edit.value;
  return { ...insertion, values };
}

function isWriteTo(operation: Operation, rowId: string, columnId: string) {
  return (
    operation.type === 'set_cell' &&
    operation.rowId === rowId &&
    operation.columnId === columnId
  );
}

function applySchemaOperation(
  columns: WorksheetColumn[],
  operation: SchemaOperation,
): WorksheetColumn[] {
  if (operation.type === 'add_column') {
    return [
      ...columns,
      {
        id: operation.columnId,
        name: operation.name,
        type: operation.columnType,
        position: columns.length,
        required: false,
        ...(operation.options ? { options: operation.options } : {}),
      },
    ];
  }
  if (operation.type === 'delete_column') {
    return columns.filter((column) => column.id !== operation.columnId);
  }
  return columns.map((column) => {
    if (column.id !== operation.columnId) return column;
    if (operation.type === 'rename_column') {
      return { ...column, name: operation.name };
    }
    return {
      id: column.id,
      name: column.name,
      position: column.position,
      required: column.required,
      type: operation.columnType,
      ...(operation.options ? { options: operation.options } : {}),
    };
  });
}

type Expression = NonNullable<WorksheetColumn['formula']>['expression'];

/** IDs de las columnas que lee una fórmula, recorriendo su árbol. */
function formulaColumns(expression: Expression): string[] {
  if ('column' in expression) return [expression.column];
  if ('value' in expression) return [];
  return expression.args.flatMap(formulaColumns);
}

import { describe, expect, it } from 'vitest';
import type { Operation } from '../../../app/features/worksheets/types/changesets';
import {
  columnsDependingOn,
  columnsWithDraft,
  rowsWithDraft,
  withCellEdit,
  withDeletedRow,
  withInsertedRow,
  withRestoredRow,
  withSchemaOperation,
} from '../../../app/features/worksheets/utils/draft-overlay';
import { COLUMNS, ROWS } from './fixtures';

function rowOf(rows: ReturnType<typeof rowsWithDraft>, rowId: string) {
  const row = rows.find((item) => item.rowId === rowId);
  if (!row) throw new Error(`No hay fila ${rowId}`);
  return row;
}

describe('las filas con el borrador encima', () => {
  it('sin operaciones, las filas son las de la hoja', () => {
    const rows = rowsWithDraft(ROWS, [], COLUMNS);

    expect(rows.map((row) => row.state)).toEqual(['clean', 'clean']);
    expect(rowOf(rows, 'r1').values['c-total']).toBe('21.00');
  });

  it('editar una entrada recalcula la calculada de esa fila con el motor de Nest', () => {
    const operations: Operation[] = [
      { type: 'set_cell', rowId: 'r1', columnId: 'c-units', value: '3' },
    ];

    const row = rowOf(rowsWithDraft(ROWS, operations, COLUMNS), 'r1');

    expect(row.values['c-total']).toBe('31.50');
    expect(row.state).toBe('edited');
    expect([...row.editedColumnIds]).toEqual(['c-units']);
  });

  it('una calculada con una entrada vacía queda vacía, sin problema', () => {
    const row = rowOf(rowsWithDraft(ROWS, [], COLUMNS), 'r2');

    expect(row.values['c-total']).toBeNull();
    expect(row.problemColumnIds.size).toBe(0);
  });

  it('las filas que el borrador no toca conservan su objeto', () => {
    const first = rowsWithDraft(ROWS, [], COLUMNS);
    const previous = new Map(first.map((row) => [row.rowId, row]));
    const operations: Operation[] = [
      { type: 'set_cell', rowId: 'r1', columnId: 'c-units', value: '3' },
    ];

    const second = rowsWithDraft(ROWS, operations, COLUMNS, previous);

    expect(rowOf(second, 'r2')).toBe(rowOf(first, 'r2'));
    expect(rowOf(second, 'r1')).not.toBe(rowOf(first, 'r1'));
  });

  it('vaciar una celda obligatoria marca el problema', () => {
    const operations: Operation[] = [
      { type: 'set_cell', rowId: 'r1', columnId: 'c-name', value: null },
    ];

    const row = rowOf(rowsWithDraft(ROWS, operations, COLUMNS), 'r1');

    expect(row.problemColumnIds.has('c-name')).toBe(true);
  });

  it('una fila insertada aparece al final con sus valores', () => {
    const operations: Operation[] = [
      { type: 'insert_row', rowId: 'n1', values: { 'c-name': 'Banco' } },
    ];

    const rows = rowsWithDraft(ROWS, operations, COLUMNS);

    expect(rows).toHaveLength(3);
    expect(rows[2]).toMatchObject({ rowId: 'n1', state: 'inserted' });
    expect(rows[2]?.values['c-name']).toBe('Banco');
  });

  it('una fila borrada sigue a la vista, marcada', () => {
    const rows = rowsWithDraft(
      ROWS,
      [{ type: 'delete_row', rowId: 'r2' }],
      COLUMNS,
    );

    expect(rowOf(rows, 'r2').state).toBe('deleted');
  });
});

describe('las operaciones al editar', () => {
  it('una celda tiene una sola escritura: la última', () => {
    let operations = withCellEdit(
      [],
      { rowId: 'r1', columnId: 'c-units', value: '3' },
      '2',
    );
    operations = withCellEdit(
      operations,
      { rowId: 'r1', columnId: 'c-units', value: '4' },
      '2',
    );

    expect(operations).toEqual([
      { type: 'set_cell', rowId: 'r1', columnId: 'c-units', value: '4' },
    ]);
  });

  it('volver al valor de la hoja quita la operación', () => {
    const edited = withCellEdit(
      [],
      { rowId: 'r1', columnId: 'c-units', value: '3' },
      '2',
    );

    expect(
      withCellEdit(
        edited,
        { rowId: 'r1', columnId: 'c-units', value: '2' },
        '2',
      ),
    ).toEqual([]);
  });

  it('en una fila insertada aquí, el valor va dentro de su inserción', () => {
    const inserted = withInsertedRow([], 'n1');

    const operations = withCellEdit(
      inserted,
      { rowId: 'n1', columnId: 'c-name', value: 'Banco' },
      null,
    );

    expect(operations).toEqual([
      { type: 'insert_row', rowId: 'n1', values: { 'c-name': 'Banco' } },
    ]);
  });

  it('vaciar una celda de una fila insertada quita la clave, no guarda null', () => {
    const operations = withCellEdit(
      [{ type: 'insert_row', rowId: 'n1', values: { 'c-name': 'Banco' } }],
      { rowId: 'n1', columnId: 'c-name', value: null },
      null,
    );

    expect(operations).toEqual([
      { type: 'insert_row', rowId: 'n1', values: {} },
    ]);
  });

  it('borrar una fila de la hoja quita sus escrituras y añade el borrado', () => {
    const edited = withCellEdit(
      [],
      { rowId: 'r1', columnId: 'c-units', value: '3' },
      '2',
    );

    expect(withDeletedRow(edited, 'r1')).toEqual([
      { type: 'delete_row', rowId: 'r1' },
    ]);
  });

  it('borrar una fila insertada aquí anula la inserción', () => {
    expect(withDeletedRow(withInsertedRow([], 'n1'), 'n1')).toEqual([]);
  });

  it('se puede deshacer el borrado de una fila', () => {
    expect(withRestoredRow(withDeletedRow([], 'r2'), 'r2')).toEqual([]);
  });

  it('los cambios de esquema van delante de los de filas', () => {
    const operations = withSchemaOperation(
      [{ type: 'set_cell', rowId: 'r1', columnId: 'c-units', value: '3' }],
      { type: 'rename_column', columnId: 'c-name', name: 'Producto' },
    );

    expect(operations.map((operation) => operation.type)).toEqual([
      'rename_column',
      'set_cell',
    ]);
  });
});

describe('las columnas con el borrador encima', () => {
  it('añade, renombra, cambia de tipo y borra', () => {
    const columns = columnsWithDraft(COLUMNS, [
      {
        type: 'add_column',
        columnId: 'c-new',
        name: 'Marca',
        columnType: 'text',
      },
      { type: 'rename_column', columnId: 'c-name', name: 'Producto' },
      {
        type: 'change_column_type',
        columnId: 'c-units',
        columnType: 'decimal',
      },
      { type: 'delete_column', columnId: 'c-date' },
    ]);

    expect(columns.map((column) => column.name)).toEqual([
      'Producto',
      'Precio',
      'Unidades',
      'Total',
      'Activo',
      'Color',
      'Marca',
    ]);
    expect(columns.find((column) => column.id === 'c-units')?.type).toBe(
      'decimal',
    );
  });

  it('avisa de las calculadas que leen una columna', () => {
    expect(
      columnsDependingOn(COLUMNS, 'c-price').map((column) => column.id),
    ).toEqual(['c-total']);
    expect(columnsDependingOn(COLUMNS, 'c-name')).toEqual([]);
  });
});

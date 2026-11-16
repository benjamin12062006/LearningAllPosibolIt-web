import { describe, expect, it } from 'vitest';
import { rowsWithDraft } from '../../../app/features/worksheets/utils/draft-overlay';
import {
  isTypingKey,
  PAGE_JUMP,
  positionAfterKey,
} from '../../../app/features/worksheets/utils/grid-keys';
import {
  describeSkipped,
  parseClipboardTable,
  pasteEdits,
} from '../../../app/features/worksheets/utils/paste';
import {
  buildFilter,
  conditionsFromFilter,
  isQueryableColumn,
} from '../../../app/features/worksheets/utils/row-filter';
import { COLUMNS, ROWS, column } from './fixtures';

const SIZE = { rows: 30, columns: 5 };

function press(key: string, hasModifier = false) {
  return { key, hasModifier };
}

describe('la celda activa con el teclado', () => {
  it('las flechas mueven una celda', () => {
    const from = { row: 5, column: 2 };

    expect(positionAfterKey(from, press('ArrowUp'), SIZE)).toEqual({
      row: 4,
      column: 2,
    });
    expect(positionAfterKey(from, press('ArrowDown'), SIZE)).toEqual({
      row: 6,
      column: 2,
    });
    expect(positionAfterKey(from, press('ArrowLeft'), SIZE)).toEqual({
      row: 5,
      column: 1,
    });
    expect(positionAfterKey(from, press('ArrowRight'), SIZE)).toEqual({
      row: 5,
      column: 3,
    });
  });

  it('en un borde se queda donde está', () => {
    expect(
      positionAfterKey({ row: 0, column: 0 }, press('ArrowUp'), SIZE),
    ).toEqual({
      row: 0,
      column: 0,
    });
    expect(
      positionAfterKey({ row: 29, column: 4 }, press('ArrowRight'), SIZE),
    ).toEqual({ row: 29, column: 4 });
  });

  it('Inicio y Fin van al principio y al final de la fila', () => {
    const from = { row: 5, column: 2 };

    expect(positionAfterKey(from, press('Home'), SIZE)).toEqual({
      row: 5,
      column: 0,
    });
    expect(positionAfterKey(from, press('End'), SIZE)).toEqual({
      row: 5,
      column: 4,
    });
  });

  it('con Ctrl, Inicio y Fin van a la primera y a la última celda', () => {
    const from = { row: 5, column: 2 };

    expect(positionAfterKey(from, press('Home', true), SIZE)).toEqual({
      row: 0,
      column: 0,
    });
    expect(positionAfterKey(from, press('End', true), SIZE)).toEqual({
      row: 29,
      column: 4,
    });
  });

  it('RePág y AvPág saltan un bloque sin salirse', () => {
    expect(
      positionAfterKey({ row: 15, column: 1 }, press('PageUp'), SIZE),
    ).toEqual({
      row: 15 - PAGE_JUMP,
      column: 1,
    });
    expect(
      positionAfterKey({ row: 25, column: 1 }, press('PageDown'), SIZE),
    ).toEqual({
      row: 29,
      column: 1,
    });
  });

  it('una tecla que no mueve devuelve null', () => {
    expect(
      positionAfterKey({ row: 1, column: 1 }, press('a'), SIZE),
    ).toBeNull();
    expect(
      positionAfterKey({ row: 1, column: 1 }, press('Enter'), SIZE),
    ).toBeNull();
  });

  it('una letra empieza a editar; un atajo no', () => {
    const plain = { ctrlKey: false, metaKey: false, altKey: false };

    expect(isTypingKey({ key: 'a', ...plain })).toBe(true);
    expect(isTypingKey({ key: 'Enter', ...plain })).toBe(false);
    expect(isTypingKey({ key: 'c', ...plain, ctrlKey: true })).toBe(false);
    expect(isTypingKey({ key: 'v', ...plain, metaKey: true })).toBe(false);
  });
});

describe('pegar desde Excel o Sheets', () => {
  const rows = rowsWithDraft(ROWS, [], COLUMNS);
  const target = {
    start: { row: 0, column: 1 },
    rows,
    columns: COLUMNS,
    budget: 1000,
  };

  it('separa por tabuladores y saltos de línea, sin la fila vacía final de Excel', () => {
    expect(parseClipboardTable('1\t2\r\n3\t4\r\n')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('escribe desde la celda activa hacia abajo y a la derecha', () => {
    const result = pasteEdits(
      [
        ['11,5', '4'],
        ['20', '1'],
      ],
      target,
    );

    expect(result.edits).toEqual([
      { rowId: 'r1', columnId: 'c-price', value: '11.5' },
      { rowId: 'r1', columnId: 'c-units', value: '4' },
      { rowId: 'r2', columnId: 'c-price', value: '20' },
      { rowId: 'r2', columnId: 'c-units', value: '1' },
    ]);
    expect(describeSkipped(result)).toBeNull();
  });

  it('no escribe en una calculada ni fuera de la tabla', () => {
    const result = pasteEdits(
      [
        ['1', '2', '999'],
        ['3', '4', '5'],
        ['6', '7', '8'],
      ],
      target,
    );

    // La tercera columna pegada cae en «Total» (calculada); la tercera fila, fuera.
    expect(result.edits).toHaveLength(4);
    expect(result.outsideCells).toBe(5);
  });

  it('cuenta las celdas que no tienen la forma de su columna', () => {
    const result = pasteEdits([['caro', '2']], target);

    expect(result.edits).toEqual([
      { rowId: 'r1', columnId: 'c-units', value: '2' },
    ]);
    expect(result.invalidCells).toBe(1);
    expect(describeSkipped(result)).toContain('1 no tenían el formato');
  });

  it('se detiene en el máximo del borrador y lo dice', () => {
    const result = pasteEdits(
      [
        ['1', '2'],
        ['3', '4'],
      ],
      { ...target, budget: 3 },
    );

    expect(result.edits).toHaveLength(3);
    expect(result.overLimitCells).toBe(1);
    expect(describeSkipped(result)).toContain('1.000 cambios');
  });
});

describe('el filtro de la tabla', () => {
  it('una condición sola es un predicado; varias, un «y»', () => {
    const one = buildFilter(
      [{ columnId: 'c-name', operator: 'contains', text: 'sil' }],
      COLUMNS,
    );
    const two = buildFilter(
      [
        { columnId: 'c-name', operator: 'contains', text: 'sil' },
        { columnId: 'c-price', operator: 'gte', text: '10,5' },
      ],
      COLUMNS,
    );

    expect(one).toEqual({ column: 'c-name', op: 'contains', value: 'sil' });
    expect(two).toEqual({
      and: [
        { column: 'c-name', op: 'contains', value: 'sil' },
        { column: 'c-price', op: 'gte', value: '10.5' },
      ],
    });
  });

  it('«está vacía» no lleva valor', () => {
    expect(
      buildFilter(
        [{ columnId: 'c-date', operator: 'is_null', text: '' }],
        COLUMNS,
      ),
    ).toEqual({ column: 'c-date', op: 'is_null' });
  });

  it('no manda una condición a medias, mal formada o de otro tipo', () => {
    expect(
      buildFilter(
        [
          { columnId: 'c-price', operator: 'gte', text: '' },
          { columnId: 'c-price', operator: 'gte', text: 'caro' },
          { columnId: 'c-price', operator: 'contains', text: '1' },
          { columnId: 'c-total', operator: 'equals', text: '21.00' },
          { columnId: 'no-existe', operator: 'equals', text: 'x' },
        ],
        COLUMNS,
      ),
    ).toBeUndefined();
  });

  it('una calculada no se puede filtrar', () => {
    expect(isQueryableColumn(column('c-total'))).toBe(false);
    expect(isQueryableColumn(column('c-price'))).toBe(true);
  });

  it('un filtro guardado sencillo vuelve a ser condiciones', () => {
    expect(
      conditionsFromFilter({
        and: [
          { column: 'c-name', op: 'contains', value: 'sil' },
          { column: 'c-active', op: 'equals', value: true },
        ],
      }),
    ).toEqual([
      { columnId: 'c-name', operator: 'contains', text: 'sil' },
      { columnId: 'c-active', operator: 'equals', text: 'sí' },
    ]);
    expect(conditionsFromFilter(undefined)).toEqual([]);
  });

  it('un filtro avanzado no se desmonta', () => {
    expect(
      conditionsFromFilter({ or: [{ column: 'c-name', op: 'is_null' }] }),
    ).toBeNull();
    expect(
      conditionsFromFilter({ column: 'c-color', op: 'in', value: ['o-red'] }),
    ).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { evaluateRow } from '../../../app/features/worksheets/calc-engine/row-evaluation';
import type { WorksheetColumn } from '../../../app/features/worksheets/calc-engine/worksheets.types';

/**
 * Casos fijos del motor copiado de Nest (plan worksheets 02, TE2). Si Nest
 * cambia el motor (`calc-v2`), `pnpm check:calc-engine` lo detecta; estos
 * casos comprueban que la copia calcula lo que se espera.
 */
function calculated(
  expression: NonNullable<WorksheetColumn['formula']>['expression'],
  scale = 2,
  rounding: 'half_up' | 'half_even' = 'half_up',
): WorksheetColumn {
  return {
    id: 'result',
    name: 'Resultado',
    type: 'calculated',
    position: 2,
    required: false,
    formula: { engine: 'calc-v1', expression, scale, rounding },
  };
}

const A: WorksheetColumn = {
  id: 'a',
  name: 'A',
  type: 'decimal',
  position: 0,
  required: false,
};
const B: WorksheetColumn = {
  id: 'b',
  name: 'B',
  type: 'decimal',
  position: 1,
  required: false,
};

function resultOf(column: WorksheetColumn, cells: Record<string, unknown>) {
  const { values, problems } = evaluateRow([A, B, column], cells, ['result']);
  return {
    value: values.result,
    problems: problems.map((problem) => problem.code),
  };
}

const DIVIDE = calculated({
  op: 'div',
  args: [{ column: 'a' }, { column: 'b' }],
});

describe('el motor de cálculo compartido con Nest', () => {
  it('0,1 + 0,2 es exactamente 0,30', () => {
    const sum = calculated({
      op: 'add',
      args: [{ column: 'a' }, { column: 'b' }],
    });

    expect(resultOf(sum, { a: '0.1', b: '0.2' })).toEqual({
      value: '0.30',
      problems: [],
    });
  });

  it('dividir por cero es un problema, no un número', () => {
    expect(resultOf(DIVIDE, { a: '1', b: '0' })).toEqual({
      value: null,
      problems: ['CALC_DIVISION_BY_ZERO'],
    });
  });

  it('una entrada vacía deja el resultado vacío, sin problema', () => {
    expect(resultOf(DIVIDE, { a: '1' })).toEqual({ value: null, problems: [] });
  });

  it('una entrada mal formada es un problema de cálculo', () => {
    expect(resultOf(DIVIDE, { a: 'diez', b: '2' })).toEqual({
      value: null,
      problems: ['CALC_INPUT_INVALID'],
    });
  });

  it('la mitad sube con half_up y va al par con half_even', () => {
    const value = {
      op: 'add',
      args: [{ column: 'a' }, { value: '0' }],
    } as const;

    expect(resultOf(calculated(value, 0, 'half_up'), { a: '2.5' }).value).toBe(
      '3',
    );
    expect(
      resultOf(calculated(value, 0, 'half_even'), { a: '2.5' }).value,
    ).toBe('2');
    expect(
      resultOf(calculated(value, 0, 'half_even'), { a: '3.5' }).value,
    ).toBe('4');
  });

  it('un negativo redondea igual que su positivo', () => {
    const value = {
      op: 'add',
      args: [{ column: 'a' }, { value: '0' }],
    } as const;

    expect(resultOf(calculated(value, 0, 'half_up'), { a: '-2.5' }).value).toBe(
      '-3',
    );
  });

  it('redondea una sola vez, al final', () => {
    const third = calculated(
      {
        op: 'mul',
        args: [
          { op: 'div', args: [{ column: 'a' }, { value: '3' }] },
          { value: '3' },
        ],
      },
      2,
    );

    expect(resultOf(third, { a: '1' }).value).toBe('1.00');
  });
});

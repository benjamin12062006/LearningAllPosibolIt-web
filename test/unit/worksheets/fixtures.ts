import type { RowItem, WorksheetColumn } from '../../../app/features/worksheets/types/worksheets';

/** Una hoja pequeña con todos los tipos y una calculada: total = precio × unidades. */
export const COLUMNS: WorksheetColumn[] = [
  { id: 'c-name', name: 'Nombre', type: 'text', position: 0, required: true },
  {
    id: 'c-price',
    name: 'Precio',
    type: 'decimal',
    position: 1,
    required: false,
  },
  {
    id: 'c-units',
    name: 'Unidades',
    type: 'integer',
    position: 2,
    required: false,
  },
  {
    id: 'c-total',
    name: 'Total',
    type: 'calculated',
    position: 3,
    required: false,
    formula: {
      engine: 'calc-v1',
      expression: {
        op: 'mul',
        args: [{ column: 'c-price' }, { column: 'c-units' }],
      },
      scale: 2,
      rounding: 'half_up',
    },
  },
  { id: 'c-date', name: 'Alta', type: 'date', position: 4, required: false },
  {
    id: 'c-active',
    name: 'Activo',
    type: 'boolean',
    position: 5,
    required: false,
  },
  {
    id: 'c-color',
    name: 'Color',
    type: 'selection',
    position: 6,
    required: false,
    options: [
      { id: 'o-red', label: 'Rojo' },
      { id: 'o-blue', label: 'Azul' },
    ],
  },
];

export const ROWS: RowItem[] = [
  {
    rowId: 'r1',
    values: {
      'c-name': 'Silla',
      'c-price': '10.50',
      'c-units': '2',
      'c-total': '21.00',
      'c-date': '2026-11-14',
      'c-active': true,
      'c-color': 'o-red',
    },
    problems: [],
  },
  {
    rowId: 'r2',
    values: {
      'c-name': 'Mesa',
      'c-price': '105.00',
      'c-units': null,
      'c-total': null,
      'c-date': null,
      'c-active': false,
      'c-color': null,
    },
    problems: [],
  },
];

export function column(id: string): WorksheetColumn {
  const found = COLUMNS.find((item) => item.id === id);
  if (!found) throw new Error(`No hay columna ${id} en los datos de prueba`);
  return found;
}

import { describe, expect, it } from 'vitest';
import {
  displayCell,
  editableText,
  isNumericColumn,
  parseCellInput,
} from '../../../app/features/worksheets/utils/cell-text';
import { column } from './fixtures';

describe('lo que se ve en una celda', () => {
  it('una celda vacía no enseña nada', () => {
    expect(displayCell(column('c-name'), null)).toBe('');
  });

  it('un booleano se lee «Sí» o «No»', () => {
    expect(displayCell(column('c-active'), true)).toBe('Sí');
    expect(displayCell(column('c-active'), false)).toBe('No');
  });

  it('una selección enseña la etiqueta, no el ID guardado', () => {
    expect(displayCell(column('c-color'), 'o-red')).toBe('Rojo');
  });

  it('un decimal conserva sus ceros', () => {
    expect(displayCell(column('c-price'), '105.00')).toBe('105.00');
    expect(editableText(column('c-price'), '105.00')).toBe('105.00');
  });

  it('las numéricas y las calculadas se alinean como números', () => {
    expect(isNumericColumn(column('c-price'))).toBe(true);
    expect(isNumericColumn(column('c-total'))).toBe(true);
    expect(isNumericColumn(column('c-name'))).toBe(false);
  });
});

describe('lo que se guarda al escribir', () => {
  it('vacío es «sin valor» en cualquier tipo', () => {
    expect(parseCellInput(column('c-price'), '  ')).toEqual({
      ok: true,
      value: null,
    });
    expect(parseCellInput(column('c-name'), '')).toEqual({
      ok: true,
      value: null,
    });
  });

  it('el texto se guarda tal cual, con sus espacios', () => {
    expect(parseCellInput(column('c-name'), ' Silla ')).toEqual({
      ok: true,
      value: ' Silla ',
    });
  });

  it('un decimal se guarda como texto, sin perder ceros ni precisión', () => {
    expect(parseCellInput(column('c-price'), '105.00')).toEqual({
      ok: true,
      value: '105.00',
    });
    expect(parseCellInput(column('c-price'), '0.1234567890123456789')).toEqual({
      ok: true,
      value: '0.1234567890123456789',
    });
  });

  it('la coma decimal se guarda como punto', () => {
    expect(parseCellInput(column('c-price'), '12,50')).toEqual({
      ok: true,
      value: '12.50',
    });
  });

  it.each([
    ['c-price', '12.5.1'],
    ['c-price', '1.000,50'],
    ['c-price', 'doce'],
    ['c-units', '2.5'],
    ['c-units', '2,0'],
    ['c-date', '2026-02-30'],
    ['c-date', '14/11/2026'],
    ['c-active', 'quizá'],
    ['c-color', 'Verde'],
    ['c-total', '21.00'],
  ])('rechaza en %s el texto «%s»', (columnId, text) => {
    expect(parseCellInput(column(columnId), text).ok).toBe(false);
  });

  it('un entero admite negativos', () => {
    expect(parseCellInput(column('c-units'), '-3')).toEqual({
      ok: true,
      value: '-3',
    });
  });

  it('una fecha que existe se guarda como AAAA-MM-DD', () => {
    expect(parseCellInput(column('c-date'), '2026-11-14')).toEqual({
      ok: true,
      value: '2026-11-14',
    });
  });

  it('sí y no, con o sin tilde, son booleanos', () => {
    expect(parseCellInput(column('c-active'), 'Sí')).toEqual({
      ok: true,
      value: true,
    });
    expect(parseCellInput(column('c-active'), 'si')).toEqual({
      ok: true,
      value: true,
    });
    expect(parseCellInput(column('c-active'), 'NO')).toEqual({
      ok: true,
      value: false,
    });
  });

  it('una selección se guarda por su ID, se escriba la etiqueta o el ID', () => {
    expect(parseCellInput(column('c-color'), 'azul')).toEqual({
      ok: true,
      value: 'o-blue',
    });
    expect(parseCellInput(column('c-color'), 'o-red')).toEqual({
      ok: true,
      value: 'o-red',
    });
  });
});

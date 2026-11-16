import { describe, expect, it } from 'vitest';
import {
  MAX_SEARCH_LENGTH,
  offsetForPage,
  readPage,
  readSearch,
  withPage,
  withSearch,
} from '../../../app/utils/page-in-url';

const KEYS = { searchKey: 'buscar', pageKey: 'pagina' } as const;

describe('readPage', () => {
  it.each([
    ['3', 3],
    ['1', 1],
    [undefined, 1],
    [null, 1],
    ['', 1],
    ['0', 1],
    ['-2', 1],
    ['2.5', 1],
    ['abc', 1],
    ['1e3', 1],
    [['2', '3'], 1],
  ])('%j → %i', (value, page) => {
    expect(readPage(value)).toBe(page);
  });
});

describe('readSearch', () => {
  it('recorta los espacios y respeta el largo de la API', () => {
    expect(readSearch('  zapatilla  ')).toBe('zapatilla');
    expect(readSearch('x'.repeat(MAX_SEARCH_LENGTH + 20))).toHaveLength(
      MAX_SEARCH_LENGTH,
    );
  });

  it('sin texto da una búsqueda vacía', () => {
    expect(readSearch(undefined)).toBe('');
    expect(readSearch(['a', 'b'])).toBe('');
  });
});

describe('withPage', () => {
  it('cambia la página y conserva el resto de la consulta', () => {
    expect(withPage({ buscar: 'sku', otra: 'x' }, 'pagina', 4)).toEqual({
      buscar: 'sku',
      otra: 'x',
      pagina: '4',
    });
  });

  it('la primera página no se escribe en la URL', () => {
    expect(withPage({ pagina: '3', buscar: 'sku' }, 'pagina', 1)).toEqual({
      buscar: 'sku',
      pagina: undefined,
    });
  });
});

describe('withSearch', () => {
  it('una búsqueda nueva vuelve a la primera página', () => {
    expect(withSearch({ pagina: '5', otra: 'x' }, KEYS, ' sku ')).toEqual({
      otra: 'x',
      buscar: 'sku',
      pagina: undefined,
    });
  });

  it('una búsqueda vacía quita la clave de la URL', () => {
    expect(withSearch({ buscar: 'sku' }, KEYS, '   ')).toEqual({
      buscar: undefined,
      pagina: undefined,
    });
  });
});

describe('offsetForPage', () => {
  it('la página 1 empieza en 0 y cada página salta su tamaño', () => {
    expect(offsetForPage(1, 20)).toBe(0);
    expect(offsetForPage(3, 20)).toBe(40);
  });
});

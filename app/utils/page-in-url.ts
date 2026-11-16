import type { LocationQuery, LocationQueryRaw } from 'vue-router';

/** Máximo que admite la API en un texto de búsqueda (`MAX_SEARCH_LENGTH`). */
export const MAX_SEARCH_LENGTH = 150;

/**
 * La página que dice la URL. Lo que no sea un entero positivo (texto, `0`,
 * negativo o la clave repetida) cuenta como la primera, como en la clase 70.
 */
export function readPage(value: unknown): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return page >= 1 ? page : 1;
}

/** El texto buscado: recortado y con el largo que admite la API. */
export function readSearch(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, MAX_SEARCH_LENGTH);
}

/**
 * La misma consulta con otra página. La primera no se escribe: así `?pagina=1`
 * y la URL sin página son la misma dirección. El resto se conserva (clase 71).
 */
export function withPage(
  query: LocationQuery,
  pageKey: string,
  page: number,
): LocationQueryRaw {
  return { ...query, [pageKey]: page > 1 ? String(page) : undefined };
}

/** La misma consulta con otra búsqueda, que vuelve siempre a la primera página. */
export function withSearch(
  query: LocationQuery,
  keys: Readonly<{ searchKey: string; pageKey: string }>,
  text: string,
): LocationQueryRaw {
  const search = readSearch(text);
  return {
    ...query,
    [keys.searchKey]: search === '' ? undefined : search,
    [keys.pageKey]: undefined,
  };
}

/** Desde qué fila pide la API una página: `offset = (página − 1) · tamaño`. */
export function offsetForPage(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

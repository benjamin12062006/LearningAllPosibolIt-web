/**
 * El TSV no tiene un esquema fijo. La tabla enseña estas columnas si existen
 * (plan del visor, VW4); la ficha las enseña todas.
 */
export const MAIN_COLUMNS = [
  'image_link',
  'id',
  'title',
  'price',
  'availability',
] as const;

export type MainColumn = (typeof MAIN_COLUMNS)[number];

export const MAIN_COLUMN_LABELS: Record<MainColumn, string> = {
  image_link: 'Imagen',
  id: 'ID',
  title: 'Título',
  price: 'Precio',
  availability: 'Disponibilidad',
};

/** Las columnas principales que tiene este archivo, en el orden de la tabla. */
export function mainColumnsOf(columns: readonly string[]): MainColumn[] {
  return MAIN_COLUMNS.filter((column) => columns.includes(column));
}

/**
 * La dirección, solo si es `http` o `https` (plan del visor, VW8): el TSV es
 * texto de terceros y un `javascript:` en `link` no debe llegar a un enlace.
 */
export function safeHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const isWebAddress = url.protocol === 'http:' || url.protocol === 'https:';
  return isWebAddress ? url.href : null;
}

/** Las columnas cuyo valor es una dirección: se enseñan como enlace en la ficha. */
export function isLinkColumn(column: string): boolean {
  return column === 'link' || column.endsWith('_link');
}

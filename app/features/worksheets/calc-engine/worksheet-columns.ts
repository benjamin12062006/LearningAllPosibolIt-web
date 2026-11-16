/**
 * Tipos de `src/worksheets/worksheet-columns.ts` de la API que usa el motor de
 * cálculo copiado en esta carpeta. El archivo se llama igual que en Nest para
 * que las copias exactas (`cell-values.ts`…) resuelvan sus importaciones.
 */
export const COLUMN_TYPES = [
  'text',
  'integer',
  'decimal',
  'date',
  'boolean',
  'selection',
  'calculated',
] as const;

export type ColumnType = (typeof COLUMN_TYPES)[number];

/** Opción de una columna de selección: la celda guarda `id`, no la etiqueta. */
export type SelectionOption = Readonly<{ id: string; label: string }>;

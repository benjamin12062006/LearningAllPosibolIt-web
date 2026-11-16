import type { AddableColumnType } from '../types/changesets';
import type { ColumnDefinition } from '../types/worksheets';

/**
 * Una columna tal como se escribe al crear una hoja o al añadirla en un
 * borrador: nombre, tipo y, si es de selección, sus opciones separadas por
 * comas.
 */
export interface ColumnDraft {
  name: string;
  type: AddableColumnType;
  required: boolean;
  /** «Rojo, Azul, Verde». */
  optionsText: string;
}

/** Tipos que guardan valor; una calculada se define con su fórmula en Nest. */
export const ADDABLE_COLUMN_TYPES: AddableColumnType[] = [
  'text',
  'integer',
  'decimal',
  'date',
  'boolean',
  'selection',
];

export function emptyColumnDraft(): ColumnDraft {
  return { name: '', type: 'text', required: false, optionsText: '' };
}

/** Etiquetas sin repetir ni vacías, en el orden en que se escribieron. */
export function optionLabels(optionsText: string): string[] {
  const labels = optionsText
    .split(',')
    .map((label) => label.trim())
    .filter((label) => label !== '');
  return [...new Set(labels)];
}

/** Lo que falta para poder usar la columna, o `null` si está completa. */
export function columnDraftProblem(draft: ColumnDraft): string | null {
  if (draft.name.trim() === '') return 'Ponle un nombre a la columna.';
  if (
    draft.type === 'selection' &&
    optionLabels(draft.optionsText).length === 0
  ) {
    return 'Una columna de selección necesita al menos una opción.';
  }
  return null;
}

/** Dos columnas no pueden llamarse igual, sin contar mayúsculas ni espacios. */
export function repeatedColumnName(
  drafts: readonly ColumnDraft[],
): string | null {
  const seen = new Set<string>();
  for (const draft of drafts) {
    const normalized = draft.name.trim().toLowerCase();
    if (normalized === '') continue;
    if (seen.has(normalized)) return draft.name.trim();
    seen.add(normalized);
  }
  return null;
}

export function toColumnDefinition(draft: ColumnDraft): ColumnDefinition {
  return {
    name: draft.name.trim(),
    type: draft.type,
    required: draft.required,
    ...(draft.type === 'selection'
      ? { options: optionLabels(draft.optionsText).map((label) => ({ label })) }
      : {}),
  };
}

import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';
import {
  COLUMN_TYPES,
  type ColumnType,
  type SelectionOption,
} from '../calc-engine/worksheet-columns';
import type { WorksheetColumn } from '../calc-engine/worksheets.types';
import { isPublicError, type PublicError } from '../../catalog/types/imports';
import { isPageInfo, type PageInfo } from '../../projects/types/projects';

/**
 * Formas de libros, hojas, filas y vistas en la API
 * (`src/worksheets/worksheets.types.ts`, `row-query.ts`, `saved-views.*`).
 * `WorksheetColumn` y los tipos de columna son los mismos que usa el motor de
 * cálculo copiado de Nest: un solo tipo por concepto.
 */
export type { ColumnType, SelectionOption, WorksheetColumn };
export { COLUMN_TYPES };

/** Límites de `worksheet-columns.ts` y `row-query.ts` que la interfaz respeta. */
export const WORKSHEET_LIMITS = {
  columnsPerWorksheet: 200,
  nameLength: 120,
  optionsPerColumn: 100,
  rowsPerWorksheet: 5000,
  /** Filas por petición de `rows/query`. */
  rowsPerPage: 100,
  sortColumns: 3,
  filterPredicates: 20,
} as const;

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: 'Texto',
  integer: 'Entero',
  decimal: 'Decimal',
  date: 'Fecha',
  boolean: 'Sí o no',
  selection: 'Selección',
  calculated: 'Calculada',
};

export const COLUMN_TYPE_ICONS: Record<ColumnType, string> = {
  text: 'i-lucide-type',
  integer: 'i-lucide-hash',
  decimal: 'i-lucide-percent',
  date: 'i-lucide-calendar',
  boolean: 'i-lucide-toggle-left',
  selection: 'i-lucide-list',
  calculated: 'i-lucide-sigma',
};

export interface Workbook {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  /** Nulo si está activo. */
  archivedAt: string | null;
}

export interface RevisionSummary {
  id: string;
  sequence: number;
  rowCount: number;
  createdAt: string;
}

/** Hoja en un listado: sin columnas. */
export interface WorksheetSummary {
  id: string;
  workbookId: string;
  name: string;
  schemaVersion: number;
  generation: number;
  headRevision: RevisionSummary;
  createdAt: string;
  archivedAt: string | null;
  /** No nulo si su libro está archivado: la hoja tampoco admite cambios. */
  workbookArchivedAt: string | null;
  duplicatedFrom: { worksheetId: string; revisionId: string } | null;
  openedFromCatalog: { snapshotId: string } | null;
}

export interface Worksheet extends WorksheetSummary {
  columns: WorksheetColumn[];
}

/** Lo que puede hacer quien pregunta: decide qué acciones se enseñan. */
export interface WorksheetCapabilities {
  write: boolean;
  approve: boolean;
}

export interface WorksheetWithCapabilities {
  worksheet: Worksheet;
  capabilities: WorksheetCapabilities;
}

export type RevisionSource =
  'initialize' | 'changeset' | 'duplicate' | 'catalog';

export const REVISION_SOURCE_LABELS: Record<RevisionSource, string> = {
  initialize: 'Hoja creada',
  changeset: 'Borrador aplicado',
  duplicate: 'Copia de otra hoja',
  catalog: 'Abierta desde un catálogo',
};

export interface RevisionEntry {
  id: string;
  sequence: number;
  schemaVersion: number;
  source: RevisionSource;
  rowCount: number;
  /** El borrador que la produjo; nulo si no salió de uno. */
  changesetId: string | null;
  createdBy: string;
  createdAt: string;
}

/**
 * Valor de una celda tal como viaja: entero, decimal y fecha como texto (para
 * no perder dígitos), booleano como tal y `null` si está vacía.
 */
export type CellValue = string | boolean | null;

export interface CellProblemView extends PublicError {
  columnId: string;
}

export interface RowItem {
  rowId: string;
  /** Por ID de columna; las calculadas ya vienen resueltas por Nest. */
  values: Record<string, CellValue>;
  problems: CellProblemView[];
}

export interface RowsPage {
  items: RowItem[];
  /** Ligado a la revisión y a la consulta: otra consulta empieza de nuevo. */
  nextCursor: string | null;
  revisionId: string;
  schemaVersion: number;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'in'
  | 'is_null';

export interface FilterPredicate {
  column: string;
  op: FilterOperator;
  value?: string | boolean | (string | boolean)[];
}

export type RowFilter =
  FilterPredicate | { and: RowFilter[] } | { or: RowFilter[] };

export interface SortTerm {
  columnId: string;
  direction: 'asc' | 'desc';
}

/** Lo que guarda una vista y lo que acepta `rows/query`. */
export interface RowQuery {
  filter?: RowFilter;
  sort?: SortTerm[];
  columns?: string[];
}

export type ViewVisibility = 'personal' | 'team';

export const VIEW_VISIBILITY_LABELS: Record<ViewVisibility, string> = {
  personal: 'Solo para mí',
  team: 'Para el equipo',
};

export interface SavedView {
  id: string;
  worksheetId: string;
  ownerId: string;
  name: string;
  visibility: ViewVisibility;
  query: RowQuery;
  createdAt: string;
  updatedAt: string;
  /** Su autor, o un Manager si es del equipo. */
  canEdit: boolean;
}

export interface SavedViewInput {
  name: string;
  visibility: ViewVisibility;
  query: RowQuery;
}

/** Definición de una columna al crear una hoja. */
export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  required?: boolean;
  options?: { label: string }[];
  formula?: Record<string, unknown>;
}

export interface Page<Item> {
  items: Item[];
  page: PageInfo;
}

/** Una hoja o un libro archivado, o con el libro archivado, es de solo lectura. */
export function isArchivedWorksheet(worksheet: WorksheetSummary) {
  return worksheet.archivedAt !== null || worksheet.workbookArchivedAt !== null;
}

export function isWorkbook(value: unknown): value is Workbook {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.name === 'string' &&
    isDateString(value.createdAt) &&
    isNullableString(value.archivedAt)
  );
}

export function isWorksheetSummary(value: unknown): value is WorksheetSummary {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.workbookId) &&
    typeof value.name === 'string' &&
    Number.isInteger(value.schemaVersion) &&
    isRevisionSummary(value.headRevision) &&
    isNullableString(value.archivedAt) &&
    isNullableString(value.workbookArchivedAt)
  );
}

export function isWorksheet(value: unknown): value is Worksheet {
  if (!isRecord(value)) return false;
  const { columns } = value;
  return (
    isWorksheetSummary(value) &&
    Array.isArray(columns) &&
    columns.every(isWorksheetColumn)
  );
}

export function isWorksheetWithCapabilities(
  value: unknown,
): value is WorksheetWithCapabilities {
  return (
    isRecord(value) &&
    isWorksheet(value.worksheet) &&
    isRecord(value.capabilities) &&
    typeof value.capabilities.write === 'boolean' &&
    typeof value.capabilities.approve === 'boolean'
  );
}

export function isRevisionEntry(value: unknown): value is RevisionEntry {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    Number.isInteger(value.sequence) &&
    typeof value.source === 'string' &&
    Object.hasOwn(REVISION_SOURCE_LABELS, value.source) &&
    Number.isInteger(value.rowCount) &&
    isNullableString(value.changesetId) &&
    isDateString(value.createdAt)
  );
}

export function isRowsPage(value: unknown): value is RowsPage {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isRowItem) &&
    isNullableString(value.nextCursor) &&
    isNonEmptyString(value.revisionId) &&
    Number.isInteger(value.schemaVersion)
  );
}

export function isSavedView(value: unknown): value is SavedView {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.name === 'string' &&
    (value.visibility === 'personal' || value.visibility === 'team') &&
    isRecord(value.query) &&
    typeof value.canEdit === 'boolean'
  );
}

export function isCellValue(value: unknown): value is CellValue {
  return (
    value === null || typeof value === 'string' || typeof value === 'boolean'
  );
}

/** `{ <clave>: Item[], page }`, la forma de todos los listados paginados. */
export function readListPage<Item>(
  value: unknown,
  key: string,
  isItem: (item: unknown) => item is Item,
): Page<Item> | null {
  if (!isRecord(value) || !isPageInfo(value.page)) return null;
  const items = value[key];
  if (!Array.isArray(items) || !items.every(isItem)) return null;
  return { items, page: value.page };
}

function isRevisionSummary(value: unknown): value is RevisionSummary {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    Number.isInteger(value.sequence) &&
    Number.isInteger(value.rowCount)
  );
}

function isWorksheetColumn(value: unknown): value is WorksheetColumn {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.name === 'string' &&
    COLUMN_TYPES.some((type) => type === value.type) &&
    Number.isInteger(value.position) &&
    typeof value.required === 'boolean'
  );
}

function isRowItem(value: unknown): value is RowItem {
  return (
    isRecord(value) &&
    isNonEmptyString(value.rowId) &&
    isRecord(value.values) &&
    Object.values(value.values).every(isCellValue) &&
    Array.isArray(value.problems) &&
    value.problems.every(isCellProblemView)
  );
}

function isCellProblemView(value: unknown): value is CellProblemView {
  if (!isRecord(value)) return false;
  const { columnId } = value;
  return isPublicError(value) && typeof columnId === 'string';
}

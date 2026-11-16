import {
  isDateString,
  isNonEmptyString,
  isRecord,
} from '../../../utils/guards';
import type {
  AddableColumnType,
  Changeset,
  ChangesetStatus,
} from './changesets';
import type { RowFilter, SortTerm } from './worksheets';

/**
 * Entradas y salidas de una hoja en la API: importar CSV o XLSX a un borrador
 * (`src/worksheet-imports`), exportar (`src/worksheet-exports`) y el puente
 * con el catálogo (`src/worksheet-catalog-snapshots`).
 */
export type TransferFormat = 'csv' | 'xlsx';
export type CsvDelimiter = 'comma' | 'semicolon';

export const CSV_DELIMITER_LABELS: Record<CsvDelimiter, string> = {
  comma: 'Coma (,)',
  semicolon: 'Punto y coma (;)',
};

/** Una cabecera del archivo va a una columna que existe o a una nueva. */
export type ColumnMapping =
  | { header: string; columnId: string }
  | {
      header: string;
      newColumn: {
        name: string;
        type: AddableColumnType;
        options?: { label: string }[];
      };
    };

export type ImportMode = 'append' | 'upsert';

export const IMPORT_MODE_LABELS: Record<ImportMode, string> = {
  append: 'Añadir filas nuevas',
  upsert: 'Actualizar las que coincidan y añadir el resto',
};

/** Lo que no depende del archivo y se puede guardar como plantilla. */
export interface MappingTemplate {
  mode: ImportMode;
  /** Solo en `upsert`: la columna que identifica cada fila. */
  matchColumnId: string | null;
  decimalSeparator: '.' | ',';
  booleanLabels: { true: string[]; false: string[] };
  columns: ColumnMapping[];
}

/** Lo que cambia con cada archivo. */
export interface FileOptions {
  title?: string;
  excludeRows?: number[];
  delimiter?: CsvDelimiter;
  sheet?: string | null;
  headerRow?: number;
}

/** El campo `options` de `POST …/imports`. Con plantilla, solo lo del archivo. */
export type ImportOptions = FileOptions & Partial<MappingTemplate>;

export interface ImportPreview {
  format: TransferFormat;
  /** Solo XLSX: las hojas del libro y la que se leyó (`null` si hay que elegir). */
  sheets?: string[];
  sheet?: string | null;
  fileBytes: number;
  rows: number;
  headers: string[];
  sample: string[][];
  /** Cabecera → columna existente con el mismo nombre. */
  suggestedColumns: { header: string; columnId: string }[];
  /** Solo con plantilla: qué encuentra y qué cabeceras le faltan a este archivo. */
  template?: {
    id: string;
    name: string;
    columns: ColumnMapping[];
    missingHeaders: string[];
  };
}

export interface ImportReport {
  rows: number;
  inserted: number;
  updated: number;
  unchanged: number;
  excluded: number;
  invalid: number;
  newColumns: number;
  ignoredHeaders: string[];
}

export interface WorksheetImportSummary {
  id: string;
  worksheetId: string;
  changesetId: string;
  format: TransferFormat;
  fileBytes: number;
  report: ImportReport;
  createdAt: string;
  excludedRowCount: number;
  changesetStatus: ChangesetStatus;
}

/** Importar crea un borrador: se sigue en su revisión, como cualquier otro. */
export interface CreatedImport {
  import: { id: string; report: ImportReport };
  changeset: Changeset;
  /** La versión del borrador creado, para seguir editándolo. */
  etag: string | null;
}

export interface ImportMapping {
  id: string;
  worksheetId: string;
  name: string;
  mapping: MappingTemplate;
  createdAt: string;
}

export interface WorksheetExport {
  id: string;
  worksheetId: string;
  revisionId: string;
  revisionSequence: number;
  format: TransferFormat;
  rowCount: number;
  columnCount: number;
  /** Celdas con problema que se exportaron tal cual. */
  problemCellCount: number;
  byteSize: number;
  createdAt: string;
}

export interface ExportRequest {
  format: TransferFormat;
  revisionId?: string;
  columns?: string[];
  filter?: RowFilter;
  sort?: SortTerm[];
  delimiter?: CsvDelimiter;
  /** `escape` protege de fórmulas al abrir el CSV en una hoja de cálculo. */
  formulas?: 'escape' | 'keep';
}

export interface CatalogSnapshotRequest {
  /** La columna que será el identificador del producto. */
  idColumnId: string;
  revisionId?: string;
  columns?: string[];
  filter?: RowFilter;
  sort?: SortTerm[];
}

/** Procedencia de un catálogo creado desde una revisión de hoja. */
export interface WorksheetCatalogSnapshot {
  snapshotId: string;
  worksheetId: string;
  revisionSequence: number;
  rowCount: number;
  createdAt: string;
}

export function isImportPreview(value: unknown): value is ImportPreview {
  return (
    isRecord(value) &&
    (value.format === 'csv' || value.format === 'xlsx') &&
    Number.isInteger(value.rows) &&
    isStringList(value.headers) &&
    Array.isArray(value.sample) &&
    value.sample.every(isStringList) &&
    Array.isArray(value.suggestedColumns)
  );
}

export function isImportReport(value: unknown): value is ImportReport {
  return (
    isRecord(value) &&
    Number.isInteger(value.rows) &&
    Number.isInteger(value.inserted) &&
    Number.isInteger(value.updated) &&
    Number.isInteger(value.excluded) &&
    Number.isInteger(value.invalid)
  );
}

export function isWorksheetImportSummary(
  value: unknown,
): value is WorksheetImportSummary {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.changesetId) &&
    (value.format === 'csv' || value.format === 'xlsx') &&
    isImportReport(value.report) &&
    isDateString(value.createdAt) &&
    typeof value.changesetStatus === 'string'
  );
}

export function isImportMapping(value: unknown): value is ImportMapping {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.name === 'string' &&
    isRecord(value.mapping) &&
    Array.isArray(value.mapping.columns) &&
    isDateString(value.createdAt)
  );
}

export function isWorksheetExport(value: unknown): value is WorksheetExport {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    (value.format === 'csv' || value.format === 'xlsx') &&
    Number.isInteger(value.rowCount) &&
    Number.isInteger(value.byteSize) &&
    isDateString(value.createdAt)
  );
}

export function isWorksheetCatalogSnapshot(
  value: unknown,
): value is WorksheetCatalogSnapshot {
  return (
    isRecord(value) &&
    isNonEmptyString(value.snapshotId) &&
    isNonEmptyString(value.worksheetId) &&
    Number.isInteger(value.rowCount)
  );
}

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

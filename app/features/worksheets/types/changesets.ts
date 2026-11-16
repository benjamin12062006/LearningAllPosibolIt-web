import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';
import type { CellValue, ColumnType, SelectionOption } from './worksheets';

/**
 * Formas de los borradores de hoja en la API (`src/changesets/*.ts`): las
 * operaciones, el borrador, su comparación con la revisión actual y lo que
 * devuelven decidir y aplicar.
 */
export const CHANGESET_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'conflicted',
  'applied',
  'cancelled',
] as const;
export type ChangesetStatus = (typeof CHANGESET_STATUSES)[number];

export const CHANGESET_STATUS_LABELS: Record<ChangesetStatus, string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  conflicted: 'Con conflicto',
  applied: 'Aplicado',
  cancelled: 'Cancelado',
};

export type ChangesetSource = 'manual' | 'revert' | 'import' | 'ai';

export const CHANGESET_SOURCE_LABELS: Record<ChangesetSource, string> = {
  manual: 'A mano',
  revert: 'Vuelta atrás',
  import: 'Importación',
  ai: 'Asistente',
};

/** Máximo de operaciones por guardado (`MAX_OPERATIONS` en la API). */
export const MAX_OPERATIONS = 1000;

/** Tipos que se pueden añadir desde un borrador: los que guardan valor. */
export type AddableColumnType = Exclude<ColumnType, 'calculated'>;

export interface SetCell {
  type: 'set_cell';
  rowId: string;
  columnId: string;
  /** `null` vacía la celda. */
  value: CellValue;
}

export interface InsertRow {
  type: 'insert_row';
  rowId: string;
  sortKey?: string;
  values: Record<string, string | boolean>;
}

export interface DeleteRow {
  type: 'delete_row';
  rowId: string;
}

export interface AddColumn {
  type: 'add_column';
  columnId: string;
  name: string;
  columnType: AddableColumnType;
  options?: SelectionOption[];
}

export interface RenameColumn {
  type: 'rename_column';
  columnId: string;
  name: string;
}

export interface DeleteColumn {
  type: 'delete_column';
  columnId: string;
}

export interface ChangeColumnType {
  type: 'change_column_type';
  columnId: string;
  columnType: AddableColumnType;
  options?: SelectionOption[];
}

export type RowOperation = SetCell | InsertRow | DeleteRow;
export type SchemaOperation =
  AddColumn | RenameColumn | DeleteColumn | ChangeColumnType;
export type Operation = SchemaOperation | RowOperation;

export interface ChangesetSummary {
  id: string;
  worksheetId: string;
  authorId: string;
  source: ChangesetSource;
  title: string;
  status: ChangesetStatus;
  /** Cambia con cada guardado: es el `ETag` que pide el siguiente. */
  draftVersion: number;
  baseRevisionId: string;
  baseSequence: number;
  baseSchemaVersion: number;
  /** Existe desde el envío: es lo que se revisa y se aprueba. */
  contentHash: string | null;
  appliedRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
  operationCount: number;
}

export interface Changeset extends Omit<ChangesetSummary, 'operationCount'> {
  operations: Operation[];
}

export type DiffStatus = 'change' | 'noop' | 'satisfied' | 'conflict';

export type ConflictReason =
  | 'row_deleted'
  | 'row_edited'
  | 'row_exists'
  | 'column_deleted'
  | 'schema_changed';

export const CONFLICT_REASON_LABELS: Record<ConflictReason, string> = {
  row_deleted: 'La fila se borró en la hoja',
  row_edited: 'Alguien cambió ese valor en la hoja',
  row_exists: 'La fila ya existe en la hoja',
  column_deleted: 'La columna se borró en la hoja',
  schema_changed: 'Las columnas de la hoja cambiaron',
};

/** Una operación comparada con la base, la revisión actual y lo propuesto. */
export interface DiffEntry {
  index: number;
  type: Operation['type'];
  /** `null` en los cambios de esquema. */
  rowId: string | null;
  /** `null` en los cambios de fila entera. */
  columnId: string | null;
  base: unknown;
  head: unknown;
  proposed: unknown;
  status: DiffStatus;
  reason: ConflictReason | null;
}

export interface ColumnConversion {
  columnId: string;
  fromType: ColumnType;
  toType: ColumnType;
  convertedCells: number;
  /** Celdas sin forma exacta en el tipo nuevo: impiden enviar. */
  incompatibleCells: number;
}

/** Lo que una persona ve antes de enviar o aprobar. */
export interface ChangesetReview {
  baseRevisionId: string;
  headRevisionId: string;
  contentHash: string;
  entries: DiffEntry[];
  counts: Record<DiffStatus, number>;
  /** Filas que tendría la hoja si se aplicara ahora. */
  resultingRowCount: number;
  problems: { rowId: string; columnId: string; code: string }[];
  columnConversions: ColumnConversion[];
}

export interface Decision {
  id: string;
  actorId: string;
  decision: 'accept' | 'reject';
  policy: 'peer' | 'single_member';
  reason: string | null;
  createdAt: string;
}

export interface ApplyResult {
  changesetId: string;
  revisionId: string;
  sequence: number;
}

/** Cómo resolver un conflicto: lo propuesto o lo que hay ahora en la hoja. */
export interface ConflictResolution {
  rowId: string | null;
  columnId: string | null;
  choice: 'proposed' | 'head';
}

/** Un borrador que todavía admite cambios de la persona. */
export function isEditableChangeset(changeset: { status: ChangesetStatus }) {
  return changeset.status === 'draft';
}

/** Estados en los que el borrador ya no cambia. */
export function isFinishedChangeset(changeset: { status: ChangesetStatus }) {
  return changeset.status === 'applied' || changeset.status === 'cancelled';
}

export function isRowOperation(
  operation: Operation,
): operation is RowOperation {
  return 'rowId' in operation;
}

export function isChangeset(value: unknown): value is Changeset {
  if (!isRecord(value)) return false;
  const { operations } = value;
  return (
    hasChangesetHeader(value) &&
    Array.isArray(operations) &&
    operations.every(isOperation)
  );
}

export function isChangesetSummary(value: unknown): value is ChangesetSummary {
  return (
    isRecord(value) &&
    hasChangesetHeader(value) &&
    Number.isInteger(value.operationCount)
  );
}

export function isChangesetReview(value: unknown): value is ChangesetReview {
  return (
    isRecord(value) &&
    isNonEmptyString(value.headRevisionId) &&
    isNonEmptyString(value.contentHash) &&
    Array.isArray(value.entries) &&
    value.entries.every(isDiffEntry) &&
    isRecord(value.counts) &&
    Number.isInteger(value.resultingRowCount) &&
    Array.isArray(value.problems) &&
    Array.isArray(value.columnConversions)
  );
}

export function isApplyResult(value: unknown): value is ApplyResult {
  return (
    isRecord(value) &&
    isNonEmptyString(value.changesetId) &&
    isNonEmptyString(value.revisionId) &&
    Number.isInteger(value.sequence)
  );
}

export function isDecision(value: unknown): value is Decision {
  return (
    isRecord(value) &&
    (value.decision === 'accept' || value.decision === 'reject') &&
    isDateString(value.createdAt)
  );
}

/** Lo que comparten el borrador entero y su resumen del historial. */
function hasChangesetHeader(value: Record<string, unknown>): boolean {
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.worksheetId) &&
    typeof value.title === 'string' &&
    CHANGESET_STATUSES.some((status) => status === value.status) &&
    Number.isInteger(value.draftVersion) &&
    isNonEmptyString(value.baseRevisionId) &&
    isNullableString(value.contentHash) &&
    isNullableString(value.appliedRevisionId) &&
    isDateString(value.createdAt)
  );
}

function isOperation(value: unknown): value is Operation {
  return isRecord(value) && typeof value.type === 'string';
}

function isDiffEntry(value: unknown): value is DiffEntry {
  return (
    isRecord(value) &&
    Number.isInteger(value.index) &&
    typeof value.type === 'string' &&
    isNullableString(value.rowId) &&
    isNullableString(value.columnId) &&
    typeof value.status === 'string'
  );
}

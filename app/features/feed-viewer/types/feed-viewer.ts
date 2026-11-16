import {
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';
import {
  isCounts,
  isRowOutcome,
  isRowProblem,
  type EvaluationCounts,
  type RowOutcome,
  type RowProblem,
} from '../../evaluations/types/evaluations';
import {
  isProductExport,
  type ProductExport,
} from '../../exports/types/exports';
import {
  isFeedVersion,
  isPublishedVersion,
  type FeedVersion,
  type PublishedVersion,
} from '../../feeds/types/feeds';
import { isPageInfo, type PageInfo } from '../../projects/types/projects';

/**
 * Formas del visor y del diagnóstico del feed en la API
 * (`src/feed-viewer/feed-viewer.service.ts`, `tsv-comparison.ts` y
 * `src/evaluations/evaluations.types.ts`; ficha feed-viewer 01).
 */

/** De qué archivo se leen los productos: una exportación o una versión publicada. */
export type ProductSourceRef =
  | { kind: 'export'; exportId: string }
  | { kind: 'feed_version'; feedId: string; versionId: string };

export interface TsvProduct {
  /** Línea en el TSV. */
  line: number;
  /** Una entrada por cada columna del archivo. */
  values: Record<string, string>;
}

export interface ProductPage {
  columns: string[];
  products: TsvProduct[];
  page: PageInfo;
  /** Total del archivo, no el de la búsqueda. */
  rowCount: number;
}

export type ProductSource =
  | { kind: 'export'; export: ProductExport }
  | { kind: 'feed_version'; feedId: string; version: FeedVersion };

export interface ProductDetail {
  columns: string[];
  product: TsvProduct;
  source: ProductSource;
}

/** Por qué la URL pública no entrega el TSV. */
export type DeliveryBlock =
  'no_published_version' | 'delivery_disabled' | 'file_unavailable';

export interface DeliveryStatus {
  delivering: boolean;
  reason: DeliveryBlock | null;
  deliveryEnabled: boolean;
  publishedVersion: PublishedVersion | null;
}

export const DELIVERY_BLOCK_LABELS: Record<DeliveryBlock, string> = {
  no_published_version: 'Todavía no hay ninguna versión publicada.',
  delivery_disabled: 'La entrega está desactivada: la URL no tiene token.',
  file_unavailable: 'El archivo publicado no está disponible ahora mismo.',
};

export interface ProblemGroup extends RowProblem {
  productCount: number;
}

/** Productos que una regla del proyecto dejó fuera a propósito. */
export interface ExclusionGroup {
  /** Posición de la regla, desde 1. */
  rulePosition: number;
  /** La regla tal como estaba en la revisión con la que se evaluó. */
  rule: unknown;
  productCount: number;
}

export interface Attention {
  evaluationId: string;
  /** Un producto con dos problemas cuenta una vez aquí y está en dos grupos. */
  affectedProducts: number;
  problemGroups: ProblemGroup[];
  excludedProducts: number;
  exclusionGroups: ExclusionGroup[];
}

export const CHANGE_KINDS = ['added', 'removed', 'modified'] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

export const CHANGE_KIND_LABELS: Record<ChangeKind, string> = {
  added: 'Añadidos',
  removed: 'Retirados',
  modified: 'Modificados',
};

export interface FieldChange {
  field: string;
  /** `null`: ese archivo no tiene la columna. */
  before: string | null;
  after: string | null;
}

export interface ProductChange {
  id: string;
  change: ChangeKind;
  /** Solo en los modificados. */
  fields: FieldChange[];
}

export interface ChangeCounts {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

export interface FeedComparison {
  candidate: ProductExport;
  published: PublishedVersion;
  /** Del archivo entero, como `changedFields`; `changes` es la página pedida. */
  counts: ChangeCounts;
  changedFields: { field: string; productCount: number }[];
  changes: ProductChange[];
  page: PageInfo;
}

export interface PreviewedOutcome {
  outcome: RowOutcome;
  problems: RowProblem[];
  excludedByRule: number | null;
}

export interface ValueChange {
  attribute: string;
  before: string | null;
  after: string | null;
}

export interface ProductPreview {
  sourceRow: number;
  externalId: string;
  current: PreviewedOutcome;
  proposed: PreviewedOutcome;
  values: ValueChange[];
}

/** Qué cambiaría en un catálogo con unas reglas que todavía no se guardaron. */
export interface RulesPreview {
  snapshotId: string;
  /** La revisión guardada con la que se compara. */
  baseRevision: number;
  counts: { current: EvaluationCounts; proposed: EvaluationCounts };
  problems: {
    appeared: ProblemGroup[];
    resolved: ProblemGroup[];
    persisting: ProblemGroup[];
  };
  outcomeChanges: { from: RowOutcome; to: RowOutcome; productCount: number }[];
  changedValues: { attribute: string; productCount: number }[];
  changedProducts: number;
  /** La página pedida de los productos a los que les cambia algo. */
  products: ProductPreview[];
  page: PageInfo;
}

export function isProductPage(value: unknown): value is ProductPage {
  return (
    isRecord(value) &&
    isStringList(value.columns) &&
    Array.isArray(value.products) &&
    value.products.every(isTsvProduct) &&
    isPageInfo(value.page) &&
    Number.isInteger(value.rowCount)
  );
}

export function isProductDetail(value: unknown): value is ProductDetail {
  return (
    isRecord(value) &&
    isStringList(value.columns) &&
    isTsvProduct(value.product) &&
    isProductSource(value.source)
  );
}

export function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return (
    isRecord(value) &&
    typeof value.delivering === 'boolean' &&
    (value.reason === null || isDeliveryBlock(value.reason)) &&
    typeof value.deliveryEnabled === 'boolean' &&
    (value.publishedVersion === null ||
      isPublishedVersion(value.publishedVersion))
  );
}

export function isAttention(value: unknown): value is Attention {
  return (
    isRecord(value) &&
    isNonEmptyString(value.evaluationId) &&
    Number.isInteger(value.affectedProducts) &&
    Array.isArray(value.problemGroups) &&
    value.problemGroups.every(isProblemGroup) &&
    Number.isInteger(value.excludedProducts) &&
    Array.isArray(value.exclusionGroups) &&
    value.exclusionGroups.every(isExclusionGroup)
  );
}

export function isFeedComparison(value: unknown): value is FeedComparison {
  return (
    isRecord(value) &&
    isProductExport(value.candidate) &&
    isPublishedVersion(value.published) &&
    isChangeCounts(value.counts) &&
    Array.isArray(value.changedFields) &&
    value.changedFields.every(isChangedField) &&
    Array.isArray(value.changes) &&
    value.changes.every(isProductChange) &&
    isPageInfo(value.page)
  );
}

export function isRulesPreview(value: unknown): value is RulesPreview {
  return (
    isRecord(value) &&
    isNonEmptyString(value.snapshotId) &&
    Number.isInteger(value.baseRevision) &&
    isRecord(value.counts) &&
    isCounts(value.counts.current) &&
    isCounts(value.counts.proposed) &&
    isRecord(value.problems) &&
    isProblemGroupList(value.problems.appeared) &&
    isProblemGroupList(value.problems.resolved) &&
    isProblemGroupList(value.problems.persisting) &&
    Array.isArray(value.outcomeChanges) &&
    value.outcomeChanges.every(isOutcomeChange) &&
    Array.isArray(value.changedValues) &&
    value.changedValues.every(isChangedAttribute) &&
    Number.isInteger(value.changedProducts) &&
    Array.isArray(value.products) &&
    value.products.every(isProductPreview) &&
    isPageInfo(value.page)
  );
}

export function isChangeKind(value: unknown): value is ChangeKind {
  return CHANGE_KINDS.some((kind) => kind === value);
}

function isTsvProduct(value: unknown): value is TsvProduct {
  return (
    isRecord(value) &&
    Number.isInteger(value.line) &&
    isStringRecord(value.values)
  );
}

function isProductSource(value: unknown): value is ProductSource {
  if (!isRecord(value)) return false;
  if (value.kind === 'export') return isProductExport(value.export);
  return (
    value.kind === 'feed_version' &&
    isNonEmptyString(value.feedId) &&
    isFeedVersion(value.version)
  );
}

function isDeliveryBlock(value: unknown): value is DeliveryBlock {
  return (
    typeof value === 'string' && Object.hasOwn(DELIVERY_BLOCK_LABELS, value)
  );
}

function isProblemGroup(value: unknown): value is ProblemGroup {
  if (!isRecord(value)) return false;
  const { productCount } = value;
  return isRowProblem(value) && Number.isInteger(productCount);
}

function isProblemGroupList(value: unknown): value is ProblemGroup[] {
  return Array.isArray(value) && value.every(isProblemGroup);
}

function isExclusionGroup(value: unknown): value is ExclusionGroup {
  return (
    isRecord(value) &&
    Number.isInteger(value.rulePosition) &&
    Number.isInteger(value.productCount)
  );
}

function isChangeCounts(value: unknown): value is ChangeCounts {
  return (
    isRecord(value) &&
    Number.isInteger(value.added) &&
    Number.isInteger(value.removed) &&
    Number.isInteger(value.modified) &&
    Number.isInteger(value.unchanged)
  );
}

function isChangedField(
  value: unknown,
): value is FeedComparison['changedFields'][number] {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    Number.isInteger(value.productCount)
  );
}

function isProductChange(value: unknown): value is ProductChange {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isChangeKind(value.change) &&
    Array.isArray(value.fields) &&
    value.fields.every(isFieldChange)
  );
}

function isFieldChange(value: unknown): value is FieldChange {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    isNullableString(value.before) &&
    isNullableString(value.after)
  );
}

function isOutcomeChange(
  value: unknown,
): value is RulesPreview['outcomeChanges'][number] {
  return (
    isRecord(value) &&
    isRowOutcome(value.from) &&
    isRowOutcome(value.to) &&
    Number.isInteger(value.productCount)
  );
}

function isChangedAttribute(
  value: unknown,
): value is RulesPreview['changedValues'][number] {
  return (
    isRecord(value) &&
    typeof value.attribute === 'string' &&
    Number.isInteger(value.productCount)
  );
}

function isProductPreview(value: unknown): value is ProductPreview {
  return (
    isRecord(value) &&
    Number.isInteger(value.sourceRow) &&
    typeof value.externalId === 'string' &&
    isPreviewedOutcome(value.current) &&
    isPreviewedOutcome(value.proposed) &&
    Array.isArray(value.values) &&
    value.values.every(isValueChange)
  );
}

function isPreviewedOutcome(value: unknown): value is PreviewedOutcome {
  return (
    isRecord(value) &&
    isRowOutcome(value.outcome) &&
    Array.isArray(value.problems) &&
    value.problems.every(isRowProblem) &&
    (value.excludedByRule === null || Number.isInteger(value.excludedByRule))
  );
}

function isValueChange(value: unknown): value is ValueChange {
  return (
    isRecord(value) &&
    typeof value.attribute === 'string' &&
    isNullableString(value.before) &&
    isNullableString(value.after)
  );
}

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

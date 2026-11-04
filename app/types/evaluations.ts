import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../utils/guards';
import { isPublicError, type PublicError } from './imports';
import { isPageInfo, type PageInfo } from './projects';

/** Forma de `EvaluationView` y `EvaluationRowView` en la API (`evaluations.types.ts`). */
export type EvaluationStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type RowOutcome = 'valid' | 'invalid' | 'excluded';

export interface EvaluationCounts {
  total: number;
  valid: number;
  invalid: number;
  excluded: number;
}

export interface Evaluation {
  id: string;
  snapshotId: string;
  rulesetRevision: number;
  status: EvaluationStatus;
  counts: EvaluationCounts | null;
  createdAt: string;
  finishedAt: string | null;
  error: PublicError | null;
}

/** Problema de una fila con su texto ya traducido por la API. */
export interface RowProblem {
  attribute: string;
  code: string;
  problem: { es: string; en: string };
  suggestion: { es: string; en: string };
}

export interface EvaluationRow {
  sourceRow: number;
  externalId: string;
  outcome: RowOutcome;
  /** Datos tras aplicar las reglas; `null` si la fila se excluyó antes. */
  values: Record<string, string> | null;
  problems: RowProblem[];
  /** Posición (desde 1) de la regla que la excluyó. */
  excludedByRule: number | null;
}

export interface EvaluationDetail {
  evaluation: Evaluation;
  /** Primeras 20 filas; vacía hasta que termina bien. */
  sample: EvaluationRow[];
}

/** Historial del proyecto (`GET …/evaluations`), sin muestra. */
export interface EvaluationList {
  evaluations: Evaluation[];
  page: PageInfo;
}

/** Una página del informe (`GET …/evaluations/:id/rows`). */
export interface EvaluationRowsPage {
  rows: EvaluationRow[];
  page: PageInfo;
}

/** Lo que pide `POST /projects/:id/evaluations`. */
export interface EvaluationRequest {
  snapshotId: string;
  rulesetRevision: number;
}

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  queued: 'En cola',
  running: 'Evaluando',
  succeeded: 'Terminada',
  failed: 'Con error',
};

export const OUTCOME_LABELS: Record<RowOutcome, string> = {
  valid: 'Válida',
  invalid: 'Inválida',
  excluded: 'Excluida',
};

export function isActiveEvaluation(evaluation: Evaluation) {
  return evaluation.status === 'queued' || evaluation.status === 'running';
}

export function isEvaluationDetail(value: unknown): value is EvaluationDetail {
  return (
    isRecord(value) &&
    isEvaluation(value.evaluation) &&
    Array.isArray(value.sample) &&
    value.sample.every(isEvaluationRow)
  );
}

export function isEvaluationList(value: unknown): value is EvaluationList {
  return (
    isRecord(value) &&
    Array.isArray(value.evaluations) &&
    value.evaluations.every(isEvaluation) &&
    isPageInfo(value.page)
  );
}

export function isEvaluationRowsPage(
  value: unknown,
): value is EvaluationRowsPage {
  return (
    isRecord(value) &&
    Array.isArray(value.rows) &&
    value.rows.every(isEvaluationRow) &&
    isPageInfo(value.page)
  );
}

export function isEvaluationRow(value: unknown): value is EvaluationRow {
  return (
    isRecord(value) &&
    Number.isInteger(value.sourceRow) &&
    typeof value.externalId === 'string' &&
    isRowOutcome(value.outcome) &&
    (value.values === null || isStringRecord(value.values)) &&
    Array.isArray(value.problems) &&
    value.problems.every(isRowProblem) &&
    (value.excludedByRule === null || Number.isInteger(value.excludedByRule))
  );
}

function isEvaluation(value: unknown): value is Evaluation {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.snapshotId) &&
    Number.isInteger(value.rulesetRevision) &&
    isEvaluationStatus(value.status) &&
    (value.counts === null || isCounts(value.counts)) &&
    isDateString(value.createdAt) &&
    isNullableString(value.finishedAt) &&
    (value.error === null || isPublicError(value.error))
  );
}

function isCounts(value: unknown): value is EvaluationCounts {
  return (
    isRecord(value) &&
    typeof value.total === 'number' &&
    typeof value.valid === 'number' &&
    typeof value.invalid === 'number' &&
    typeof value.excluded === 'number'
  );
}

function isRowProblem(value: unknown): value is RowProblem {
  return (
    isRecord(value) &&
    typeof value.attribute === 'string' &&
    typeof value.code === 'string' &&
    isLocalized(value.problem) &&
    isLocalized(value.suggestion)
  );
}

function isLocalized(value: unknown): value is { es: string; en: string } {
  return (
    isRecord(value) &&
    typeof value.es === 'string' &&
    typeof value.en === 'string'
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

function isEvaluationStatus(value: unknown): value is EvaluationStatus {
  return (
    value === 'queued' ||
    value === 'running' ||
    value === 'succeeded' ||
    value === 'failed'
  );
}

function isRowOutcome(value: unknown): value is RowOutcome {
  return value === 'valid' || value === 'invalid' || value === 'excluded';
}

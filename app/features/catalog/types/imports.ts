import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';
import { isPageInfo, type PageInfo } from '../../projects/types/projects';

/** Estados de `catalog_snapshots` y `catalog_import_jobs` en la API. */
export type ImportStatus = 'pending' | 'importing' | 'ready' | 'failed';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type ImportDelimiter = 'comma' | 'semicolon';

/** Error público de la API: el texto ya viene traducido. */
export interface PublicError {
  code: string;
  message: { es: string; en: string };
}

export interface CatalogImport {
  id: string;
  originalName: string;
  idColumn: string;
  delimiter: ImportDelimiter;
  byteSize: number;
  status: ImportStatus;
  rowCount: number | null;
  createdAt: string;
  finishedAt: string | null;
  error: PublicError | null;
  job: { id: string; status: JobStatus; processedRows: number } | null;
}

export interface ImportList {
  imports: CatalogImport[];
  page: PageInfo;
}

export interface ImportJob {
  id: string;
  status: JobStatus;
  processedRows: number;
  error: PublicError | null;
}

/** Respuesta 202 de `POST /projects/:id/imports`. */
export interface ImportAcceptance {
  snapshotId: string;
  jobId: string;
}

/** Importación con sus cabeceras (`GET …/imports/:snapshotId`); `null` hasta que está lista. */
export interface ImportSnapshot {
  id: string;
  originalName: string;
  status: ImportStatus;
  headers: string[] | null;
}

export interface ImportUpload {
  file: File;
  idColumn: string;
  delimiter: ImportDelimiter;
}

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  pending: 'En cola',
  importing: 'Importando',
  ready: 'Lista',
  failed: 'Con error',
};

export function isFinishedJob(job: ImportJob) {
  return job.status === 'succeeded' || job.status === 'failed';
}

export function isCatalogImport(value: unknown): value is CatalogImport {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.originalName === 'string' &&
    typeof value.idColumn === 'string' &&
    (value.delimiter === 'comma' || value.delimiter === 'semicolon') &&
    typeof value.byteSize === 'number' &&
    isImportStatus(value.status) &&
    (value.rowCount === null || typeof value.rowCount === 'number') &&
    isDateString(value.createdAt) &&
    isNullableString(value.finishedAt) &&
    (value.error === null || isPublicError(value.error)) &&
    (value.job === null || isListedJob(value.job))
  );
}

export function isImportList(value: unknown): value is ImportList {
  return (
    isRecord(value) &&
    Array.isArray(value.imports) &&
    value.imports.every(isCatalogImport) &&
    isPageInfo(value.page)
  );
}

export function isImportJob(value: unknown): value is ImportJob {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isJobStatus(value.status) &&
    typeof value.processedRows === 'number' &&
    (value.error === null || isPublicError(value.error))
  );
}

export function isImportAcceptance(value: unknown): value is ImportAcceptance {
  return (
    isRecord(value) &&
    isNonEmptyString(value.snapshotId) &&
    isNonEmptyString(value.jobId)
  );
}

export function isImportSnapshot(value: unknown): value is ImportSnapshot {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.originalName === 'string' &&
    isImportStatus(value.status) &&
    (value.headers === null ||
      (Array.isArray(value.headers) &&
        value.headers.every((header) => typeof header === 'string')))
  );
}

export function isPublicError(value: unknown): value is PublicError {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    isRecord(value.message) &&
    typeof value.message.es === 'string' &&
    typeof value.message.en === 'string'
  );
}

function isListedJob(value: unknown): value is CatalogImport['job'] {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isJobStatus(value.status) &&
    typeof value.processedRows === 'number'
  );
}

function isImportStatus(value: unknown): value is ImportStatus {
  return (
    value === 'pending' ||
    value === 'importing' ||
    value === 'ready' ||
    value === 'failed'
  );
}

function isJobStatus(value: unknown): value is JobStatus {
  return (
    value === 'queued' ||
    value === 'running' ||
    value === 'succeeded' ||
    value === 'failed'
  );
}

import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';
import {
  isPublicError,
  type ImportDelimiter,
  type PublicError,
} from '../../catalog/types/imports';
import { isPageInfo, type PageInfo } from '../../projects/types/projects';

/** Formas de `FeedView` y compañía en la API (`src/feeds/feeds.types.ts`). */
export type PublishedBy = 'operator' | 'refresh';

export type RefreshStatus =
  'queued' | 'running' | 'succeeded' | 'retry_wait' | 'failed';

export type RefreshStage = 'fetch' | 'import' | 'evaluate' | 'publish';

export type RefreshOutcome =
  'published' | 'unchanged' | 'needs_review' | 'conflict';

export interface PublishedVersion {
  id: string;
  /** Nulos si se borró la importación de la que salió: la versión sigue. */
  exportId: string | null;
  evaluationId: string | null;
  rowCount: number;
  byteSize: number;
  tsvChecksum: string;
  publishedBy: PublishedBy;
  publishedAt: string;
}

export interface FeedVersion extends PublishedVersion {
  current: boolean;
  /** `false` si la retención ya retiró su archivo. */
  fileRetained: boolean;
}

export interface FeedSource {
  url: string;
  idColumn: string;
  delimiter: ImportDelimiter;
}

export interface FeedPolicy {
  rulesetRevision: number;
  maxInvalid: number;
  maxExcluded: number;
  maxDropPercent: number;
  engineVersion: string;
  profileVersion: string;
  approvedAt: string;
}

export interface FeedSchedule {
  enabled: boolean;
  /** `HH:MM`, hora local de `timeZone`. */
  refreshTime: string;
  timeZone: string;
}

/** El último intento de actualización: la «alerta» del feed. */
export interface LastRefresh {
  id: string;
  status: RefreshStatus;
  stage: RefreshStage;
  outcome: RefreshOutcome | null;
  error: PublicError | null;
  scheduledFor: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface Feed {
  id: string;
  /** Lo que se envía al publicar: si cambió, alguien publicó entretanto. */
  generation: number;
  deliveryEnabled: boolean;
  publishedVersion: PublishedVersion | null;
  source: FeedSource | null;
  policy: FeedPolicy | null;
  schedule: FeedSchedule | null;
  lastRefresh: LastRefresh | null;
  createdAt: string;
  updatedAt: string;
}

/** Al crear el feed o rotar el token: la única vez que llega la URL. */
export interface FeedWithDelivery {
  feed: Feed;
  /** Relativa a la raíz de la API: `/feeds/<token>.tsv`. */
  deliveryUrl: string;
}

export interface FeedVersionList {
  versions: FeedVersion[];
  page: PageInfo;
}

export const PUBLISHED_BY_LABELS: Record<PublishedBy, string> = {
  operator: 'a mano',
  refresh: 'por la actualización diaria',
};

export function isFeed(value: unknown): value is Feed {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    Number.isInteger(value.generation) &&
    typeof value.deliveryEnabled === 'boolean' &&
    (value.publishedVersion === null ||
      isPublishedVersion(value.publishedVersion)) &&
    (value.source === null || isFeedSource(value.source)) &&
    (value.policy === null || isFeedPolicy(value.policy)) &&
    (value.schedule === null || isFeedSchedule(value.schedule)) &&
    (value.lastRefresh === null || isLastRefresh(value.lastRefresh)) &&
    isDateString(value.createdAt) &&
    isDateString(value.updatedAt)
  );
}

export function isFeedWithDelivery(value: unknown): value is FeedWithDelivery {
  return (
    isRecord(value) &&
    isFeed(value.feed) &&
    typeof value.deliveryUrl === 'string' &&
    value.deliveryUrl.startsWith('/feeds/')
  );
}

export function isFeedVersionList(value: unknown): value is FeedVersionList {
  return (
    isRecord(value) &&
    Array.isArray(value.versions) &&
    value.versions.every(isFeedVersion) &&
    isPageInfo(value.page)
  );
}

export function isLastRefresh(value: unknown): value is LastRefresh {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isRefreshStatus(value.status) &&
    isRefreshStage(value.stage) &&
    (value.outcome === null || isRefreshOutcome(value.outcome)) &&
    (value.error === null || isPublicError(value.error)) &&
    isNullableString(value.scheduledFor) &&
    isDateString(value.createdAt) &&
    isNullableString(value.finishedAt)
  );
}

/** En cola, descargando, evaluando o esperando un reintento: todavía no acabó. */
export function isActiveRefresh(refresh: LastRefresh) {
  return refresh.status !== 'succeeded' && refresh.status !== 'failed';
}

export function isPublishedVersion(value: unknown): value is PublishedVersion {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNullableString(value.exportId) &&
    isNullableString(value.evaluationId) &&
    Number.isInteger(value.rowCount) &&
    Number.isInteger(value.byteSize) &&
    typeof value.tsvChecksum === 'string' &&
    (value.publishedBy === 'operator' || value.publishedBy === 'refresh') &&
    isDateString(value.publishedAt)
  );
}

export function isFeedVersion(value: unknown): value is FeedVersion {
  return (
    isPublishedVersion(value) &&
    isRecord(value) &&
    typeof value.current === 'boolean' &&
    typeof value.fileRetained === 'boolean'
  );
}

function isFeedSource(value: unknown): value is FeedSource {
  return (
    isRecord(value) &&
    typeof value.url === 'string' &&
    typeof value.idColumn === 'string' &&
    (value.delimiter === 'comma' || value.delimiter === 'semicolon')
  );
}

function isFeedPolicy(value: unknown): value is FeedPolicy {
  return (
    isRecord(value) &&
    Number.isInteger(value.rulesetRevision) &&
    Number.isInteger(value.maxInvalid) &&
    Number.isInteger(value.maxExcluded) &&
    Number.isInteger(value.maxDropPercent) &&
    typeof value.engineVersion === 'string' &&
    typeof value.profileVersion === 'string' &&
    isDateString(value.approvedAt)
  );
}

function isFeedSchedule(value: unknown): value is FeedSchedule {
  return (
    isRecord(value) &&
    typeof value.enabled === 'boolean' &&
    typeof value.refreshTime === 'string' &&
    typeof value.timeZone === 'string'
  );
}

function isRefreshStatus(value: unknown): value is RefreshStatus {
  return (
    value === 'queued' ||
    value === 'running' ||
    value === 'succeeded' ||
    value === 'retry_wait' ||
    value === 'failed'
  );
}

function isRefreshStage(value: unknown): value is RefreshStage {
  return (
    value === 'fetch' ||
    value === 'import' ||
    value === 'evaluate' ||
    value === 'publish'
  );
}

function isRefreshOutcome(value: unknown): value is RefreshOutcome {
  return (
    value === 'published' ||
    value === 'unchanged' ||
    value === 'needs_review' ||
    value === 'conflict'
  );
}

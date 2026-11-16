import {
  scopePath,
  type ProjectScope,
} from '../../projects/types/project-scope';
import {
  isApplyResult,
  isChangeset,
  isChangesetReview,
  isChangesetSummary,
  isDecision,
  type ApplyResult,
  type Changeset,
  type ChangesetReview,
  type ChangesetStatus,
  type ChangesetSummary,
  type ConflictResolution,
  type Decision,
  type Operation,
} from '../types/changesets';
import type { Page } from '../types/worksheets';
import { isRecord } from '../../../utils/guards';
import {
  invalidResponse,
  type ApiClient,
  type VersionedResponse,
} from '../../../services/api-client';
import { requirePage, worksheetPath } from './worksheets';

/** Un borrador y la versión que el siguiente guardado manda en `If-Match`. */
export interface VersionedChangeset {
  changeset: Changeset;
  /** Tal cual llega (`"3"`). */
  etag: string;
}

export interface DecisionRequest {
  decision: 'accept' | 'reject';
  /** Lo que la persona tenía delante al decidir: versión, contenido y revisión. */
  draftVersion: number;
  contentHash: string;
  expectedHeadRevisionId: string;
  reason?: string;
}

export interface ApplyRequest {
  contentHash: string;
  expectedHeadRevisionId: string;
}

/**
 * Borradores de una hoja: guardar sin perder cambios (`If-Match`), revisar,
 * decidir, aplicar una sola vez (`Idempotency-Key`), resolver conflictos y
 * proponer la vuelta atrás.
 */
export function createChangesetsService(api: ApiClient) {
  return {
    async create(
      scope: ProjectScope,
      worksheetId: string,
      title: string,
    ): Promise<VersionedChangeset> {
      const response = await api.requestWithETag(
        `${worksheetPath(scope, worksheetId)}/changesets`,
        { method: 'POST', body: { title } },
      );
      return readVersioned(response);
    },

    /** Sin `status`, todos. Vienen sin operaciones: se leen al abrir el borrador. */
    async list(
      scope: ProjectScope,
      worksheetId: string,
      query: { limit: number; offset: number; status?: ChangesetStatus },
    ): Promise<Page<ChangesetSummary>> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/changesets`,
        { query: { ...query } },
      );
      return requirePage(response, 'changesets', isChangesetSummary);
    },

    async find(
      scope: ProjectScope,
      changesetId: string,
    ): Promise<VersionedChangeset> {
      const response = await api.requestWithETag(
        changesetPath(scope, changesetId),
      );
      return readVersioned(response);
    },

    /**
     * Guarda todas las operaciones del borrador. `etag` es la versión que se
     * editó: sin ella Nest responde 428 y con otra, 412 (alguien guardó antes).
     */
    async saveOperations(
      scope: ProjectScope,
      changesetId: string,
      operations: Operation[],
      etag: string,
    ): Promise<VersionedChangeset> {
      const response = await api.requestWithETag(
        `${changesetPath(scope, changesetId)}/operations`,
        { method: 'PUT', body: { operations }, headers: { 'If-Match': etag } },
      );
      return readVersioned(response);
    },

    /** Cada operación comparada con la base y con la revisión actual. */
    async review(
      scope: ProjectScope,
      changesetId: string,
    ): Promise<ChangesetReview> {
      const response = await api.request(
        `${changesetPath(scope, changesetId)}/diff`,
      );
      if (isRecord(response) && isChangesetReview(response.review)) {
        return response.review;
      }
      throw invalidResponse();
    },

    async submit(
      scope: ProjectScope,
      changesetId: string,
      draftVersion: number,
    ): Promise<VersionedChangeset> {
      return transition(scope, changesetId, 'submit', { draftVersion });
    },

    async reopen(
      scope: ProjectScope,
      changesetId: string,
      draftVersion: number,
    ): Promise<VersionedChangeset> {
      return transition(scope, changesetId, 'reopen', { draftVersion });
    },

    async cancel(scope: ProjectScope, changesetId: string): Promise<Changeset> {
      const response = await api.request(
        `${changesetPath(scope, changesetId)}/cancel`,
        { method: 'POST' },
      );
      return readChangeset(response);
    },

    /** Aprobar o rechazar lo que se tenía delante. Pide `changeset.approve`. */
    async decide(
      scope: ProjectScope,
      changesetId: string,
      request: DecisionRequest,
    ): Promise<{ decision: Decision; changeset: Changeset }> {
      const response = await api.request(
        `${changesetPath(scope, changesetId)}/decisions`,
        { method: 'POST', body: { ...request } },
      );
      if (
        isRecord(response) &&
        isDecision(response.decision) &&
        isChangeset(response.changeset)
      ) {
        return { decision: response.decision, changeset: response.changeset };
      }
      throw invalidResponse();
    },

    /**
     * Aplica el borrador aprobado. La misma `idempotencyKey` en un reintento
     * devuelve el mismo resultado sin aplicar dos veces.
     */
    async apply(
      scope: ProjectScope,
      changesetId: string,
      request: ApplyRequest,
      idempotencyKey: string,
    ): Promise<ApplyResult> {
      const response = await api.request(
        `${changesetPath(scope, changesetId)}/apply`,
        {
          method: 'POST',
          body: { ...request },
          headers: { 'Idempotency-Key': idempotencyKey },
        },
      );
      if (isRecord(response) && isApplyResult(response.applied)) {
        return response.applied;
      }
      throw invalidResponse();
    },

    /** Trae el borrador a la revisión actual, con la elección de cada conflicto. */
    async rebase(
      scope: ProjectScope,
      changesetId: string,
      draftVersion: number,
      resolutions: ConflictResolution[],
    ): Promise<VersionedChangeset> {
      return transition(scope, changesetId, 'rebase', {
        draftVersion,
        resolutions,
      });
    },

    /** Un borrador nuevo que deshace lo que aplicó esa revisión. */
    async proposeRevert(
      scope: ProjectScope,
      revisionId: string,
    ): Promise<VersionedChangeset> {
      const response = await api.requestWithETag(
        `${scopePath(scope)}/revisions/${encodeURIComponent(revisionId)}/revert-proposal`,
        { method: 'POST' },
      );
      return readVersioned(response);
    },
  };

  /** Las transiciones que devuelven el borrador con su versión nueva. */
  async function transition(
    scope: ProjectScope,
    changesetId: string,
    action: 'submit' | 'reopen' | 'rebase',
    body: Record<string, unknown>,
  ): Promise<VersionedChangeset> {
    const response = await api.requestWithETag(
      `${changesetPath(scope, changesetId)}/${action}`,
      { method: 'POST', body },
    );
    return readVersioned(response);
  }
}

export type ChangesetsService = ReturnType<typeof createChangesetsService>;

/** La versión como la espera `If-Match`: `"3"`. */
export function etagOf(draftVersion: number) {
  return `"${draftVersion}"`;
}

function changesetPath(scope: ProjectScope, changesetId: string) {
  return `${scopePath(scope)}/changesets/${encodeURIComponent(changesetId)}`;
}

function readChangeset(response: unknown): Changeset {
  if (isRecord(response) && isChangeset(response.changeset)) {
    return response.changeset;
  }
  throw invalidResponse();
}

/** Si un proxy quita la cabecera, la versión del cuerpo dice lo mismo. */
function readVersioned({ body, etag }: VersionedResponse): VersionedChangeset {
  const changeset = readChangeset(body);
  return { changeset, etag: etag ?? etagOf(changeset.draftVersion) };
}

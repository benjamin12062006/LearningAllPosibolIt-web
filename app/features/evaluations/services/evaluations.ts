import {
  isEvaluationDetail,
  isEvaluationList,
  isEvaluationRowsPage,
  type EvaluationDetail,
  type EvaluationList,
  type EvaluationRequest,
  type EvaluationRowsPage,
  type RowOutcome,
} from '../types/evaluations';
import { isNonEmptyString, isRecord } from '../../../utils/guards';
import { invalidResponse, type ApiClient } from '../../../services/api-client';

const EVALUATION_LIST_LIMIT = 100;

export function createEvaluationsService(api: ApiClient) {
  return {
    /** 202: la evaluación queda en cola y se consulta después por su id. */
    async create(
      projectId: string,
      request: EvaluationRequest,
    ): Promise<string> {
      const response = await api.request(evaluationsPath(projectId), {
        method: 'POST',
        body: {
          snapshotId: request.snapshotId,
          rulesetRevision: request.rulesetRevision,
        },
      });
      if (isRecord(response) && isNonEmptyString(response.evaluationId)) {
        return response.evaluationId;
      }
      throw invalidResponse();
    },

    /** De la más reciente a la más antigua; 100 es el máximo de la API. */
    async list(projectId: string): Promise<EvaluationList> {
      const response = await api.request(evaluationsPath(projectId), {
        query: { limit: EVALUATION_LIST_LIMIT },
      });
      if (!isEvaluationList(response)) throw invalidResponse();
      return response;
    },

    async find(
      projectId: string,
      evaluationId: string,
    ): Promise<EvaluationDetail> {
      const response = await api.request(
        evaluationPath(projectId, evaluationId),
      );
      if (!isEvaluationDetail(response)) throw invalidResponse();
      return response;
    },

    /** Sin `outcome`, todas las filas. La API responde 409 si no terminó bien. */
    async rows(
      projectId: string,
      evaluationId: string,
      { outcome, limit, offset }: RowsQuery,
    ): Promise<EvaluationRowsPage> {
      const response = await api.request(
        `${evaluationPath(projectId, evaluationId)}/rows`,
        { query: { limit, offset, ...(outcome ? { outcome } : {}) } },
      );
      if (!isEvaluationRowsPage(response)) throw invalidResponse();
      return response;
    },

    async errorsCsv(
      projectId: string,
      evaluationId: string,
      language: 'en' | 'es' = 'es',
    ): Promise<Blob> {
      const response = await api.request(
        `${evaluationPath(projectId, evaluationId)}/errors.csv`,
        { query: { lang: language }, responseType: 'blob' },
      );
      if (response instanceof Blob) return response;
      throw invalidResponse();
    },
  };
}

export interface RowsQuery {
  outcome: RowOutcome | null;
  limit: number;
  offset: number;
}

export type EvaluationsService = ReturnType<typeof createEvaluationsService>;

function evaluationsPath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}/evaluations`;
}

function evaluationPath(projectId: string, evaluationId: string) {
  return `${evaluationsPath(projectId)}/${encodeURIComponent(evaluationId)}`;
}

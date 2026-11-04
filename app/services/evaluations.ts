import {
  isEvaluationDetail,
  type EvaluationDetail,
  type EvaluationRequest,
} from '../types/evaluations';
import { isNonEmptyString, isRecord } from '../utils/guards';
import { invalidResponse, type ApiClient } from './api-client';

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

    async find(
      projectId: string,
      evaluationId: string,
    ): Promise<EvaluationDetail> {
      const response = await api.request(
        `${evaluationsPath(projectId)}/${encodeURIComponent(evaluationId)}`,
      );
      if (!isEvaluationDetail(response)) throw invalidResponse();
      return response;
    },
  };
}

export type EvaluationsService = ReturnType<typeof createEvaluationsService>;

function evaluationsPath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}/evaluations`;
}

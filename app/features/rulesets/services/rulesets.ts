import {
  isRulesetList,
  isRulesetVersion,
  type RulesetInput,
  type RulesetList,
  type RulesetVersion,
} from '../types/rulesets';
import { isRecord } from '../../../utils/guards';
import { invalidResponse, type ApiClient } from '../../../services/api-client';

/** Las revisiones se cuentan por decenas; 100 es el máximo de la API. */
const RULESET_LIST_LIMIT = 100;

export function createRulesetsService(api: ApiClient) {
  return {
    /** De la revisión más reciente a la más antigua (`revision DESC` en la API). */
    async list(projectId: string): Promise<RulesetList> {
      const response = await api.request(rulesetsPath(projectId), {
        query: { limit: RULESET_LIST_LIMIT },
      });
      if (!isRulesetList(response)) throw invalidResponse();
      return response;
    },

    async find(projectId: string, revision: number): Promise<RulesetVersion> {
      const response = await api.request(
        `${rulesetsPath(projectId)}/${revision}`,
      );
      return readRuleset(response);
    },

    /** La API asigna la revisión siguiente; las anteriores no cambian. */
    async create(
      projectId: string,
      input: RulesetInput,
    ): Promise<RulesetVersion> {
      const response = await api.request(rulesetsPath(projectId), {
        method: 'POST',
        body: { mapping: input.mapping, rules: input.rules },
      });
      return readRuleset(response);
    },
  };
}

export type RulesetsService = ReturnType<typeof createRulesetsService>;

function readRuleset(response: unknown): RulesetVersion {
  if (isRecord(response) && isRulesetVersion(response.ruleset)) {
    return response.ruleset;
  }
  throw invalidResponse();
}

function rulesetsPath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}/rulesets`;
}

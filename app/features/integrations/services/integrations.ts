import {
  scopePath,
  type ProjectScope,
} from '../../projects/types/project-scope';
import {
  isProposal,
  readCursorList,
  type Proposal,
} from '../../assistant/types/assistant';
import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';
import { invalidResponse, type ApiClient } from '../../../services/api-client';

export type CredentialAudience = 'mcp' | 'mcp_oauth' | 'cli';
export type CredentialCapability = 'read' | 'prepare';
export interface Credential {
  id: string;
  ownerId: string;
  label: string;
  audience: CredentialAudience;
  capabilities: CredentialCapability[];
  status: 'active' | 'expired' | 'revoked';
  expiresAt: string;
  lastUsedAt: string | null;
}
export interface CredentialInput {
  label: string;
  audience: CredentialAudience;
  capabilities: CredentialCapability[];
  expiresAt?: string;
}
export interface KnowledgeSource {
  sourceId: string;
  sourceType: string;
  syncedAt: string | null;
  pending: boolean;
}
export interface KnowledgeStatus {
  enabled: boolean;
  sources: KnowledgeSource[];
}

export function createIntegrationsService(api: ApiClient) {
  return {
    async credentials(scope: ProjectScope, cursor?: string) {
      const query = { limit: 20, ...(cursor ? { cursor } : {}) };
      const response = await api.request(
        `${integrationPath(scope)}/credentials`,
        { query },
      );
      const list = readCursorList(response, isCredential);
      if (
        !list ||
        !isRecord(response) ||
        !isNullableString(response.oauthResourceUrl)
      )
        throw invalidResponse();
      return { ...list, oauthResourceUrl: response.oauthResourceUrl };
    },
    async issue(scope: ProjectScope, input: CredentialInput, key: string) {
      const response = await api.request(
        `${integrationPath(scope)}/credentials`,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': key },
          body: { ...input },
        },
      );
      if (
        !isRecord(response) ||
        !isCredential(response.credential) ||
        response.credential.audience !== input.audience
      )
        throw invalidResponse();
      if (input.audience === 'mcp_oauth')
        return { credential: response.credential, token: null };
      if (!isNonEmptyString(response.token)) throw invalidResponse();
      return { credential: response.credential, token: response.token };
    },
    async revoke(scope: ProjectScope, id: string) {
      await api.request(
        `${integrationPath(scope)}/credentials/${encodeURIComponent(id)}/revoke`,
        { method: 'POST' },
      );
    },
    async proposal(scope: ProjectScope, id: string) {
      return proposalOf(await api.request(proposalPath(scope, id)));
    },
    async decide(
      scope: ProjectScope,
      proposal: Proposal,
      action: 'confirm' | 'reject',
    ) {
      return proposalOf(
        await api.request(`${proposalPath(scope, proposal.id)}/${action}`, {
          method: 'POST',
          body: { proposalHash: proposal.hash },
        }),
      );
    },
    async knowledge(projectId: string): Promise<KnowledgeStatus> {
      const response = await api.request(knowledgePath(projectId));
      if (
        !isRecord(response) ||
        typeof response.enabled !== 'boolean' ||
        !Array.isArray(response.sources) ||
        !response.sources.every(isSource)
      )
        throw invalidResponse();
      return { enabled: response.enabled, sources: response.sources };
    },
    async reindex(projectId: string) {
      const response = await api.request(
        `${knowledgePath(projectId)}/reindex`,
        { method: 'POST' },
      );
      if (!isRecord(response) || response.status !== 'queued')
        throw invalidResponse();
    },
  };
}

function integrationPath(scope: ProjectScope) {
  return `${scopePath(scope)}/integrations`;
}

function proposalPath(scope: ProjectScope, id: string) {
  return `${integrationPath(scope)}/proposals/${encodeURIComponent(id)}`;
}

function knowledgePath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}/knowledge`;
}

function isCredential(value: unknown): value is Credential {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.ownerId) &&
    typeof value.label === 'string' &&
    ['mcp', 'mcp_oauth', 'cli'].some((item) => item === value.audience) &&
    Array.isArray(value.capabilities) &&
    value.capabilities.every((item) => item === 'read' || item === 'prepare') &&
    ['active', 'expired', 'revoked'].some((item) => item === value.status) &&
    isDateString(value.expiresAt) &&
    isNullableString(value.lastUsedAt)
  );
}

function isSource(value: unknown): value is KnowledgeSource {
  return (
    isRecord(value) &&
    isNonEmptyString(value.sourceId) &&
    isNonEmptyString(value.sourceType) &&
    isNullableString(value.syncedAt) &&
    typeof value.pending === 'boolean'
  );
}

function proposalOf(response: unknown) {
  if (!isRecord(response) || !isProposal(response.proposal))
    throw invalidResponse();
  return response.proposal;
}

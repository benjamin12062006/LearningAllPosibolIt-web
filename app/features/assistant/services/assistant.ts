import {
  scopePath,
  type ProjectScope,
} from '../../projects/types/project-scope';
import type { SessionService } from '../../access/types/access';
import {
  isConversation,
  isMessage,
  isProposal,
  isRun,
  readCursorList,
  type AssistantRun,
  type Conversation,
  type ConversationMessage,
  type Proposal,
  type RunEvent,
} from '../types/assistant';
import { createRunEventReader } from '../utils/run-events';
import { isNonEmptyString, isRecord } from '../../../utils/guards';
import {
  ApiFailure,
  invalidResponse,
  type ApiClient,
} from '../../../services/api-client';
import { worksheetPath } from '../../worksheets/services/worksheets';

export type ConversationScope = { workbookId: string; worksheetId?: string };
export type SelectionRows =
  | { kind: 'selectedRows'; rowIds: string[] }
  | { kind: 'allMatchingFilter'; filter: Record<string, unknown> };
export interface RunContext {
  language?: 'en' | 'es';
  section?:
    | 'project'
    | 'catalog'
    | 'rules'
    | 'evaluations'
    | 'products'
    | 'feed'
    | 'worksheets'
    | 'integrations'
    | 'chats';
  workbookId?: string;
  worksheetId?: string;
  catalogSnapshotId?: string;
  evaluationId?: string;
  rulesetRevision?: number;
  revisionId?: string;
  selectionId?: string;
}

export function createAssistantService(
  api: ApiClient,
  baseUrl: string,
  session?: SessionService,
) {
  return {
    async conversations(
      scope: ProjectScope,
      target?: ConversationScope,
      cursor?: string,
    ) {
      const query = {
        limit: 30,
        ...(target ? { workbookId: target.workbookId } : {}),
        ...(target?.worksheetId ? { worksheetId: target.worksheetId } : {}),
        ...(cursor ? { cursor } : {}),
      };
      return pageOf(
        await api.request(`${scopePath(scope)}/conversations`, { query }),
        isConversation,
      );
    },
    async create(
      scope: ProjectScope,
      target: ConversationScope | undefined,
      title: string,
    ): Promise<Conversation> {
      let parent = scopePath(scope);
      if (target?.worksheetId) {
        parent = worksheetPath(scope, target.worksheetId);
      } else if (target) {
        parent += `/workbooks/${segment(target.workbookId)}`;
      }
      return fieldOf(
        await api.request(`${parent}/conversations`, {
          method: 'POST',
          body: { title },
        }),
        'conversation',
        isConversation,
      );
    },
    async messages(
      scope: ProjectScope,
      conversationId: string,
      cursor?: string,
    ) {
      const query = { limit: 50, ...(cursor ? { cursor } : {}) };
      return pageOf(
        await api.request(
          `${conversationPath(scope, conversationId)}/messages`,
          { query },
        ),
        isMessage,
      );
    },
    async append(
      scope: ProjectScope,
      conversationId: string,
      content: string,
      clientMessageId: string,
    ): Promise<ConversationMessage> {
      const response = await api.request(
        `${conversationPath(scope, conversationId)}/messages`,
        {
          method: 'POST',
          body: { content, clientMessageId },
        },
      );
      return fieldOf(response, 'message', isMessage);
    },
    async selection(
      scope: ProjectScope,
      worksheetId: string,
      revisionId: string,
      columnIds: string[],
      rows: SelectionRows,
    ) {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/selections`,
        {
          method: 'POST',
          body: { revisionId, columnIds, rows },
        },
      );
      if (!isRecord(response) || !isNonEmptyString(response.selectionId))
        throw invalidResponse();
      return response.selectionId;
    },
    async start(
      scope: ProjectScope,
      conversationId: string,
      messageId: string,
      context?: RunContext,
    ): Promise<AssistantRun> {
      const response = await api.request(
        `${conversationPath(scope, conversationId)}/runs`,
        {
          method: 'POST',
          body: { messageId, context },
        },
      );
      return fieldOf(response, 'run', isRun);
    },
    async read(scope: ProjectScope, runId: string) {
      return fieldOf(await api.request(runPath(scope, runId)), 'run', isRun);
    },
    async latest(scope: ProjectScope, conversationId: string) {
      const response = await api.request(
        `${conversationPath(scope, conversationId)}/runs/latest`,
      );
      if (isRecord(response) && response.run === null) return null;
      return fieldOf(response, 'run', isRun);
    },
    async cancel(scope: ProjectScope, runId: string) {
      return fieldOf(
        await api.request(`${runPath(scope, runId)}/cancel`, {
          method: 'POST',
        }),
        'run',
        isRun,
      );
    },
    async decide(
      scope: ProjectScope,
      runId: string,
      proposal: Proposal,
      decision: 'confirm' | 'reject',
    ) {
      const response = await api.request(
        `${runPath(scope, runId)}/proposals/${segment(proposal.id)}/${decision}`,
        {
          method: 'POST',
          body: { proposalHash: proposal.hash },
        },
      );
      return fieldOf(response, 'proposal', isProposal);
    },
    async events(
      scope: ProjectScope,
      runId: string,
      after: number,
      onEvent: (event: RunEvent) => void,
      signal: AbortSignal,
    ) {
      if (!session) throw new ApiFailure(401, 'Inicia sesión para continuar.');
      const path = `${runPath(scope, runId)}/events`;
      const url = new URL(baseUrl + path);
      if (after > 0) url.searchParams.set('after', String(after));
      const response = await openEventStream(url, session, signal);
      const reader = response.body?.getReader();
      if (!reader) throw invalidResponse();
      const decoder = new TextDecoder();
      const push = createRunEventReader(onEvent);
      try {
        for (
          let chunk = await reader.read();
          !chunk.done;
          chunk = await reader.read()
        ) {
          push(decoder.decode(chunk.value, { stream: true }));
        }
        push(decoder.decode());
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    },
  };
}

async function openEventStream(
  url: URL,
  session: SessionService,
  signal: AbortSignal,
) {
  const response = await connect(false);
  const stream = response.status === 401 ? await renew(response) : response;
  if (!stream.ok) {
    await stream.body?.cancel();
    const message =
      stream.status === 401
        ? 'Tu sesión caducó. Inicia sesión de nuevo.'
        : 'No se pudieron recibir los eventos del asistente.';
    throw new ApiFailure(stream.status, message);
  }
  return stream;

  async function renew(previous: Response) {
    await previous.body?.cancel();
    return connect(true);
  }

  async function connect(forceRefresh: boolean) {
    const token = await session.token(forceRefresh);
    return fetch(url, {
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      signal,
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
    });
  }
}

function conversationPath(scope: ProjectScope, id: string) {
  return `${scopePath(scope)}/conversations/${segment(id)}`;
}

function runPath(scope: ProjectScope, id: string) {
  return `${scopePath(scope)}/ai-runs/${segment(id)}`;
}

function segment(id: string) {
  return encodeURIComponent(id);
}

function fieldOf<T>(
  response: unknown,
  field: string,
  isValue: (value: unknown) => value is T,
): T {
  if (!isRecord(response)) throw invalidResponse();
  const value = response[field];
  if (!isValue(value)) throw invalidResponse();
  return value;
}

function pageOf<T>(response: unknown, isValue: (value: unknown) => value is T) {
  const page = readCursorList(response, isValue);
  if (!page) throw invalidResponse();
  return page;
}

import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';
import { isPublicError, type PublicError } from '../../catalog/types/imports';

export const RUN_EVENTS = [
  'run.queued',
  'run.started',
  'tool.started',
  'tool.completed',
  'proposal.ready',
  'run.completed',
  'run.failed',
  'run.cancelled',
] as const;

export const RUN_STATUSES = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'expired',
  'cancelled',
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];
export const RUN_OUTCOMES = [
  'answered',
  'confirmation_required',
  'needs_clarification',
  'limit_reached',
] as const;
export type RunOutcome = (typeof RUN_OUTCOMES)[number];
export type RunEventType = (typeof RUN_EVENTS)[number];
export interface RunEvent {
  sequence: number;
  type: RunEventType;
  data: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  workbookId: string | null;
  worksheetId: string | null;
  title: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
}

export interface CursorList<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Proposal {
  id: string;
  operation: string;
  summary: string;
  rulesetReview?: unknown;
  hash: string;
  /** `failed`: confirmarla falló con un error conocido y el asistente siguió. */
  status: 'ready' | 'confirming' | 'confirmed' | 'rejected' | 'failed';
  target: unknown;
  result: unknown;
  error?: PublicError | null;
  expiresAt: string;
}

/** Lo que responde confirmar: la propuesta y la ejecución que continúa. */
export interface ProposalDecision {
  proposal: Proposal;
  continuation: AssistantRun | null;
}

export interface AssistantRun {
  id: string;
  conversationId: string;
  userMessageId: string;
  status: RunStatus;
  outcome: RunOutcome | null;
  answer: string | null;
  error: PublicError | null;
  proposal: Proposal | null;
}

export function isRunActive(status: RunStatus) {
  return status === 'queued' || status === 'running';
}

export function isConversation(value: unknown): value is Conversation {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    (value.workbookId === null || isNonEmptyString(value.workbookId)) &&
    isNullableString(value.worksheetId) &&
    typeof value.title === 'string'
  );
}

export function isMessage(value: unknown): value is ConversationMessage {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    (value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string' &&
    Number.isInteger(value.sequence)
  );
}

export function isProposal(value: unknown): value is Proposal {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.operation) &&
    typeof value.summary === 'string' &&
    isNonEmptyString(value.hash) &&
    ['ready', 'confirming', 'confirmed', 'rejected', 'failed'].some(
      (status) => status === value.status,
    ) &&
    (value.error === undefined ||
      value.error === null ||
      isPublicError(value.error)) &&
    isDateString(value.expiresAt)
  );
}

export function isRun(value: unknown): value is AssistantRun {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.conversationId) &&
    isNonEmptyString(value.userMessageId) &&
    RUN_STATUSES.some((status) => status === value.status) &&
    (value.outcome === null ||
      RUN_OUTCOMES.some((outcome) => outcome === value.outcome)) &&
    isNullableString(value.answer) &&
    (value.error === null || isPublicError(value.error)) &&
    (value.proposal === null || isProposal(value.proposal))
  );
}

export function readCursorList<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): CursorList<T> | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !value.items.every(isItem) ||
    !isNullableString(value.nextCursor)
  )
    return null;
  return { items: value.items, nextCursor: value.nextCursor };
}

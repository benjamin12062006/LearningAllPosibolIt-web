import type { RunEvent } from '../types/assistant';
import { isRecord } from '../../../utils/guards';

export interface WorksheetTarget {
  worksheetId: string;
  columnIds: string[];
}

export interface LiveRun {
  sequence: number;
  state:
    | 'idle'
    | 'queued'
    | 'thinking'
    | 'reading'
    | 'writing'
    | 'proposing'
    | 'done'
    | 'question'
    | 'error'
    | 'cancelled';
  target: WorksheetTarget | null;
  callId: string | null;
  finished: boolean;
}

export const EMPTY_LIVE_RUN: LiveRun = {
  sequence: 0,
  state: 'idle',
  target: null,
  callId: null,
  finished: false,
};

export function worksheetTarget(value: unknown): WorksheetTarget | null {
  if (!isRecord(value) || typeof value.worksheetId !== 'string') return null;
  const ids: unknown[] = Array.isArray(value.columnIds) ? value.columnIds : [];
  return {
    worksheetId: value.worksheetId,
    columnIds: ids.filter((id): id is string => typeof id === 'string'),
  };
}

export function reduceRun(state: LiveRun, event: RunEvent): LiveRun {
  if (event.sequence <= state.sequence || state.finished) return state;
  const next = { ...state, sequence: event.sequence };
  const { data } = event;
  switch (event.type) {
    case 'run.queued':
      return { ...next, state: 'queued' };
    case 'run.started':
      return { ...next, state: 'thinking' };
    case 'tool.started':
      return {
        ...next,
        state: data.mode === 'prepare' ? 'writing' : 'reading',
        callId: typeof data.callId === 'string' ? data.callId : null,
        target: worksheetTarget(data.target),
      };
    case 'tool.completed':
      return state.callId === data.callId
        ? { ...next, state: 'thinking', callId: null, target: null }
        : next;
    case 'proposal.ready':
      return {
        ...next,
        state: 'proposing',
        target: worksheetTarget(data.target),
      };
    case 'run.completed': {
      if (data.outcome === 'confirmation_required')
        return { ...next, state: 'proposing', finished: true };
      if (data.outcome === 'needs_clarification')
        return { ...next, state: 'question', target: null, finished: true };
      if (data.outcome === 'limit_reached')
        return { ...next, state: 'error', target: null, finished: true };
      return { ...next, state: 'done', target: null, finished: true };
    }
    case 'run.failed':
      return { ...next, state: 'error', target: null, finished: true };
    case 'run.cancelled':
      return { ...next, state: 'cancelled', target: null, finished: true };
  }
}

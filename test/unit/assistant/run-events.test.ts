import { describe, expect, it, vi } from 'vitest';
import { createAssistantService } from '../../../app/features/assistant/services/assistant';
import type { SessionService } from '../../../app/features/access/types/access';
import type { RunEvent } from '../../../app/features/assistant/types/assistant';
import { createRunEventReader } from '../../../app/features/assistant/utils/run-events';
import {
  EMPTY_LIVE_RUN,
  reduceRun,
} from '../../../app/features/assistant/utils/run-state';
import { fakeApi } from '../support/fake-api';

it('crea una conversación de proyecto sin adjuntarla a un libro ni hoja', async () => {
  const conversation = {
    id: 'conversation-1',
    workbookId: null,
    worksheetId: null,
    title: 'Reglas del proyecto',
  };
  const { api, request } = fakeApi({ conversation });
  const service = createAssistantService(api, '');
  const scope = { organizationId: 'org', projectId: 'project' };
  await expect(
    service.create(scope, undefined, conversation.title),
  ).resolves.toEqual(conversation);
  expect(request).toHaveBeenCalledWith(
    '/organizations/org/projects/project/conversations',
    {
      method: 'POST',
      body: { title: conversation.title },
    },
  );
});

describe('eventos del asistente', () => {
  it('lee los eventos partidos, con comentarios y varios campos data', () => {
    const events: RunEvent[] = [];
    const push = createRunEventReader((event) => events.push(event));
    push(': keepalive\r\n\r\nid: 2\r\nevent: run.started\r\ndata: {\r\n');
    push('data: "createdAt": "2026-11-15" }\r\n\r');
    expect(events).toEqual([]);
    push('\n');
    expect(events).toEqual([
      { sequence: 2, type: 'run.started', data: { createdAt: '2026-11-15' } },
    ]);
  });

  it('rechaza eventos repetidos y quita la marca de lectura al terminar la herramienta', () => {
    const start = reduceRun(EMPTY_LIVE_RUN, {
      sequence: 2,
      type: 'tool.started',
      data: {
        callId: 'call',
        target: { worksheetId: 'sheet', columnIds: ['price', 3] },
        mode: 'execute',
      },
    });
    expect(start).toMatchObject({
      state: 'reading',
      target: { worksheetId: 'sheet', columnIds: ['price'] },
    });
    expect(
      reduceRun(start, { sequence: 2, type: 'run.started', data: {} }),
    ).toBe(start);
    const completed = reduceRun(start, {
      sequence: 3,
      type: 'tool.completed',
      data: { callId: 'call' },
    });
    expect(completed).toMatchObject({ state: 'thinking', target: null });
    expect(
      reduceRun(completed, {
        sequence: 4,
        type: 'run.completed',
        data: { outcome: 'needs_clarification' },
      }),
    ).toMatchObject({ state: 'question', finished: true });
  });

  it('renueva una sesión caducada y continúa con after y cabeceras de SSE', async () => {
    const session: SessionService = {
      token: vi.fn(async (refresh) => (refresh ? 'renewed' : 'old')),
      restore: vi.fn(),
      signOut: vi.fn(),
    };
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response('id: 6\nevent: run.cancelled\ndata: {}\n\n'),
      );
    vi.stubGlobal('fetch', fetch);
    const { api } = fakeApi(null);
    const service = createAssistantService(
      api,
      'https://api.example/api/v1',
      session,
    );
    const onEvent = vi.fn();
    await service.events(
      { organizationId: 'o', projectId: 'p' },
      'run',
      5,
      onEvent,
      new AbortController().signal,
    );
    expect(session.token).toHaveBeenNthCalledWith(1, false);
    expect(session.token).toHaveBeenNthCalledWith(2, true);
    expect(fetch).toHaveBeenLastCalledWith(
      new URL(
        'https://api.example/api/v1/organizations/o/projects/p/ai-runs/run/events?after=5',
      ),
      expect.objectContaining({
        headers: {
          Accept: 'text/event-stream',
          Authorization: 'Bearer renewed',
        },
        redirect: 'error',
      }),
    );
    expect(onEvent).toHaveBeenCalledWith({
      sequence: 6,
      type: 'run.cancelled',
      data: {},
    });
  });

  it('crea la selección bajo la organización, el proyecto y la hoja', async () => {
    const scope = { organizationId: 'o/1', projectId: 'p/2' };
    const selection = fakeApi({ selectionId: 'selection-1' });
    const service = createAssistantService(selection.api, '');
    const rows = { kind: 'selectedRows' as const, rowIds: ['row-1'] };
    await expect(
      service.selection(scope, 'sheet', 'revision', ['price'], rows),
    ).resolves.toBe('selection-1');
    expect(selection.request).toHaveBeenCalledWith(
      '/organizations/o%2F1/projects/p%2F2/worksheets/sheet/selections',
      {
        method: 'POST',
        body: { revisionId: 'revision', columnIds: ['price'], rows },
      },
    );
  });
});

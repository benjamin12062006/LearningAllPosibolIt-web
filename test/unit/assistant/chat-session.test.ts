import { expect, it, vi } from 'vitest';
import { createAssistantChat } from '../../../app/features/assistant/composables/useAssistantChat';
import { createAssistantService } from '../../../app/features/assistant/services/assistant';
import type { AssistantRun } from '../../../app/features/assistant/types/assistant';
import { renderAssistantMarkdown } from '../../../app/features/assistant/utils/markdown';
import { fakeApi } from '../support/fake-api';

it('otro chat puede empezar y el anterior conserva su ejecución y su respuesta', async () => {
  const api = createAssistantService(fakeApi(null).api, '');
  const release = [
    Promise.withResolvers<undefined>(),
    Promise.withResolvers<undefined>(),
  ];
  const running = new Map<string, AssistantRun>();
  let number = 0;
  const service: typeof api = {
    ...api,
    conversations: async () => ({ items: [], nextCursor: null }),
    create: async (_scope, _target, title) => ({
      id: String(++number),
      workbookId: null,
      worksheetId: null,
      title,
    }),
    append: async (_scope, id, content) => ({
      id: `message-${id}`,
      content,
      sequence: 1,
      role: 'user',
    }),
    start: async (_scope, conversationId, userMessageId) => {
      const run: AssistantRun = {
        id: conversationId,
        conversationId,
        userMessageId,
        status: 'running',
        outcome: null,
        answer: null,
        error: null,
        proposal: null,
      };
      running.set(run.id, run);
      return run;
    },
    events: async (_scope, runId, _after, emit, signal) => {
      await release[Number(runId) - 1]?.promise;
      expect(signal.aborted).toBe(false);
      emit({
        sequence: 1,
        type: 'tool.completed',
        data: { operation: 'get_ruleset', status: 'succeeded', target: {} },
      });
    },
    read: async (_scope, id) => {
      const run = running.get(id);
      if (!run) throw new Error('ejecución ausente');
      return { ...run, status: 'succeeded', outcome: 'answered' };
    },
    messages: async (_scope, id) => ({
      items: [
        {
          id: `answer-${id}`,
          content: `Resultado ${id}`,
          sequence: 2,
          role: 'assistant',
        },
      ],
      nextCursor: null,
    }),
  };
  const scope = { organizationId: 'org', projectId: 'project' };
  const session = createAssistantChat(service, scope);
  const context = async () => ({});
  const onEvent = vi.fn();
  const unsubscribe = session.subscribe(onEvent);
  await session.initialize();
  await session.send('Primera tarea', context);
  session.createConversation();
  await session.send('Segunda tarea', context);
  expect(session.activeIds.value).toEqual(new Set(['1', '2']));
  expect(session.conversationId.value).toBe('2');

  // El panel o la página dejan de escuchar sin cerrar ninguna de las transmisiones.
  unsubscribe();
  release[0]?.resolve(undefined);
  await vi.waitFor(() =>
    expect(session.activeIds.value).toEqual(new Set(['2'])),
  );
  expect(onEvent).not.toHaveBeenCalled();
  await session.select('1');
  await vi.waitFor(() =>
    expect(session.messages.value.at(-1)?.content).toBe('Resultado 1'),
  );

  release[1]?.resolve(undefined);
  await vi.waitFor(() => expect(session.activeIds.value.size).toBe(0));
  await session.select('2');
  await vi.waitFor(() =>
    expect(session.messages.value.at(-1)?.content).toBe('Resultado 2'),
  );
  session.dispose();
});

it('formatea títulos y tablas y conserva el HTML de la respuesta como texto', () => {
  const answer = renderAssistantMarkdown(
    '## Resumen\n\n| Estado |\n| --- |\n| Preparada |\n\n<details>Texto</details>\n\n[este enlace](/chats)',
  );
  expect(answer).toContain('<h2>Resumen</h2>');
  expect(answer).toContain('<table>');
  expect(answer).toContain('&lt;details&gt;');
  expect(answer).toContain('<a href="/chats">este enlace</a>');
});

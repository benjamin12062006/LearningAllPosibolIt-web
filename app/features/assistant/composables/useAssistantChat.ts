import { computed, ref, shallowReactive, shallowRef } from 'vue';
import type { ProjectScope } from '../../projects/types/project-scope';
import { ApiFailure } from '../../../services/api-client';
import type { createAssistantService, RunContext } from '../services/assistant';
import {
  isRunActive,
  type AssistantRun,
  type Conversation,
  type ConversationMessage,
  type Proposal,
  type RunEvent,
} from '../types/assistant';
import { EMPTY_LIVE_RUN, reduceRun, type LiveRun } from '../utils/run-state';

interface PendingMessage {
  id: string;
  content: string;
  context?: RunContext;
}

interface Thread {
  id: string;
  content: string;
  messages: ConversationMessage[];
  messagesCursor: string | null;
  run?: AssistantRun;
  events: Record<string, RunEvent[]>;
  live: LiveRun;
  pending?: PendingMessage;
  stream?: AbortController;
  loaded: boolean;
  loading: boolean;
  sending: boolean;
  deciding: boolean;
  cancelling: boolean;
  reportNewEvents: boolean;
  error: string;
}

type Action = 'loading' | 'sending' | 'deciding' | 'cancelling';
type AssistantService = ReturnType<typeof createAssistantService>;

const STREAM_RECONNECT_MS = 750;

export function createAssistantChat(
  $assistant: AssistantService,
  scope: ProjectScope,
) {
  const threads = shallowReactive(new Map<string, Thread>());
  const selected = shallowRef(newThread());
  const conversations = shallowRef<Conversation[]>([]);
  const conversationsCursor = ref<string | null>(null);
  const historyLoading = ref(false);
  const historyError = ref('');
  const eventListeners = new Set<(event: RunEvent) => void>();
  let initialized = false;
  let selectedByUser = false;
  let disposed = false;

  const conversationId = computed(() => selected.value.id);
  const activeRun = computed(() => selected.value.run);
  const live = computed(() => selected.value.live);
  const busy = computed(() => isBusy(selected.value));
  const activeIds = computed(
    () =>
      new Set([...threads.values()].filter(isBusy).map((thread) => thread.id)),
  );
  const content = computed({
    get: () => selected.value.content,
    set: (value: string) => {
      selected.value.content = value;
    },
  });

  function dispose() {
    disposed = true;
    for (const thread of threads.values()) stopFollowing(thread);
    eventListeners.clear();
  }

  function subscribe(listener: (event: RunEvent) => void) {
    eventListeners.add(listener);
    return () => {
      eventListeners.delete(listener);
    };
  }

  async function initialize() {
    if (initialized || disposed) return;
    initialized = true;
    await readConversations();
    const recent = conversations.value[0];
    if (recent && !selectedByUser && !disposed) await select(recent.id);
  }

  async function readConversations(append = false) {
    if (historyLoading.value || disposed) return;
    historyLoading.value = true;
    historyError.value = '';
    try {
      const cursor = append
        ? (conversationsCursor.value ?? undefined)
        : undefined;
      const page = await $assistant.conversations(scope, undefined, cursor);
      const seen = new Set(conversations.value.map(({ id }) => id));
      conversations.value = append
        ? [
            ...conversations.value,
            ...page.items.filter(({ id }) => !seen.has(id)),
          ]
        : page.items;
      conversationsCursor.value = page.nextCursor;
    } catch (cause) {
      if (!disposed) historyError.value = explain(cause);
    } finally {
      historyLoading.value = false;
    }
  }

  async function select(id: string) {
    if (!id || disposed) return;
    selectedByUser = true;
    const thread = threads.get(id) ?? newThread(id);
    threads.set(id, thread);
    selected.value = thread;
    if (thread.loaded || thread.loading) return;
    await loadThread(thread);
  }

  function createConversation() {
    selectedByUser = true;
    selected.value = newThread();
  }

  async function loadThread(thread: Thread) {
    const run = await handleRequest(thread, 'loading', async () => {
      const [page, latest] = await Promise.all([
        $assistant.messages(scope, thread.id),
        $assistant.latest(scope, thread.id),
      ]);
      thread.messages = page.items;
      thread.messagesCursor = page.nextCursor;
      thread.loaded = true;
      return latest;
    });
    if (!run || disposed) return;
    thread.run = run;
    void followThread(thread);
  }

  async function readMessages(older = false, thread = selected.value) {
    if (!thread.id || thread.loading || disposed) return;
    await handleRequest(thread, 'loading', async () => {
      const cursor = older ? (thread.messagesCursor ?? undefined) : undefined;
      const page = await $assistant.messages(scope, thread.id, cursor);
      const current = thread.messages;
      if (older) {
        thread.messages = [...page.items, ...current];
      } else {
        const byId = new Map(
          [...current, ...page.items].map((message) => [message.id, message]),
        );
        thread.messages = [...byId.values()].sort(
          (a, b) => a.sequence - b.sequence,
        );
      }
      if (older || !current.length || current[0]?.id === page.items[0]?.id) {
        thread.messagesCursor = page.nextCursor;
      }
      thread.loaded = true;
    });
  }

  async function send(text: string, context: () => Promise<RunContext>) {
    const thread = selected.value;
    const normalized = text.trim();
    if (
      !normalized ||
      isBusy(thread) ||
      thread.sending ||
      thread.loading ||
      thread.deciding
    )
      return;

    await handleRequest(thread, 'sending', async () => {
      selectedByUser = true;
      if (thread.pending?.content !== normalized) {
        thread.pending = {
          id: crypto.randomUUID(),
          content: normalized,
          context: await context(),
        };
      }
      if (!thread.id) await saveNewConversation(thread, normalized);
      if (disposed) return;
      const { pending } = thread;
      const message = await $assistant.append(
        scope,
        thread.id,
        pending.content,
        pending.id,
      );
      if (disposed) return;
      if (!thread.messages.some(({ id }) => id === message.id)) {
        thread.messages = [...thread.messages, message];
      }
      const run = await $assistant.start(
        scope,
        thread.id,
        message.id,
        pending.context,
      );
      if (disposed) return;
      stopFollowing(thread);
      thread.run = run;
      thread.live = EMPTY_LIVE_RUN;
      thread.pending = undefined;
      thread.reportNewEvents = true;
      if (thread.content === text) thread.content = '';
      void followThread(thread);
    });
  }

  async function saveNewConversation(thread: Thread, text: string) {
    const title = Array.from(text.replace(/\s+/g, ' ')).slice(0, 80).join('');
    const created = await $assistant.create(scope, undefined, title);
    thread.id = created.id;
    threads.set(thread.id, thread);
    conversations.value = [
      created,
      ...conversations.value.filter(({ id }) => id !== created.id),
    ];
  }

  async function followThread(thread: Thread) {
    const runId = thread.run?.id;
    if (!runId || thread.stream || disposed) return;
    const stream = new AbortController();
    const { signal } = stream;
    thread.stream = stream;
    thread.error = '';
    let failures = 0;
    try {
      do {
        try {
          await $assistant.events(
            scope,
            runId,
            thread.live.sequence,
            (event) => {
              if (!signal.aborted) consumeEvent(thread, event);
            },
            signal,
          );
          if (signal.aborted) return;
          const run = await $assistant.read(scope, runId);
          if (signal.aborted) return;
          thread.run = run;
          failures = 0;
        } catch (cause) {
          if (signal.aborted) return;
          failures += 1;
          const unauthorized =
            cause instanceof ApiFailure &&
            [401, 403, 404].includes(cause.status);
          if (failures >= 3 || unauthorized || !isBusy(thread)) throw cause;
        }
        if (isBusy(thread))
          await new Promise((resolve) =>
            setTimeout(resolve, STREAM_RECONNECT_MS),
          );
      } while (!signal.aborted && isBusy(thread));
      if (!signal.aborted) await readMessages(false, thread);
    } catch (cause) {
      if (!signal.aborted) thread.error = explain(cause);
    } finally {
      if (thread.stream === stream) thread.stream = undefined;
    }
  }

  function consumeEvent(thread: Thread, event: RunEvent) {
    if (event.sequence <= thread.live.sequence || !thread.run) return;
    thread.live = reduceRun(thread.live, event);
    const messageId = thread.run.userMessageId;
    thread.events = {
      ...thread.events,
      [messageId]: [...(thread.events[messageId] ?? []), event],
    };
    if (thread.reportNewEvents && selected.value === thread) {
      for (const listener of eventListeners) listener(event);
    }
  }

  async function cancel() {
    const thread = selected.value;
    const run = thread.run;
    if (!run || !isBusy(thread) || thread.cancelling) return;
    const stopped = await handleRequest(thread, 'cancelling', () =>
      $assistant.cancel(scope, run.id),
    );
    if (!stopped || disposed) return;
    stopFollowing(thread);
    thread.run = stopped;
    thread.live = {
      ...thread.live,
      target: null,
      state: 'cancelled',
      finished: true,
    };
    await readMessages(false, thread);
  }

  async function decide(proposal: Proposal, decision: 'confirm' | 'reject') {
    const thread = selected.value;
    const run = thread.run;
    if (!run || thread.deciding) return;
    const decided = await handleRequest(thread, 'deciding', () =>
      $assistant.decide(scope, run.id, proposal, decision),
    );
    if (!decided || disposed || thread.run?.id !== run.id) return;
    thread.run = { ...thread.run, proposal: decided };
    thread.live = EMPTY_LIVE_RUN;
    return selected.value === thread ? decided : undefined;
  }

  async function handleRequest<T>(
    thread: Thread,
    indicator: Action,
    action: () => Promise<T>,
  ) {
    thread[indicator] = true;
    thread.error = '';
    try {
      return await action();
    } catch (cause) {
      if (!disposed) thread.error = explain(cause);
    } finally {
      thread[indicator] = false;
    }
  }

  return {
    conversations,
    conversationsCursor,
    conversationId,
    content,
    messages: computed(() => selected.value.messages),
    messagesCursor: computed(() => selected.value.messagesCursor),
    activeRun,
    live,
    events: computed(() => selected.value.events),
    loading: computed(() => selected.value.loading || historyLoading.value),
    historyLoading,
    sending: computed(() => selected.value.sending),
    deciding: computed(() => selected.value.deciding),
    cancelling: computed(() => selected.value.cancelling),
    following: computed(() => !!selected.value.stream),
    error: computed(() => selected.value.error || historyError.value),
    activeIds,
    busy,
    initialize,
    dispose,
    subscribe,
    send,
    select,
    readMessages,
    readConversations,
    createConversation,
    cancel,
    decide,
    follow: () => followThread(selected.value),
  };
}

function newThread(id = ''): Thread {
  return shallowReactive({
    id,
    content: '',
    messages: [],
    messagesCursor: null,
    live: EMPTY_LIVE_RUN,
    events: {},
    loaded: !id,
    loading: false,
    sending: false,
    deciding: false,
    cancelling: false,
    reportNewEvents: false,
    error: '',
  });
}

function stopFollowing(thread: Thread) {
  thread.stream?.abort();
  thread.stream = undefined;
}

function isBusy(thread: Thread) {
  return !!thread.run && isRunActive(thread.run.status);
}

function explain(cause: unknown) {
  if (cause instanceof ApiFailure) {
    if (cause.code === 'AGENT_RUN_ACTIVE')
      return 'Ya hay una respuesta en curso para esta conversación.';
    if (cause.code === 'AGENT_QUOTA_EXCEEDED')
      return 'El asistente alcanzó el límite de ejecuciones de la cuenta.';
    if (cause.status === 503)
      return 'El asistente no está disponible en este entorno.';
    return cause.message;
  }
  return 'Se interrumpió la conexión con el asistente. Intenta de nuevo.';
}

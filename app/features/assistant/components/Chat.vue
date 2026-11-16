<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { useAssistantWorkspace } from '../composables/useAssistantWorkspace';
import type { ProjectScope } from '../../projects/types/project-scope';
import type { RunContext } from '../services/assistant';
import type { Proposal, RunEvent } from '../types/assistant';
import { runActivity } from '../utils/activity';
import { EMPTY_LIVE_RUN, type LiveRun } from '../utils/run-state';

const { t, language } = useAppLocale();

const props = defineProps<{
  scope: ProjectScope;
  canUse: boolean;
  fullPage: boolean;
  visible: boolean;
  historyDock: HTMLElement | null;
  selectionLabel?: string;
  context: () => Promise<RunContext>;
  destination?: RouteLocationRaw;
}>();
const followActions = defineModel<boolean>('followActions', { required: true });
const emit = defineEmits<{
  activity: [live: LiveRun];
  busy: [busy: boolean];
  locate: [columnId?: string];
  event: [event: RunEvent];
  confirmed: [proposal: Proposal];
  conversationChange: [];
}>();
const session = useAssistantWorkspace().session(props.scope);
const {
  conversations,
  conversationsCursor,
  conversationId,
  content,
  messages,
  messagesCursor,
  activeRun,
  live,
  events,
  loading,
  sending,
  deciding,
  cancelling,
  following,
  busy,
  error,
  send,
  select,
  readMessages,
  readConversations,
  createConversation,
  cancel,
  decide,
  follow,
  activeIds,
  historyLoading,
} = session;
const unsubscribe = session.subscribe((event) => emit('event', event));
onMounted(() => {
  void session.initialize();
});

const transcript = useTemplateRef('transcript');
const transcriptContent = useTemplateRef('transcriptContent');
const stickToEnd = ref(true);
let transcriptObserver: ResizeObserver | undefined;
onMounted(() => {
  if (!transcriptContent.value || typeof ResizeObserver === 'undefined') return;
  transcriptObserver = new ResizeObserver(scrollToEnd);
  transcriptObserver.observe(transcriptContent.value);
});
const historyLocked = computed(
  () => busy.value || loading.value || sending.value || deciding.value,
);
const canSend = computed(
  () => props.canUse && !historyLocked.value && !!content.value.trim(),
);
const historyItems = computed(() =>
  conversations.value.map(({ id, title }) => ({ label: title, value: id })),
);
const activity = computed(() =>
  Object.fromEntries(
    Object.entries(events.value).map(([id, toolEvents]) => [
      id,
      runActivity(toolEvents, props.scope.projectId),
    ]),
  ),
);
const activityItems = computed(
  () => activity.value[activeRun.value?.userMessageId ?? ''] ?? [],
);
const latestMessage = computed(() => messages.value.at(-1)?.id);
const announce = computed(() => {
  const operation = activityItems.value.findLast(
    (item) => item.status === 'working',
  );
  if (operation && busy.value) return t(operation.label);
  if (live.value.state === 'queued') return t('En cola');
  if (busy.value) return t('Preparando la respuesta');
  if (live.value.state === 'cancelled') return t('Ejecución detenida');
  return '';
});

watch(live, (value) => emit('activity', value), { immediate: true });
watch(busy, (value) => emit('busy', value), { immediate: true });
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      stickToEnd.value = true;
      void nextTick(scrollToEnd);
    }
    if (visible && busy.value && !following.value) void follow();
  },
);
watch(conversationId, () => emit('conversationChange'));
watch(
  [latestMessage, () => activityItems.value.length, () => props.visible],
  () => {
    scrollToEnd();
  },
  { flush: 'post' },
);
onScopeDispose(() => {
  transcriptObserver?.disconnect();
  unsubscribe();
  emit('activity', EMPTY_LIVE_RUN);
  emit('busy', false);
});

function scrollToEnd() {
  const view = transcript.value;
  if (props.visible && stickToEnd.value && view?.clientHeight)
    view.scrollTop = view.scrollHeight;
}

function onScroll() {
  const view = transcript.value;
  if (props.visible && view?.clientHeight)
    stickToEnd.value =
      view.scrollHeight - view.scrollTop - view.clientHeight < 96;
}

async function loadEarlierMessages() {
  const view = transcript.value;
  const previousHeight = view?.scrollHeight ?? 0;
  await readMessages(true);
  await nextTick();
  if (view) view.scrollTop += view.scrollHeight - previousHeight;
}

async function pickConversation(id: string) {
  stickToEnd.value = true;
  await select(id);
}

function newChat() {
  stickToEnd.value = true;
  createConversation();
}

async function submit() {
  if (!canSend.value) return;
  const submitted = content.value;
  stickToEnd.value = true;
  await send(submitted, props.context);
}

function submitFromKeyboard(event: KeyboardEvent) {
  if (event.isComposing) return;
  event.preventDefault();
  void submit();
}

async function decideProposal(decision: 'confirm' | 'reject') {
  const proposal = activeRun.value?.proposal;
  if (!proposal) return;
  const decided = await decide(proposal, decision);
  if (decision === 'confirm' && decided?.status === 'confirmed')
    emit('confirmed', decided);
}
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-1 flex-col"
    :aria-label="$t('Asistente del proyecto')"
  >
    <header
      v-if="!fullPage"
      class="flex shrink-0 items-center gap-1.5 border-b border-default bg-default px-3 py-2"
    >
      <USelectMenu
        v-if="conversations.length"
        :model-value="conversationId || undefined"
        :items="historyItems"
        value-key="value"
        size="sm"
        :placeholder="$t('Historial de chats')"
        :aria-label="$t('Conversación')"
        :disabled="historyLoading"
        class="min-w-0 flex-1"
        :ui="{ value: 'truncate' }"
        @update:model-value="pickConversation"
      />
      <h2
        v-else
        class="mr-auto truncate text-sm font-semibold text-highlighted"
      >
        {{ $t('Asistente') }}
      </h2>
      <UButton
        v-if="conversationsCursor"
        size="sm"
        color="neutral"
        variant="ghost"
        :disabled="historyLoading"
        icon="i-lucide-list-plus"
        :aria-label="$t('Cargar más conversaciones')"
        @click="readConversations(true)"
      />
      <UButton
        v-if="canUse"
        size="sm"
        color="neutral"
        variant="ghost"
        icon="i-lucide-plus"
        :aria-label="$t('Nuevo chat')"
        :title="$t('Nuevo chat')"
        @click="newChat"
      />
      <UButton
        :to="{ path: '/chats', query: { project: scope.projectId } }"
        size="sm"
        color="neutral"
        variant="ghost"
        icon="i-lucide-maximize-2"
        :aria-label="$t('Abrir el chat en pantalla completa')"
        :title="$t('Abrir Chats')"
      />
    </header>

    <Teleport v-if="fullPage && historyDock" :to="historyDock">
      <nav :aria-label="$t('Historial de chats')" class="min-w-0 space-y-1.5">
        <UButton
          v-if="canUse"
          size="xs"
          icon="i-lucide-plus"
          variant="soft"
          class="w-full justify-start"
          @click="newChat"
          >{{ $t('Nuevo chat') }}</UButton
        >
        <ul class="space-y-0.5">
          <li
            v-for="conversation in conversations"
            :key="conversation.id"
            class="min-w-0"
          >
            <UButton
              block
              size="xs"
              color="neutral"
              :variant="conversation.id === conversationId ? 'soft' : 'ghost'"
              :aria-current="
                conversation.id === conversationId ? 'true' : undefined
              "
              class="h-7 min-w-0 overflow-hidden px-2 text-left"
              :title="conversation.title"
              @click="pickConversation(conversation.id)"
            >
              <UIcon
                :name="
                  activeIds.has(conversation.id)
                    ? 'i-lucide-loader-circle'
                    : 'i-lucide-message-square'
                "
                class="size-3.5 shrink-0"
                :class="{
                  'text-ai motion-safe:animate-spin': activeIds.has(
                    conversation.id,
                  ),
                }"
              />
              <span class="min-w-0 flex-1 truncate">{{
                conversation.title
              }}</span>
              <span v-if="activeIds.has(conversation.id)" class="sr-only">{{
                $t('En curso')
              }}</span>
            </UButton>
          </li>
        </ul>
        <UButton
          v-if="conversationsCursor"
          variant="ghost"
          color="neutral"
          size="xs"
          :disabled="historyLoading"
          @click="readConversations(true)"
          >{{ $t('Cargar más') }}</UButton
        >
      </nav>
    </Teleport>

    <div
      ref="transcript"
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      :aria-label="$t('Mensajes')"
      @scroll.passive="onScroll"
    >
      <div
        ref="transcriptContent"
        class="mx-auto w-full max-w-3xl space-y-5 px-4 py-5"
        :class="{ 'sm:px-8': fullPage }"
      >
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="$t(error)"
        />
        <USkeleton v-if="loading && !messages.length" class="h-14" />
        <UButton
          v-if="messagesCursor"
          size="xs"
          variant="ghost"
          :disabled="historyLocked"
          @click="loadEarlierMessages"
          >{{ $t('Mensajes anteriores') }}</UButton
        >
        <div
          v-if="!loading && !messages.length"
          class="rounded-xl border border-default bg-muted/40 p-5"
        >
          <h3 class="font-medium">{{ $t('¿En qué trabajamos?') }}</h3>
          <p class="mt-1 text-sm text-muted">
            {{
              canUse
                ? $t(
                    'Consulta hojas, catálogos, reglas, evaluaciones o productos del proyecto.',
                  )
                : $t(
                    'Tu acceso a este proyecto permite consultar el historial.',
                  )
            }}
          </p>
        </div>
        <template v-for="message in messages" :key="message.id">
          <article
            v-if="message.role === 'user'"
            class="ms-auto w-fit max-w-[94%] rounded-2xl rounded-ee-md bg-elevated px-4 py-2.5 text-sm"
          >
            <p class="sr-only">{{ $t('Tú') }}</p>
            <p class="whitespace-pre-wrap wrap-anywhere">
              {{ message.content }}
            </p>
          </article>
          <article v-else class="min-w-0 text-sm">
            <p class="sr-only">{{ $t('Asistente') }}</p>
            <AssistantAnswer :content="message.content" />
          </article>

          <ol
            v-if="activity[message.id]?.length"
            :aria-label="$t('Actividad del asistente')"
            class="space-y-1 border-s border-default ps-3"
          >
            <li
              v-for="item in activity[message.id]"
              :key="item.id"
              class="flex min-h-7 items-center gap-2 text-xs text-muted"
            >
              <UIcon
                v-if="
                  item.status === 'working' &&
                  busy &&
                  message.id === activeRun?.userMessageId
                "
                name="i-lucide-loader-circle"
                class="size-3.5 shrink-0 text-ai motion-safe:animate-spin"
              />
              <UIcon
                v-else-if="item.status === 'working'"
                name="i-lucide-circle-minus"
                class="size-3.5 shrink-0"
              />
              <UIcon
                v-else-if="item.status === 'failed'"
                name="i-lucide-circle-alert"
                class="size-3.5 shrink-0 text-error"
              />
              <UIcon v-else name="i-lucide-check" class="size-3.5 shrink-0" />
              <NuxtLink
                v-if="item.destination"
                :to="item.destination"
                class="focus-ring rounded-sm hover:text-highlighted hover:underline"
                >{{ $t(item.label) }}</NuxtLink
              >
              <span v-else>{{ $t(item.label) }}</span>
              <span v-if="item.status === 'failed'" class="text-error">{{
                $t('Falló')
              }}</span>
            </li>
          </ol>
        </template>

        <UAlert
          v-if="activeRun?.error"
          color="error"
          variant="subtle"
          :title="activeRun.error.message[language]"
        />
        <AssistantProposalCard
          v-if="activeRun?.proposal"
          :project-id="scope.projectId"
          :proposal="activeRun.proposal"
          :busy="deciding"
          :can-decide="canUse"
          @decide="decideProposal"
        />
        <UButton
          v-if="busy && !following && error"
          size="sm"
          variant="soft"
          @click="follow()"
          >{{ $t('Reconectar') }}</UButton
        >
      </div>
    </div>

    <div class="shrink-0 border-t border-default bg-default px-4 pb-4 pt-1">
      <div class="mx-auto w-full max-w-3xl" :class="{ 'sm:px-4': fullPage }">
        <div class="flex min-h-10 flex-wrap items-center gap-x-2">
          <AssistantMascot
            :live="live"
            :visible="visible"
            :destination="destination"
            @locate="emit('locate', $event)"
          />
          <p
            class="mr-auto text-xs text-muted"
            role="status"
            aria-live="polite"
          >
            {{ announce }}
          </p>
          <USwitch
            v-model="followActions"
            size="xs"
            :label="$t('Seguir acciones')"
          />
        </div>
        <form
          v-if="canUse"
          class="rounded-xl border border-default bg-elevated/40 p-2 focus-within:border-ai"
          @submit.prevent="submit"
        >
          <p v-if="selectionLabel" class="px-1 pb-1 text-xs text-ai">
            {{ selectionLabel }}
          </p>
          <UTextarea
            v-model="content"
            autoresize
            :rows="2"
            :maxrows="6"
            :maxlength="16000"
            variant="none"
            :aria-label="$t('Mensaje para el asistente')"
            :placeholder="$t('Escribe un mensaje')"
            class="w-full"
            @keydown.enter.exact="submitFromKeyboard"
          />
          <div class="flex items-center justify-end gap-2">
            <UButton
              v-if="busy"
              type="button"
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-square"
              :loading="cancelling"
              @click="cancel"
              >{{ $t('Detener') }}</UButton
            >
            <UButton
              v-else
              type="submit"
              size="sm"
              icon="i-lucide-arrow-up"
              :loading="sending"
              :disabled="!canSend"
              >{{ $t('Enviar') }}</UButton
            >
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

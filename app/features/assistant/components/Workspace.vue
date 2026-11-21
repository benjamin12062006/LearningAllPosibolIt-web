<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import {
  ASSISTANT_PANEL_WIDTH,
  useAssistantPanelWidth,
} from '../../../composables/useResizableWidth';
import { useProjectScope } from '../../projects/composables/useProjectScope';
import { useAssistantWorkspace } from '../composables/useAssistantWorkspace';
import type { RunContext } from '../services/assistant';
import type { Proposal, RunEvent } from '../types/assistant';
import { operationDestination } from '../utils/activity';
import { proposalLink } from '../utils/proposal-link';
import { worksheetTarget } from '../utils/run-state';

const props = defineProps<{
  projectId: string;
  fullPage: boolean;
  historyDock: HTMLElement | null;
}>();
const emit = defineEmits<{ ready: [] }>();
const workspace = useAssistantWorkspace();
const { language } = useAppLocale();
const { scope, can, error, refresh } = useProjectScope(
  toRef(props, 'projectId'),
);
const route = useRoute();
const router = useRouter();
const wideDock = useTemplateRef('wideDock');
const sideDock = useTemplateRef('sideDock');
const destination = shallowRef<RouteLocationRaw>();
const worksheet = computed(() => {
  const placement = workspace.worksheet.value;
  return placement?.worksheetId === route.params.worksheetId
    ? placement
    : undefined;
});
const chatDock = computed(() => {
  if (props.fullPage && wideDock.value) return wideDock.value;
  return worksheet.value?.element.value ?? sideDock.value;
});
const showSide = computed(
  () =>
    workspace.open.value && !props.fullPage && !worksheet.value?.element.value,
);
const visible = computed(() => props.fullPage || workspace.open.value);
const limits = ASSISTANT_PANEL_WIDTH;
const chat = useAssistantPanelWidth();

let navigation = Promise.resolve();
let navigationGeneration = 0;
let disposed = false;
onMounted(() => emit('ready'));
onBeforeUnmount(() => {
  disposed = true;
});

async function context(): Promise<RunContext> {
  const section = sectionForRoute();
  const selectedLanguage = language.value;
  if (worksheet.value)
    return {
      section,
      language: selectedLanguage,
      ...(await worksheet.value.context()),
    };
  const workbookId = section === 'worksheets' ? workspace.workbookId.value : '';
  const evaluationId = route.params.evaluationId;
  const catalogSnapshotId = route.query.catalogo;
  const rulesetRevision = Number(route.params.revision);
  return {
    section,
    language: selectedLanguage,
    ...(workbookId ? { workbookId } : {}),
    ...(typeof evaluationId === 'string' ? { evaluationId } : {}),
    ...(typeof catalogSnapshotId === 'string' ? { catalogSnapshotId } : {}),
    ...(Number.isInteger(rulesetRevision) && rulesetRevision > 0
      ? { rulesetRevision }
      : {}),
  };
}

function sectionForRoute(): NonNullable<RunContext['section']> {
  if (props.fullPage) return 'chats';
  if (!route.path.startsWith(`/projects/${props.projectId}`)) return 'project';
  const section = route.path.split('/')[3];
  switch (section) {
    case 'rules':
    case 'evaluations':
    case 'products':
    case 'feed':
    case 'integrations':
      return section;
    case 'worksheets':
    case 'workbooks':
      return 'worksheets';
    default:
      return section ? 'project' : 'catalog';
  }
}

function showActivity(event: RunEvent) {
  if (event.type === 'run.queued') destination.value = undefined;
  if (event.type !== 'tool.completed' || event.data.status !== 'succeeded')
    return;
  const { operation, target } = event.data;
  if (typeof operation !== 'string') return;
  const to = operationDestination(props.projectId, operation, target);
  if (to) queueNavigation(to);
}

function confirmed(proposal: Proposal) {
  const keys = affectedQueries(proposal);
  if (keys.length) void refreshNuxtData(keys);
  const link = proposalLink(props.projectId, proposal);
  if (link) queueNavigation(link.to);
}

function affectedQueries(proposal: Proposal) {
  const { projectId } = props;
  const target = worksheetTarget(proposal.target);
  switch (proposal.operation) {
    case 'create_ruleset':
      return [`rulesets:${projectId}`];
    case 'request_evaluation':
      return [`evaluations:${projectId}`];
    case 'propose_catalog_from_sheet':
      return [`imports:${projectId}`];
    case 'propose_sheet_layout':
    case 'duplicate_worksheet':
    case 'open_catalog_as_worksheet':
      return [`workbooks:${projectId}:true`, `workbooks:${projectId}:false`];
    case 'suggest_view':
    case 'update_saved_view':
      return target ? [`views:${projectId}:${target.worksheetId}`] : [];
    case 'delete_catalog_import':
      return [`imports:${projectId}`];
    case 'set_feed_source':
    case 'set_feed_schedule':
    case 'approve_feed_policy':
      return [`feed:${projectId}`];
    case 'submit_changeset':
    case 'reopen_changeset':
    case 'reject_changeset':
    case 'rebase_changeset':
    case 'propose_revert':
    case 'create_import_mapping':
    case 'delete_import_mapping':
    case 'export_worksheet':
      return target ? [`worksheet:${projectId}:${target.worksheetId}`] : [];
    default:
      return [];
  }
}

function queueNavigation(to: RouteLocationRaw) {
  const generation = navigationGeneration;
  navigation = navigation
    .then(async () => {
      if (
        disposed ||
        generation !== navigationGeneration ||
        !visible.value ||
        !workspace.followActions.value
      )
        return;
      const current = router.currentRoute.value;
      const next = router.resolve(to);
      if (current.fullPath !== next.fullPath) {
        if (current.path === '/chats') workspace.open.value = true;
        const failure = await router.push(to);
        if (failure && router.currentRoute.value.fullPath !== next.fullPath)
          return;
      }
      if (generation === navigationGeneration) destination.value = to;
    })
    .catch(() => {
      // El enlace de la actividad sigue disponible si la ruta no pudo abrirse.
    });
}

function conversationChanged() {
  navigationGeneration += 1;
  destination.value = undefined;
}
</script>

<template>
  <UDashboardPanel
    v-if="fullPage"
    id="chats"
    :ui="{ body: 'p-0 sm:p-0 gap-0 overflow-hidden' }"
  >
    <template #header>
      <UDashboardNavbar title="Chats">
        <template #leading>
          <UDashboardSidebarToggle />
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div ref="wideDock" class="flex min-h-0 min-w-0 flex-1" />
    </template>
  </UDashboardPanel>

  <aside
    v-show="showSide"
    :aria-label="$t('Panel del asistente')"
    class="relative flex min-h-0 max-w-full flex-col border-s border-default bg-default max-lg:fixed max-lg:inset-y-0 max-lg:end-0 max-lg:z-(--layer-panel) max-lg:shadow-xl lg:max-w-[55vw] lg:shrink-0"
    :style="{ width: `${chat.width.value}rem` }"
    @keydown.escape="workspace.open.value = false"
  >
    <div
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      :aria-label="$t('Ancho del chat')"
      :aria-valuemin="limits.min"
      :aria-valuemax="limits.max"
      :aria-valuenow="chat.width.value"
      class="absolute inset-y-0 -start-1 z-(--layer-bar) hidden w-2 touch-none cursor-col-resize rounded focus-visible:bg-primary/60 lg:block"
      @keydown="chat.onKeydown"
      @pointerdown="chat.onPointerDown"
    />
    <UButton
      class="absolute end-1 top-1 z-10 lg:hidden"
      color="neutral"
      variant="ghost"
      icon="i-lucide-x"
      :aria-label="$t('Cerrar asistente')"
      @click="workspace.open.value = false"
    />
    <div ref="sideDock" class="flex min-h-0 min-w-0 flex-1 max-lg:pt-8" />
  </aside>

  <Teleport v-if="chatDock" :to="chatDock">
    <AssistantChat
      v-if="scope"
      v-model:follow-actions="workspace.followActions.value"
      :scope="scope"
      :can-use="can('ai.use')"
      :full-page="fullPage"
      :visible="visible"
      :history-dock="historyDock"
      :selection-label="worksheet?.selectionLabel.value"
      :context="context"
      :destination="destination"
      @activity="workspace.live.value = $event"
      @busy="workspace.busy.value = $event"
      @locate="worksheet?.locate($event)"
      @event="showActivity"
      @confirmed="confirmed"
      @conversation-change="conversationChanged"
    />
    <UAlert
      v-else-if="error"
      :title="error.message"
      color="error"
      class="m-4 self-start"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />
    <USkeleton v-else class="m-4 h-20 flex-1 self-start" />
  </Teleport>
</template>

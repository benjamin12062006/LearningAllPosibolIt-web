<script setup lang="ts">
import { useProjectScope } from '../../projects/composables/useProjectScope';
import type { Proposal } from '../../assistant/types/assistant';

const { t } = useAppLocale();


const route = useRoute();
const { $integrations } = useNuxtApp();
const { run, isRunning, failure } = useAction();
const projectId = computed(() => String(route.params.id));
const proposalId = computed(() => String(route.params.proposalId));
const {
  scope,
  can,
  error: accessError,
  refresh: refreshAccess,
} = useProjectScope(projectId);
const { data, error, refresh } = useAsyncData(
  () => `integration-proposal:${projectId.value}:${proposalId.value}`,
  () =>
    scope.value
      ? $integrations.proposal(scope.value, proposalId.value)
      : Promise.resolve(null),
  { server: false, watch: [scope] },
);
const decision = shallowRef<Proposal>();
const proposal = computed(() => decision.value ?? data.value);
const invalid = computed(() =>
  [
    'AGENT_PROPOSAL_EXPIRED',
    'AGENT_PROPOSAL_STALE',
    'AGENT_PROPOSAL_DECIDED',
  ].includes(failure.value?.code ?? ''),
);
const loadError = computed(() => accessError.value ?? error.value);

async function decide(action: 'confirm' | 'reject') {
  const current = scope.value;
  const reviewed = proposal.value;
  if (!current || !reviewed || invalid.value || isRunning.value) return;
  const result = await run(t('No se completó la decisión'), () =>
    $integrations.decide(current, reviewed, action),
  );
  if (result) decision.value = result;
}

async function retry() {
  if (accessError.value) await refreshAccess();
  await refresh();
}
</script>

<template>
  <WorkspacePage
    id="integration-proposal"
    compact-cover
    :title="$t('Revisar propuesta externa')"
  >
    <template #subtitle
      ><UButton
        :to="`/projects/${projectId}/integrations`"
        variant="link"
        class="px-0"
        icon="i-lucide-arrow-left"
        >{{ $t('Volver a Integraciones') }}</UButton
      ></template
    >
    <UAlert
      v-if="loadError"
      color="error"
      :title="loadError.message"
      :actions="[{ label: 'Reintentar', onClick: retry }]"
    />
    <UAlert
      v-if="invalid"
      class="mb-4"
      color="warning"
      :title="$t('La propuesta ya no se puede decidir')"
      :description="failure?.message"
    />
    <AssistantProposalCard
      v-if="proposal"
      :proposal="proposal"
      :project-id="projectId"
      :busy="isRunning"
      :can-decide="can('ai.use') && !invalid"
      @decide="decide"
    />
    <USkeleton v-else-if="!loadError" class="h-20" />
  </WorkspacePage>
</template>

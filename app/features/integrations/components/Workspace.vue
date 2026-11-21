<script setup lang="ts">
import { useProjectScope } from '../../projects/composables/useProjectScope';
import { useProject } from '../../projects/composables/useProjects';
const route = useRoute();
const { $organizations } = useNuxtApp();
const projectId = computed(() => String(route.params.id));
const { project } = useProject(projectId);
const {
  scope,
  can,
  error: accessError,
  refresh: refreshAccess,
} = useProjectScope(projectId);
const { data, error, refresh } = useAsyncData(
  () => `integration-organization:${scope.value?.organizationId ?? 'loading'}`,
  () =>
    scope.value
      ? $organizations.find(scope.value.organizationId)
      : Promise.resolve(null),
  { server: false },
);
const organization = computed(() => data.value?.organization);
const archived = computed(() => !!organization.value?.archivedAt);
const loadError = computed(() => accessError.value ?? error.value);

async function retry() {
  if (accessError.value) await refreshAccess();
  await refresh();
}
</script>

<template>
  <WorkspacePage id="integrations" :title="$t('Integraciones')" compact-cover>
    <template #subtitle
      ><p class="mt-1 text-sm text-muted">
        {{ organization?.name ?? $t('Organización') }} ·
        {{ project?.name ?? $t('Proyecto') }}
      </p></template
    >
    <ProjectNav :project-id="projectId" class="mb-6" />
    <UAlert
      v-if="loadError"
      color="error"
      :title="loadError.message"
      :actions="[{ label: 'Reintentar', onClick: retry }]"
    />
    <template v-else-if="scope && organization">
      <IntegrationsAccessPanel
        :key="`${scope.organizationId}:${scope.projectId}`"
        :scope="scope"
        :project-name="project?.name ?? 'Proyecto'"
        :archived="archived"
        :can-prepare="can('ai.use')"
        :can-manage="can('members.manage')"
      />
      <IntegrationsKnowledgePanel
        :project-id="projectId"
        :can-reindex="can('changeset.approve') && !archived"
      />
    </template>
    <div v-else class="space-y-3" :aria-label="$t('Cargando integraciones')">
      <USkeleton v-for="line in 3" :key="line" class="h-12" />
    </div>
  </WorkspacePage>
</template>

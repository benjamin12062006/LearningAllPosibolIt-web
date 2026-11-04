<script setup lang="ts">
definePageMeta({ layout: 'workspace' });

const route = useRoute();
const projectId = computed(() => String(route.params.id));

/**
 * `?base=3` parte de la revisión 3. Sin número válido se parte de la más
 * reciente (como la página de la clase 70 cuando `page` no es un número).
 */
const requestedBase = computed(() => {
  const value = Number(route.query.base);
  return Number.isInteger(value) && value > 0 ? value : null;
});

const {
  rulesets,
  status: rulesetsStatus,
  error: rulesetsError,
  refresh: refreshRulesets,
} = useRulesets(projectId);
const {
  imports,
  status: importsStatus,
  error: importsError,
  refresh: refreshImports,
} = useProjectImports(projectId);

const base = computed(() => {
  if (requestedBase.value === null) return rulesets.value[0] ?? null;
  return (
    rulesets.value.find((item) => item.revision === requestedBase.value) ?? null
  );
});

const readyImports = computed(() =>
  imports.value.filter((item) => item.status === 'ready'),
);

const isLoading = computed(
  () => rulesetsStatus.value === 'pending' || importsStatus.value === 'pending',
);
const loadError = computed(() => rulesetsError.value ?? importsError.value);
const isMissingBase = computed(
  () => requestedBase.value !== null && base.value === null,
);

const subtitle = computed(() => {
  if (base.value) return `Parte de la revisión ${base.value.revision}.`;
  return 'Parte de cero.';
});

function retry() {
  void refreshRulesets();
  void refreshImports();
}
</script>

<template>
  <WorkspacePage id="nueva-revision" title="Nueva revisión" compact-cover>
    <template #subtitle>
      <p class="mt-1 text-sm text-muted">{{ subtitle }}</p>
    </template>

    <ProjectNav :project-id="projectId" class="mb-6" />

    <div v-if="isLoading" class="space-y-3">
      <USkeleton v-for="row in 6" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="loadError.message"
      :actions="[{ label: 'Reintentar', onClick: retry }]"
    />

    <UAlert
      v-else-if="isMissingBase"
      color="warning"
      variant="subtle"
      icon="i-lucide-file-question"
      :title="`No existe la revisión ${requestedBase}`"
      :actions="[
        {
          label: 'Partir de la más reciente',
          to: `/projects/${projectId}/rules/new`,
        },
      ]"
    />

    <UEmpty
      v-else-if="readyImports.length === 0"
      icon="i-lucide-file-spreadsheet"
      title="Primero importa tu catálogo"
      description="Las columnas para mapear se leen de una importación lista."
      :actions="[{ label: 'Ir al catálogo', to: `/projects/${projectId}` }]"
    />

    <!-- La key reinicia el borrador si cambia la revisión de partida. -->
    <RulesetForm
      v-else
      :key="base?.id ?? 'cero'"
      :project-id="projectId"
      :base="base"
      :ready-imports="readyImports"
    />
  </WorkspacePage>
</template>

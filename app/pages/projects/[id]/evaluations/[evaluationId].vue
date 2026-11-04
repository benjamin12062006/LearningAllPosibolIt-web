<script setup lang="ts">
import { EVALUATION_STATUS_LABELS } from '../../../../types/evaluations';

definePageMeta({ layout: 'workspace' });

const route = useRoute();
const projectId = computed(() => String(route.params.id));
const evaluationId = computed(() => String(route.params.evaluationId));

const { evaluation, isActive, isWaitingTooLong, status, error, refresh } =
  useEvaluation(projectId, evaluationId);

// El nombre del archivo evaluado, para no mostrar solo un id.
const { snapshot } = useImportSnapshot(
  projectId,
  () => evaluation.value?.snapshotId ?? null,
);

const isFirstLoad = computed(
  () => status.value === 'pending' && evaluation.value === null,
);

const statusColor = computed(() => {
  const value = evaluation.value?.status;
  if (value === 'succeeded') return 'success';
  if (value === 'failed') return 'error';
  return 'info';
});

const sourceSummary = computed(() => {
  if (!evaluation.value) return '';
  const file = snapshot.value?.originalName ?? 'la importación';
  return `${file} con la revisión ${evaluation.value.rulesetRevision}`;
});
</script>

<template>
  <WorkspacePage id="evaluacion" title="Evaluación" compact-cover>
    <template #subtitle>
      <p v-if="evaluation" class="mt-1 text-sm text-muted">
        {{ sourceSummary }} · {{ formatDateTime(evaluation.createdAt) }}
      </p>
    </template>

    <template #title-actions>
      <UBadge
        v-if="evaluation"
        :color="statusColor"
        variant="subtle"
        size="lg"
        :icon="isActive ? 'i-lucide-loader-circle' : undefined"
        :ui="{ leadingIcon: 'animate-spin motion-reduce:animate-none' }"
      >
        {{ EVALUATION_STATUS_LABELS[evaluation.status] }}
      </UBadge>
    </template>

    <ProjectNav :project-id="projectId" class="mb-6" />

    <div v-if="isFirstLoad" class="space-y-3">
      <USkeleton v-for="row in 4" :key="row" class="h-10 w-full" />
    </div>

    <!-- Sin datos todavía: el error de la primera carga ocupa la página. -->
    <UAlert
      v-else-if="error && !evaluation"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <template v-else-if="evaluation">
      <!-- Con datos ya visibles, un fallo al actualizar detiene el seguimiento. -->
      <UAlert
        v-if="error && isActive"
        class="mb-6"
        color="warning"
        variant="subtle"
        icon="i-lucide-refresh-cw-off"
        title="No pudimos actualizar el avance"
        :description="error.message"
        :actions="[{ label: 'Actualizar', onClick: () => refresh() }]"
      />

      <UAlert
        v-if="isWaitingTooLong"
        class="mb-6"
        color="info"
        variant="subtle"
        icon="i-lucide-hourglass"
        title="Sigue evaluándose"
        description="Lleva más de 10 minutos. Actualiza en un rato para ver el resultado."
        :actions="[{ label: 'Actualizar', onClick: () => refresh() }]"
      />

      <div v-if="isActive && !isWaitingTooLong" role="status" class="space-y-3">
        <UProgress animation="carousel" />
        <p class="text-sm text-muted">
          Evaluando cada producto con las reglas. Esta página se actualiza sola.
        </p>
      </div>

      <UAlert
        v-else-if="evaluation.status === 'failed'"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-x"
        title="La evaluación no terminó"
        :description="evaluation.error?.message.es"
        :actions="[
          { label: 'Ver las reglas', to: `/projects/${projectId}/rules` },
        ]"
      />

      <template v-else-if="evaluation.counts">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CountTile
            label="Productos"
            :count="evaluation.counts.total"
            icon="i-lucide-package"
            icon-class="text-muted"
          />
          <CountTile
            label="Válidos"
            :count="evaluation.counts.valid"
            icon="i-lucide-circle-check"
            icon-class="text-success"
          />
          <CountTile
            label="Inválidos"
            :count="evaluation.counts.invalid"
            icon="i-lucide-circle-alert"
            icon-class="text-error"
          />
          <CountTile
            label="Excluidos"
            :count="evaluation.counts.excluded"
            icon="i-lucide-filter-x"
            icon-class="text-muted"
          />
        </div>

        <EvaluationReport
          :project-id="projectId"
          :evaluation-id="evaluationId"
          :counts="evaluation.counts"
          class="mt-10"
        />
      </template>
    </template>
  </WorkspacePage>
</template>

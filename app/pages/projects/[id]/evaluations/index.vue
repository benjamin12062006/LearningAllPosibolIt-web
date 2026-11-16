<script setup lang="ts">
import { useEvaluations } from '../../../../features/evaluations/composables/useEvaluation';
import { useProject } from '../../../../features/projects/composables/useProjects';
definePageMeta({ layout: 'workspace' });

const route = useRoute();
const projectId = computed(() => String(route.params.id));

const { project } = useProject(projectId);
const { evaluations, hasMore, status, error, refresh } =
  useEvaluations(projectId);

const isEvaluateOpen = ref(false);

const isFirstLoad = computed(
  () => status.value === 'pending' && evaluations.value.length === 0,
);
</script>

<template>
  <WorkspacePage id="evaluaciones" :title="$t('Evaluaciones')">
    <template #subtitle>
      <p class="mt-1 text-sm text-muted">
        {{ project?.name ?? $t('Proyecto') }}
        {{
          $t(
            '· cada evaluación aplica una revisión de reglas a una importación.',
          )
        }}
      </p>
    </template>

    <template #title-actions>
      <UButton icon="i-lucide-play" @click="isEvaluateOpen = true">
        {{ $t('Evaluar') }}
      </UButton>
      <EvaluateDialog v-model:open="isEvaluateOpen" :project-id="projectId" />
    </template>

    <ProjectNav :project-id="projectId" class="mb-6" />

    <div v-if="isFirstLoad" class="space-y-3">
      <USkeleton v-for="row in 3" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <UEmpty
      v-else-if="evaluations.length === 0"
      icon="i-lucide-clipboard-check"
      :title="$t('Todavía no hay evaluaciones')"
      :description="
        $t(
          'Evalúa una importación con una revisión de reglas para ver qué productos acepta Google.',
        )
      "
    />

    <template v-else>
      <ul>
        <li v-for="evaluation in evaluations" :key="evaluation.id">
          <EvaluationRow
            :evaluation="evaluation"
            :to="`/projects/${projectId}/evaluations/${evaluation.id}`"
          />
        </li>
      </ul>
      <p v-if="hasMore" class="mt-4 text-sm text-muted">
        {{ $t('Se muestran las 100 evaluaciones más recientes.') }}
      </p>
    </template>
  </WorkspacePage>
</template>

<script setup lang="ts">
import { useProject } from '../../../../features/projects/composables/useProjects';
import { useRulesets } from '../../../../features/rulesets/composables/useRulesets';
definePageMeta({ layout: 'workspace' });

const route = useRoute();
const projectId = computed(() => String(route.params.id));

const { project } = useProject(projectId);
const { rulesets, hasMore, status, error, refresh } = useRulesets(projectId);

const isEvaluateOpen = ref(false);

const isFirstLoad = computed(
  () => status.value === 'pending' && rulesets.value.length === 0,
);
</script>

<template>
  <WorkspacePage id="reglas" :title="$t('Reglas')">
    <template #title-actions>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-if="rulesets.length > 0"
          icon="i-lucide-play"
          color="neutral"
          variant="soft"
          @click="isEvaluateOpen = true"
        >
          {{ $t('Evaluar') }}
        </UButton>
        <UButton :to="`/projects/${projectId}/rules/new`" icon="i-lucide-plus">
          {{ $t('Nueva revisión') }}
        </UButton>
      </div>
      <EvaluateDialog v-model:open="isEvaluateOpen" :project-id="projectId" />
    </template>

    <template #subtitle>
      <p class="mt-1 text-sm text-muted">
        {{ project?.name ?? $t('Proyecto') }}
        {{
          $t(
            '· cada revisión guarda el mapeo y las reglas sin cambiarlas después.',
          )
        }}
      </p>
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
      v-else-if="rulesets.length === 0"
      icon="i-lucide-list-checks"
      :title="$t('Todavía no hay reglas')"
      :description="
        $t(
          'Una revisión dice qué columna del CSV corresponde a cada dato de Google y cómo limpiarlo.',
        )
      "
      :actions="[
        {
          label: 'Crear la primera',
          icon: 'i-lucide-plus',
          to: `/projects/${projectId}/rules/new`,
        },
      ]"
    />

    <template v-else>
      <ul>
        <li v-for="ruleset in rulesets" :key="ruleset.id">
          <RulesetRow
            :ruleset="ruleset"
            :to="`/projects/${projectId}/rules/${ruleset.revision}`"
            :latest="ruleset.id === rulesets[0]?.id"
          />
        </li>
      </ul>
      <p v-if="hasMore" class="mt-4 text-sm text-muted">
        {{ $t('Se muestran las 100 revisiones más recientes.') }}
      </p>
    </template>
  </WorkspacePage>
</template>

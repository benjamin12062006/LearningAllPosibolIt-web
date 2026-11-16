<script setup lang="ts">
import { useProjects } from '../../features/projects/composables/useProjects';
import type { Project } from '../../features/projects/types/projects';

const { t } = useAppLocale();

definePageMeta({ layout: 'workspace' });

type StatusFilter = 'listos' | 'por-configurar';

const FILTER_TITLES: Record<StatusFilter, string> = {
  listos: 'Proyectos listos',
  'por-configurar': t('Por configurar'),
};

const route = useRoute();
const { projects, hasMore, status, error, refresh } = useProjects();

const filter = computed<StatusFilter | null>(() => {
  const value = route.query.estado;
  if (value === 'listos' || value === 'por-configurar') return value;
  return null;
});

const title = computed(() =>
  filter.value ? FILTER_TITLES[filter.value] : t('Proyectos'),
);

const visibleProjects = computed(() =>
  projects.value.filter((project) => matchesFilter(project, filter.value)),
);

const isFirstLoad = computed(
  () => status.value === 'pending' && projects.value.length === 0,
);

function matchesFilter(project: Project, value: StatusFilter | null) {
  if (value === 'listos') return isConfigured(project);
  if (value === 'por-configurar') return !isConfigured(project);
  return true;
}
</script>

<template>
  <WorkspacePage id="proyectos" :title="title">
    <template #actions>
      <UButton
        to="/projects/new"
        icon="i-lucide-plus"
        :aria-label="$t('Nuevo proyecto')"
        color="neutral"
        variant="ghost"
        class="text-white hover:bg-white/15"
      />
    </template>

    <template #subtitle>
      <p class="mt-1 text-sm text-muted">
        {{ $t('Cada proyecto guarda un catálogo y cómo publicarlo.') }}
      </p>
    </template>

    <div v-if="isFirstLoad" class="space-y-3">
      <USkeleton v-for="row in 4" :key="row" class="h-10 w-full" />
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
      v-else-if="visibleProjects.length === 0"
      icon="i-lucide-folder-plus"
      :title="filter ? $t('Nada por aquí') : $t('Todavía no tienes proyectos')"
      :description="
        filter
          ? $t('Ningún proyecto está en este estado.')
          : $t('Crea uno para importar tu catálogo.')
      "
      :actions="[
        { label: 'Nuevo proyecto', icon: 'i-lucide-plus', to: '/projects/new' },
      ]"
    />

    <template v-else>
      <ul>
        <li v-for="project in visibleProjects" :key="project.id">
          <ProjectRow :project="project" />
        </li>
      </ul>
      <p v-if="hasMore" class="mt-4 text-sm text-muted">
        {{ $t('Se muestran los primeros 100 proyectos.') }}
      </p>
    </template>
  </WorkspacePage>
</template>

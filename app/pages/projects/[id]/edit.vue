<script setup lang="ts">
import { useProject } from '../../../features/projects/composables/useProjects';
definePageMeta({ layout: 'workspace' });

const route = useRoute();
const { project, status, error, refresh } = useProject(() =>
  String(route.params.id),
);
</script>

<template>
  <WorkspacePage
    id="editar-proyecto"
    :title="$t('Editar proyecto')"
    compact-cover
  >
    <div v-if="status === 'pending' && !project" class="space-y-3">
      <USkeleton v-for="row in 4" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-folder-x"
      :title="error.message"
      :actions="[
        { label: 'Reintentar', onClick: () => refresh() },
        { label: 'Volver a proyectos', to: '/projects', variant: 'ghost' },
      ]"
    />

    <!-- La key reinicia el formulario si se navega a otro proyecto. -->
    <ProjectForm v-else-if="project" :key="project.id" :project="project" />
  </WorkspacePage>
</template>

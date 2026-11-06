<script setup lang="ts">
/**
 * Proyectos de la organización. Con E1.2 retirada, un proyecto solo se abre
 * si es tuyo (la API sigue comprobando el propietario): los demás se listan
 * sin enlace para no llevar a un «no encontrado».
 */
const props = defineProps<{ organizationId: string }>();

const { projects, status, error } = useOrganizationProjects(
  () => props.organizationId,
);
const { projects: ownProjects } = useProjects();

const ownIds = computed(
  () => new Set(ownProjects.value.map((project) => project.id)),
);
</script>

<template>
  <section aria-labelledby="proyectos-organizacion">
    <h2
      id="proyectos-organizacion"
      class="text-lg font-medium text-highlighted"
    >
      Proyectos
    </h2>

    <div
      v-if="status === 'pending' && projects.length === 0"
      class="mt-3 space-y-3"
    >
      <USkeleton v-for="row in 2" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-3"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
    />

    <p v-else-if="projects.length === 0" class="mt-2 text-sm text-muted">
      Esta organización todavía no tiene proyectos.
    </p>

    <ul v-else class="mt-1">
      <li v-for="project in projects" :key="project.id">
        <ProjectRow v-if="ownIds.has(project.id)" :project="project" />
        <div v-else class="focus-row">
          <UIcon
            name="i-lucide-folder-lock"
            class="size-5 shrink-0 text-dimmed"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm text-default">{{
              project.name
            }}</span>
            <span class="block truncate text-xs text-muted">
              Lo gestiona su propietario.
            </span>
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>

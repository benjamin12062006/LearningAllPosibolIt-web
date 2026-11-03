<script setup lang="ts">
import { ApiFailure } from '../../../services/api-client';
import { CHANNEL_PROFILE_LABELS } from '../../../types/projects';

definePageMeta({ layout: 'workspace' });

const route = useRoute();
// La ruta [id] tiene un solo segmento: siempre es texto.
const projectId = computed(() => String(route.params.id));

const { $projects } = useNuxtApp();
const { project, status, error, refresh } = useProject(projectId);
const { refresh: refreshProjects } = useProjects();
const toast = useToast();

const isDeleteOpen = ref(false);
const isDeleting = ref(false);

const title = computed(() => project.value?.name ?? 'Proyecto');

const createdAt = computed(() =>
  project.value ? formatDate(project.value.createdAt) : '',
);

const channelLabel = computed(() => {
  const channel = project.value?.channelProfile;
  return channel ? CHANNEL_PROFILE_LABELS[channel] : 'Sin elegir';
});

async function deleteProject() {
  isDeleting.value = true;
  try {
    await $projects.remove(projectId.value);
    await refreshProjects();
    toast.add({
      title: 'Proyecto eliminado',
      color: 'success',
      icon: 'i-lucide-trash-2',
    });
    await navigateTo('/projects');
  } catch (failure) {
    toast.add({
      title: 'No se eliminó el proyecto',
      description: messageOf(failure),
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isDeleting.value = false;
    isDeleteOpen.value = false;
  }
}

function messageOf(failure: unknown) {
  if (failure instanceof ApiFailure) return failure.message;
  return 'Inténtalo de nuevo.';
}
</script>

<template>
  <WorkspacePage id="proyecto" :title="title">
    <template #actions>
      <UButton
        v-if="project"
        :to="`/projects/${project.id}/edit`"
        icon="i-lucide-pencil"
        aria-label="Editar proyecto"
        color="neutral"
        variant="ghost"
        class="text-white hover:bg-white/15"
      />
    </template>

    <div v-if="status === 'pending' && !project" class="space-y-3">
      <USkeleton v-for="row in 3" :key="row" class="h-10 w-full" />
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

    <template v-else-if="project">
      <UAlert
        v-if="project.configurationStatus === 'required'"
        class="mb-6"
        color="warning"
        variant="subtle"
        icon="i-lucide-settings-2"
        title="Falta configurar este proyecto"
        description="Elige país, moneda y canal para poder revisar y publicar su catálogo."
        :actions="[{ label: 'Configurar', to: `/projects/${project.id}/edit` }]"
      />

      <dl class="grid gap-x-8 sm:grid-cols-2">
        <div class="focus-row justify-between">
          <dt class="text-sm text-muted">Canal</dt>
          <dd class="text-sm">{{ channelLabel }}</dd>
        </div>
        <div class="focus-row justify-between">
          <dt class="text-sm text-muted">País</dt>
          <dd class="text-sm">{{ project.country ?? 'Sin elegir' }}</dd>
        </div>
        <div class="focus-row justify-between">
          <dt class="text-sm text-muted">Moneda</dt>
          <dd class="text-sm">{{ project.currency ?? 'Sin elegir' }}</dd>
        </div>
        <div class="focus-row justify-between">
          <dt class="text-sm text-muted">Creado</dt>
          <dd class="text-sm">
            <time :datetime="project.createdAt">{{ createdAt }}</time>
          </dd>
        </div>
      </dl>

      <ProjectImports :project-id="project.id" class="mt-10" />

      <section class="mt-12 border-t border-default pt-6">
        <h2 class="text-sm font-medium text-highlighted">Eliminar proyecto</h2>
        <p class="mt-1 text-sm text-muted">
          También se borran sus importaciones y archivos. No se puede deshacer.
        </p>
        <UModal
          v-model:open="isDeleteOpen"
          title="¿Eliminar este proyecto?"
          :description="`«${project.name}» y todas sus importaciones se borrarán.`"
        >
          <UButton
            class="mt-4"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
          >
            Eliminar proyecto
          </UButton>

          <template #footer>
            <div class="flex w-full justify-end gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                @click="isDeleteOpen = false"
              >
                Cancelar
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                :loading="isDeleting"
                @click="deleteProject"
              >
                Eliminar
              </UButton>
            </div>
          </template>
        </UModal>
      </section>
    </template>
  </WorkspacePage>
</template>

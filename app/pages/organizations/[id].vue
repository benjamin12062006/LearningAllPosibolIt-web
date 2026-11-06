<script setup lang="ts">
import { ApiFailure } from '../../services/api-client';
import { ROLE_LABELS, canOwn, isArchived } from '../../types/organizations';

definePageMeta({ layout: 'workspace' });

const route = useRoute();
// La ruta [id] tiene un solo segmento: siempre es texto.
const organizationId = computed(() => String(route.params.id));

const { $organizations } = useNuxtApp();
const toast = useToast();
const { detail, status, error, refresh, replaceDetail } =
  useOrganization(organizationId);
const { refresh: refreshOrganizations } = useOrganizations();

const isArchiveOpen = ref(false);
const isWorking = ref(false);

const organization = computed(() => detail.value?.organization ?? null);
const access = computed(() => detail.value?.access ?? null);
const title = computed(() => organization.value?.name ?? 'Organización');

const archived = computed(() =>
  organization.value ? isArchived(organization.value) : false,
);
/** Solo el propietario archiva, y nunca la organización personal. */
const canArchive = computed(
  () =>
    access.value !== null &&
    canOwn(access.value) &&
    organization.value?.kind === 'team',
);

const subtitle = computed(() => {
  if (!organization.value || !access.value) return '';
  const kind = organization.value.kind === 'personal' ? 'Personal' : 'Equipo';
  return `${kind} · tu rol: ${ROLE_LABELS[access.value.role]}`;
});

async function setArchived(next: boolean) {
  isWorking.value = true;
  try {
    replaceDetail(await $organizations.setArchived(organizationId.value, next));
    await refreshOrganizations();
    toast.add({
      title: next ? 'Organización archivada' : 'Organización restaurada',
      color: 'success',
      icon: next ? 'i-lucide-archive' : 'i-lucide-archive-restore',
    });
  } catch (failure) {
    toast.add({
      title: 'No se pudo cambiar',
      description:
        failure instanceof ApiFailure ? failure.message : 'Inténtalo de nuevo.',
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isWorking.value = false;
    isArchiveOpen.value = false;
  }
}
</script>

<template>
  <WorkspacePage id="organizacion" :title="title" compact-cover>
    <template #subtitle>
      <p v-if="subtitle" class="mt-1 text-sm text-muted">{{ subtitle }}</p>
    </template>

    <div v-if="status === 'pending' && !detail" class="space-y-3">
      <USkeleton v-for="row in 4" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-building-2"
      :title="error.message"
      :actions="[
        { label: 'Reintentar', onClick: () => refresh() },
        { label: 'Ver organizaciones', to: '/organizations', variant: 'ghost' },
      ]"
    />

    <div v-else-if="organization && access" class="space-y-10">
      <UAlert
        v-if="archived"
        color="neutral"
        variant="subtle"
        icon="i-lucide-archive"
        title="Organización archivada"
        description="Se puede consultar, pero no cambiar miembros ni invitaciones."
        :actions="
          canArchive
            ? [
                {
                  label: 'Restaurar',
                  loading: isWorking,
                  onClick: () => setArchived(false),
                },
              ]
            : []
        "
      />

      <OrganizationProjects :organization-id="organization.id" />

      <section
        v-if="canArchive && !archived"
        aria-labelledby="archivar"
        class="border-t border-default pt-6"
      >
        <h2 id="archivar" class="text-sm font-medium text-highlighted">
          Archivar organización
        </h2>
        <p class="mt-1 text-sm text-muted">
          Queda en modo lectura: nadie podrá cambiar miembros ni invitaciones
          hasta restaurarla.
        </p>
        <UModal
          v-model:open="isArchiveOpen"
          title="¿Archivar esta organización?"
          :description="`«${organization.name}» quedará en modo lectura.`"
        >
          <UButton
            class="mt-4"
            color="neutral"
            variant="soft"
            icon="i-lucide-archive"
          >
            Archivar
          </UButton>
          <template #footer>
            <div class="flex w-full justify-end gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                @click="isArchiveOpen = false"
              >
                Cancelar
              </UButton>
              <UButton
                color="warning"
                icon="i-lucide-archive"
                :loading="isWorking"
                @click="setArchived(true)"
              >
                Archivar
              </UButton>
            </div>
          </template>
        </UModal>
      </section>
    </div>
  </WorkspacePage>
</template>

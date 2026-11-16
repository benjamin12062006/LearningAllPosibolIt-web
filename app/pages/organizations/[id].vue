<script setup lang="ts">
import {
  useOrganizations,
  useOrganization,
} from '../../features/organizations/composables/useOrganizations';
import { ApiFailure } from '../../services/api-client';
import {
  ROLE_LABELS,
  canManageMembers,
  canOwn,
  isArchived,
} from '../../features/organizations/types/organizations';

const { t } = useAppLocale();

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
const title = computed(() => organization.value?.name ?? t('Organización'));

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

/** Una organización archivada se lee, pero no cambia miembros ni invitaciones. */
const canManage = computed(
  () =>
    access.value !== null && canManageMembers(access.value) && !archived.value,
);

async function onLeft() {
  await refreshOrganizations();
  toast.add({
    title: t('Saliste de la organización'),
    icon: 'i-lucide-log-out',
  });
  await navigateTo('/organizations');
}

const subtitle = computed(() => {
  if (!organization.value || !access.value) return '';
  const kind = organization.value.kind === 'personal' ? 'Personal' : 'Equipo';
  return t('{0} · tu rol: {1}', [kind, t(ROLE_LABELS[access.value.role])]);
});

async function setArchived(next: boolean) {
  isWorking.value = true;
  try {
    replaceDetail(await $organizations.setArchived(organizationId.value, next));
    await refreshOrganizations();
    toast.add({
      title: next ? t('Organización archivada') : t('Organización restaurada'),
      color: 'success',
      icon: next ? 'i-lucide-archive' : 'i-lucide-archive-restore',
    });
  } catch (failure) {
    toast.add({
      title: t('No se pudo cambiar'),
      description:
        failure instanceof ApiFailure
          ? failure.message
          : t('Inténtalo de nuevo.'),
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
        :title="$t('Organización archivada')"
        :description="
          $t('Se puede consultar, pero no cambiar miembros ni invitaciones.')
        "
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

      <OrganizationMembers
        :organization-id="organization.id"
        :can-manage="canManage"
        :is-personal="organization.kind === 'personal'"
        @access-changed="refresh()"
        @left="onLeft"
      />

      <OrganizationInvitations
        v-if="canManage"
        :organization-id="organization.id"
      />

      <section
        v-if="canArchive && !archived"
        aria-labelledby="archivar"
        class="border-t border-default pt-6"
      >
        <h2 id="archivar" class="text-sm font-medium text-highlighted">
          {{ $t('Archivar organización') }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{
            $t(
              'Queda en modo lectura: nadie podrá cambiar miembros ni invitaciones hasta restaurarla.',
            )
          }}
        </p>
        <UModal
          v-model:open="isArchiveOpen"
          :title="$t('¿Archivar esta organización?')"
          :description="
            $t('«{0}» quedará en modo lectura.', [organization.name])
          "
        >
          <UButton
            class="mt-4"
            color="neutral"
            variant="soft"
            icon="i-lucide-archive"
          >
            {{ $t('Archivar') }}
          </UButton>
          <template #footer>
            <div class="flex w-full justify-end gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                @click="isArchiveOpen = false"
              >
                {{ $t('Cancelar') }}
              </UButton>
              <UButton
                color="warning"
                icon="i-lucide-archive"
                :loading="isWorking"
                @click="setArchived(true)"
              >
                {{ $t('Archivar') }}
              </UButton>
            </div>
          </template>
        </UModal>
      </section>
    </div>
  </WorkspacePage>
</template>

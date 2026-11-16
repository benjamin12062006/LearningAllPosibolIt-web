<script setup lang="ts">
import { useOrganizations } from '../../features/organizations/composables/useOrganizations';
definePageMeta({ layout: 'workspace' });

const { organizations, status, error, refresh } = useOrganizations();
const isCreateOpen = ref(false);

const isFirstLoad = computed(
  () => status.value === 'pending' && organizations.value.length === 0,
);
</script>

<template>
  <WorkspacePage id="organizaciones" :title="$t('Organizaciones')">
    <template #subtitle>
      <p class="mt-1 text-sm text-muted">
        {{
          $t('Dónde trabajas y con quién. Tu rol decide qué puedes cambiar.')
        }}
      </p>
    </template>

    <template #title-actions>
      <UButton icon="i-lucide-plus" @click="isCreateOpen = true">
        {{ $t('Nueva organización') }}
      </UButton>
      <CreateOrganizationModal v-model:open="isCreateOpen" />
    </template>

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
      v-else-if="organizations.length === 0"
      icon="i-lucide-building-2"
      :title="$t('Sin organizaciones')"
      :description="$t('Crea una para invitar a otras personas.')"
    />

    <ul v-else>
      <li v-for="organization in organizations" :key="organization.id">
        <OrganizationRow :organization="organization" />
      </li>
    </ul>
  </WorkspacePage>
</template>

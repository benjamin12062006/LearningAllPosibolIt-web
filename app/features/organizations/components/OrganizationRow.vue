<!-- Una organización como fila Focus: tipo, nombre, mi rol y si está archivada. -->
<script setup lang="ts">
import {
  ROLE_LABELS,
  isArchived,
  type OrganizationMembership,
} from '../types/organizations';

const props = defineProps<{ organization: OrganizationMembership }>();

const kindLabel = computed(() =>
  props.organization.kind === 'personal' ? 'Personal' : 'Equipo',
);
</script>

<template>
  <NuxtLink
    :to="`/organizations/${organization.id}`"
    class="focus-row group -mx-2 rounded-md px-2 transition-colors hover:bg-elevated/40"
  >
    <UIcon
      :name="
        organization.kind === 'personal'
          ? 'i-lucide-user'
          : 'i-lucide-building-2'
      "
      class="size-5 shrink-0"
      :class="isArchived(organization) ? 'text-dimmed' : 'text-primary'"
    />
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm text-default">{{
        organization.name
      }}</span>
      <span class="block truncate text-xs text-muted">
        {{ kindLabel }} · {{ $t(ROLE_LABELS[organization.role]) }}
      </span>
    </span>
    <UBadge
      v-if="isArchived(organization)"
      color="neutral"
      variant="outline"
      size="sm"
    >
      {{ $t('Archivada') }}
    </UBadge>
    <UIcon
      name="i-lucide-chevron-right"
      class="size-4 text-dimmed opacity-0 transition-opacity group-hover:opacity-100"
    />
  </NuxtLink>
</template>

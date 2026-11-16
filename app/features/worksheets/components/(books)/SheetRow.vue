<script setup lang="ts">
import type { MenuAction } from '../../../../components/ui/Menu.vue';
import {
  isArchivedWorksheet,
  type WorksheetSummary,
} from '../../types/worksheets';

const { t, language } = useAppLocale();

/** Una hoja en la lista de su libro: nombre, tamaño, procedencia y acciones. */
const props = defineProps<{
  projectId: string;
  worksheet: WorksheetSummary;
  /** Editor o más: sin él solo se puede abrir y ver el historial. */
  canWrite: boolean;
}>();

const emit = defineEmits<{
  action: [action: SheetAction];
}>();

export type SheetAction = 'rename' | 'duplicate' | 'archive' | 'restore';

const isArchived = computed(() => props.worksheet.archivedAt !== null);
const isReadOnly = computed(() => isArchivedWorksheet(props.worksheet));

const provenance = computed(() => {
  if (props.worksheet.duplicatedFrom) return t('Copia de otra hoja');
  if (props.worksheet.openedFromCatalog) return t('Abierta desde un catálogo');
  return null;
});

const detail = computed(() => {
  const { rowCount, sequence } = props.worksheet.headRevision;
  const parts = [
    t('{0} filas', [rowCount.toLocaleString(language.value)]),
    t('revisión {0}', [sequence]),
  ];
  if (provenance.value) parts.push(provenance.value);
  return parts.join(' · ');
});

const actions = computed<MenuAction[]>(() => {
  if (isArchived.value) {
    return [
      {
        value: 'restore',
        label: t('Restaurar'),
        icon: 'i-lucide-archive-restore',
      },
    ];
  }
  return [
    { value: 'rename', label: 'Renombrar', icon: 'i-lucide-pencil' },
    { value: 'duplicate', label: 'Duplicar', icon: 'i-lucide-copy' },
    {
      value: 'archive',
      label: t('Archivar'),
      icon: 'i-lucide-archive',
      isDestructive: true,
    },
  ];
});

function onSelect(value: string) {
  if (
    value === 'rename' ||
    value === 'duplicate' ||
    value === 'archive' ||
    value === 'restore'
  ) {
    emit('action', value);
  }
}
</script>

<template>
  <div class="focus-row">
    <UIcon
      :name="isReadOnly ? 'i-lucide-archive' : 'i-lucide-table-2'"
      class="size-5 shrink-0"
      :class="isReadOnly ? 'text-muted' : 'text-primary'"
    />
    <NuxtLink
      :to="`/projects/${projectId}/worksheets/${worksheet.id}`"
      class="focus-ring min-w-0 flex-1 rounded-sm"
    >
      <span class="block truncate text-sm text-default">
        {{ worksheet.name }}
        <UBadge
          v-if="isReadOnly"
          color="neutral"
          variant="subtle"
          size="sm"
          class="ms-1.5"
        >
          {{ $t('Archivada') }}
        </UBadge>
      </span>
      <span class="block truncate text-xs text-muted">{{ detail }}</span>
    </NuxtLink>
    <UButton
      :to="{
        path: `/projects/${projectId}/worksheets/${worksheet.id}`,
        query: { panel: 'history' },
      }"
      color="neutral"
      variant="ghost"
      size="sm"
      icon="i-lucide-history"
      class="touch-target max-sm:hidden"
    >
      {{ $t('Historial') }}
    </UButton>
    <UiMenu
      v-if="canWrite"
      :label="$t('Acciones de la hoja {0}', [worksheet.name])"
      :actions="actions"
      @select="onSelect"
    />
  </div>
</template>

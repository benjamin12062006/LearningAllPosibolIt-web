<script setup lang="ts">
import { useProjectImports } from '../../../catalog/composables/useProjectImports';
import { WORKSHEET_LIMITS } from '../../types/worksheets';

const { t, formatDate, language } = useAppLocale();

/**
 * Abrir un catálogo ya importado como una hoja nueva (puente catálogo → hoja):
 * la hoja nace con las mismas filas y recuerda de qué catálogo salió.
 */
const props = defineProps<{
  projectId: string;
  workbookName: string;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  submit: [input: { name: string; snapshotId: string }];
}>();
const open = defineModel<boolean>('open', { required: true });

const { imports, status } = useProjectImports(() => props.projectId);

const name = ref('');
const snapshotId = ref<string | undefined>();

const catalogItems = computed(() =>
  imports.value
    .filter((item) => item.status === 'ready')
    .map((item) => ({
      value: item.id,
      label: t('{0} · {1} filas · {2}', [
        item.originalName,
        (item.rowCount ?? 0).toLocaleString(language.value),
        formatDate(item.createdAt),
      ]),
    })),
);
const canSubmit = computed(
  () => name.value.trim() !== '' && snapshotId.value !== undefined,
);

watch(open, (isOpen) => {
  if (!isOpen) return;
  name.value = '';
  snapshotId.value = catalogItems.value[0]?.value;
});

function submit() {
  if (!snapshotId.value || name.value.trim() === '') return;
  emit('submit', { name: name.value.trim(), snapshotId: snapshotId.value });
}
</script>

<template>
  <UiDialog
    v-model:open="open"
    :title="$t('Abrir un catálogo como hoja')"
    :description="
      $t('La hoja se crea en el libro «{0}» con las filas del catálogo.', [
        workbookName,
      ])
    "
  >
    <USkeleton v-if="status === 'pending'" class="h-20 w-full" />
    <UAlert
      v-else-if="catalogItems.length === 0"
      color="info"
      variant="subtle"
      icon="i-lucide-file-spreadsheet"
      :title="$t('No hay catálogos listos')"
      :description="$t('Importa un CSV en la sección Catálogo y vuelve aquí.')"
      :actions="[{ label: 'Ir al catálogo', to: `/projects/${projectId}` }]"
    />
    <form v-else id="from-catalog" class="space-y-4" @submit.prevent="submit">
      <UFormField :label="$t('Catálogo')" required>
        <USelect v-model="snapshotId" :items="catalogItems" class="w-full" />
      </UFormField>
      <UFormField :label="$t('Nombre de la hoja')" required>
        <UInput
          v-model="name"
          :maxlength="WORKSHEET_LIMITS.nameLength"
          class="w-full"
          :ui="{ base: 'pointer-coarse:text-base' }"
        />
      </UFormField>
    </form>
    <template #footer>
      <UButton color="neutral" variant="ghost" @click="open = false">
        {{ $t('Cancelar') }}
      </UButton>
      <UButton
        type="submit"
        form="from-catalog"
        :loading="isSaving"
        :disabled="!canSubmit"
      >
        {{ $t('Abrir como hoja') }}
      </UButton>
    </template>
  </UiDialog>
</template>

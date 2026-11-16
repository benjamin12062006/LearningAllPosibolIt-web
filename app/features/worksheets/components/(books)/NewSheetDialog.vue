<script setup lang="ts">
import {
  WORKSHEET_LIMITS,
  type ColumnDefinition,
} from '../../types/worksheets';
import {
  columnDraftProblem,
  emptyColumnDraft,
  repeatedColumnName,
  toColumnDefinition,
  type ColumnDraft,
} from '../../utils/new-columns';

const { t } = useAppLocale();

/**
 * Crear una hoja con sus primeras columnas. Puede empezar sin ninguna: las
 * columnas también se añaden después, desde un borrador o al importar.
 */
defineProps<{ workbookName: string; isSaving: boolean }>();

const emit = defineEmits<{
  submit: [input: { name: string; columns: ColumnDefinition[] }];
}>();
const open = defineModel<boolean>('open', { required: true });

const name = ref('');
const columns = ref<ColumnDraft[]>([emptyColumnDraft()]);

// Una fila en blanco al final no es un error: es el hueco para la siguiente.
const filledColumns = computed(() =>
  columns.value.filter((column) => column.name.trim() !== ''),
);
const problem = computed(() => {
  if (name.value.trim() === '') return 'Ponle un nombre a la hoja.';
  for (const column of filledColumns.value) {
    const columnProblem = columnDraftProblem(column);
    if (columnProblem) return columnProblem;
  }
  const repeated = repeatedColumnName(filledColumns.value);
  return repeated ? t('Hay dos columnas llamadas «{0}».', [repeated]) : null;
});
const isAtColumnLimit = computed(
  () => columns.value.length >= WORKSHEET_LIMITS.columnsPerWorksheet,
);

watch(open, (isOpen) => {
  if (!isOpen) return;
  name.value = '';
  columns.value = [emptyColumnDraft()];
});

function submit() {
  if (problem.value) return;
  emit('submit', {
    name: name.value.trim(),
    columns: filledColumns.value.map(toColumnDefinition),
  });
}
</script>

<template>
  <UiDialog
    v-model:open="open"
    :title="$t('Nueva hoja')"
    :description="$t('En el libro «{0}».', [workbookName])"
  >
    <form id="new-sheet" class="space-y-5" @submit.prevent="submit">
      <UFormField :label="$t('Nombre')" required>
        <UInput
          v-model="name"
          autofocus
          :maxlength="WORKSHEET_LIMITS.nameLength"
          class="w-full"
          :ui="{ base: 'pointer-coarse:text-base' }"
        />
      </UFormField>

      <fieldset>
        <legend class="text-sm font-medium text-default">
          {{ $t('Columnas') }}
        </legend>
        <p class="mt-0.5 text-xs text-muted">
          {{
            $t(
              'Opcional: al importar un archivo se pueden crear las que falten.',
            )
          }}
        </p>
        <ol class="mt-2 space-y-3">
          <li
            v-for="(_column, index) in columns"
            :key="index"
            class="flex items-start gap-2"
          >
            <WorksheetsColumnDraftFields
              v-model="columns[index]!"
              :index="index"
              class="min-w-0 flex-1"
            />
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              :aria-label="`Quitar la columna ${index + 1}`"
              class="touch-target"
              :disabled="columns.length === 1"
              @click="columns.splice(index, 1)"
            />
          </li>
        </ol>
        <UButton
          type="button"
          class="mt-2"
          color="neutral"
          variant="soft"
          icon="i-lucide-plus"
          :disabled="isAtColumnLimit"
          @click="columns.push(emptyColumnDraft())"
        >
          {{ $t('Añadir columna') }}
        </UButton>
      </fieldset>
    </form>

    <template #footer>
      <p v-if="problem" class="me-auto text-sm text-muted" role="status">
        {{ problem }}
      </p>
      <UButton color="neutral" variant="ghost" @click="open = false">
        {{ $t('Cancelar') }}
      </UButton>
      <UButton
        type="submit"
        form="new-sheet"
        :loading="isSaving"
        :disabled="problem !== null"
      >
        {{ $t('Crear hoja') }}
      </UButton>
    </template>
  </UiDialog>
</template>

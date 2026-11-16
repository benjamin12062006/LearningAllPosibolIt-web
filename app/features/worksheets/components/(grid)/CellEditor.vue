<script setup lang="ts">
import type { WorksheetColumn } from '../../types/worksheets';

const props = defineProps<{ column: WorksheetColumn; error: string }>();
const value = defineModel<string>({ required: true });
const emit = defineEmits<{ commit: []; cancel: [] }>();
const root = useTemplateRef('editor');
const errorId = useId();

const options = computed(() =>
  props.column.type === 'boolean'
    ? [
        { id: 'sí', label: 'Sí' },
        { id: 'no', label: 'No' },
      ]
    : (props.column.options ?? []),
);
const isChoice = computed(() =>
  ['boolean', 'selection'].includes(props.column.type),
);
const inputMode = computed(() => {
  if (props.column.type === 'decimal') return 'decimal';
  if (props.column.type === 'integer') return 'numeric';
  return 'text';
});

onMounted(() =>
  root.value?.querySelector<HTMLElement>('input, select')?.focus(),
);
</script>

<template>
  <form
    ref="editor"
    class="space-y-1 p-1"
    @submit.prevent="emit('commit')"
    @keydown.stop
    @keydown.esc.stop.prevent="emit('cancel')"
  >
    <select
      v-if="isChoice"
      v-model="value"
      class="w-full rounded border border-accented bg-default p-1 text-highlighted"
      :aria-label="column.name"
      :aria-invalid="!!error"
      :aria-describedby="error ? errorId : undefined"
      @change="emit('commit')"
      @keydown.enter.prevent="emit('commit')"
    >
      <option value="">{{ $t('Vacía') }}</option>
      <option v-for="option in options" :key="option.id" :value="option.id">
        {{ option.label }}
      </option>
    </select>
    <input
      v-else
      v-model="value"
      class="w-full rounded border border-accented bg-default p-1 text-highlighted"
      :type="column.type === 'date' ? 'date' : 'text'"
      :inputmode="inputMode"
      :aria-label="column.name"
      :aria-invalid="!!error"
      :aria-describedby="error ? errorId : undefined"
    />
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="whitespace-normal text-xs text-error"
    >
      {{ error }}
    </p>
    <button class="sr-only" type="submit" tabindex="-1">
      {{ $t('Guardar valor') }}
    </button>
  </form>
</template>

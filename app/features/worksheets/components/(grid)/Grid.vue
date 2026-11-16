<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual';
import type { WorksheetColumn } from '../../types/worksheets';
import {
  displayCell,
  editableText,
  isNumericColumn,
  parseCellInput,
} from '../../utils/cell-text';
import type { CellEdit, GridRow } from '../../utils/draft-overlay';
import {
  clamp,
  isTypingKey,
  positionAfterKey,
  type CellPosition,
} from '../../utils/grid-keys';
import {
  describeSkipped,
  parseClipboardTable,
  pasteEdits,
} from '../../utils/paste';

const props = withDefaults(
  defineProps<{
    rows: GridRow[];
    columns: WorksheetColumn[];
    canEdit: boolean;
    operationBudget: number;
    markedColumns?: string[];
    proposedColumns?: string[];
  }>(),
  { markedColumns: () => [], proposedColumns: () => [] },
);
const emit = defineEmits<{
  edit: [edits: CellEdit[]];
  undo: [];
  deleteRow: [rowId: string];
  restoreRow: [rowId: string];
}>();
const selectedRows = defineModel<string[]>('selectedRows', { required: true });
const selectedColumns = defineModel<string[]>('selectedColumns', {
  required: true,
});
const active = ref<CellPosition>({ row: 0, column: 0 });
const editing = ref<CellPosition | null>(null);
const text = ref('');
const error = ref('');
const notice = ref('');
const root = useTemplateRef('grid');
const scroller = useTemplateRef('scroller');
const ROW_HEIGHT = 36;
const STICKY_HEADER_HEIGHT = 32;
const MAX_STATIC_CELLS = 600;
const hasVirtualRows = computed(
  () => props.rows.length * props.columns.length > MAX_STATIC_CELLS,
);
const rowKey = (index: number) => props.rows[index]?.rowId ?? index;
const virtualizer = useVirtualizer(
  computed(() => ({
    count: props.rows.length,
    getScrollElement: () => scroller.value,
    getItemKey: rowKey,
    estimateSize: () => ROW_HEIGHT,
    initialRect: { width: 800, height: 480 },
    overscan: 8,
    scrollPaddingStart: STICKY_HEADER_HEIGHT,
    enabled: hasVirtualRows.value,
  })),
);
const windowRows = computed(() =>
  hasVirtualRows.value ? virtualizer.value.getVirtualItems() : [],
);
const rowsInDom = computed(() => {
  if (!hasVirtualRows.value)
    return props.rows.map((row, index) => ({ row, index }));
  return windowRows.value.flatMap(({ index }) => {
    const row = props.rows[index];
    return row ? [{ row, index }] : [];
  });
});
const paddingTop = computed(() => windowRows.value[0]?.start ?? 0);
const paddingBottom = computed(() =>
  windowRows.value.length
    ? Math.max(
        0,
        virtualizer.value.getTotalSize() - (windowRows.value.at(-1)?.end ?? 0),
      )
    : 0,
);
const activeInDom = computed(
  () =>
    !hasVirtualRows.value ||
    windowRows.value.some((row) => row.index === active.value.row),
);
const columnCount = computed(
  () => props.columns.length + (props.canEdit ? 2 : 1),
);

function measureRow(element: Element | ComponentPublicInstance | null) {
  if (hasVirtualRows.value && element instanceof HTMLElement)
    virtualizer.value.measureElement(element);
}

function enterGrid(event: FocusEvent) {
  if (event.target !== scroller.value || activeInDom.value) return;
  const first = windowRows.value[0];
  if (first) focusCell({ row: first.index, column: active.value.column });
}

const instructionsId = useId();
const size = computed(() => ({
  rows: props.rows.length,
  columns: props.columns.length,
}));

watch(size, (next) => {
  active.value = clamp(active.value, next);
  editing.value = null;
});
watch(
  () => props.canEdit,
  (canEdit) => {
    if (!canEdit) editing.value = null;
  },
);

function isAt(position: CellPosition | null, row: number, column: number) {
  return position?.row === row && position?.column === column;
}

function focusCell(position: CellPosition) {
  active.value = position;
  if (hasVirtualRows.value)
    virtualizer.value.scrollToIndex(position.row, { align: 'auto' });
  const selector = `[data-cell="${position.row}:${position.column}"]`;
  void nextTick(() => {
    const cell = root.value?.querySelector<HTMLElement>(selector);
    if (cell) cell.focus({ preventScroll: hasVirtualRows.value });
    else
      requestAnimationFrame(() =>
        root.value?.querySelector<HTMLElement>(selector)?.focus(),
      );
  });
}

function isWritable(row: GridRow, column: WorksheetColumn) {
  return (
    props.canEdit && row.state !== 'deleted' && column.type !== 'calculated'
  );
}

function beginEdit(position: CellPosition, initial?: string) {
  const row = props.rows[position.row];
  const column = props.columns[position.column];
  if (!row || !column || !isWritable(row, column)) return;
  active.value = position;
  text.value = initial ?? editableText(column, row.values[column.id] ?? null);
  error.value = '';
  editing.value = position;
}

function cancelEdit() {
  const position = editing.value;
  editing.value = null;
  if (position) focusCell(position);
}

function commitEdit() {
  const position = editing.value;
  if (!position) return;
  const row = props.rows[position.row];
  const column = props.columns[position.column];
  if (!row || !column || !isWritable(row, column)) return cancelEdit();
  const parsed = parseCellInput(column, text.value);
  if (!parsed.ok) {
    error.value = parsed.message;
    return;
  }
  emit('edit', [
    { rowId: row.rowId, columnId: column.id, value: parsed.value },
  ]);
  cancelEdit();
}

function onKey(event: KeyboardEvent) {
  if (
    !(event.target instanceof HTMLElement) ||
    !event.target.hasAttribute('data-cell')
  )
    return;
  const hasModifier = event.ctrlKey || event.metaKey;
  if (event.key === ' ' && (event.shiftKey || hasModifier)) {
    event.preventDefault();
    selectAtCursor(event.shiftKey);
    return;
  }
  if (event.key === 'Delete' && event.shiftKey && props.canEdit) {
    event.preventDefault();
    const row = props.rows[active.value.row];
    if (row) toggleRowDeletion(row);
    return;
  }
  const next = positionAfterKey(
    active.value,
    { key: event.key, hasModifier },
    size.value,
  );
  if (next) {
    event.preventDefault();
    focusCell(next);
    return;
  }
  if (hasModifier && event.key.toLowerCase() === 'z' && props.canEdit) {
    event.preventDefault();
    emit('undo');
    return;
  }
  if (event.key === 'Enter' || event.key === 'F2') {
    event.preventDefault();
    beginEdit(active.value);
    return;
  }
  if (isTypingKey(event) && props.canEdit) {
    event.preventDefault();
    beginEdit(active.value, event.key);
  }
}

function onPaste(event: ClipboardEvent) {
  if (editing.value || !props.canEdit || !event.clipboardData) return;
  if (
    !(event.target instanceof HTMLElement) ||
    !event.target.hasAttribute('data-cell')
  )
    return;
  event.preventDefault();
  const result = pasteEdits(
    parseClipboardTable(event.clipboardData.getData('text/plain')),
    {
      start: active.value,
      rows: props.rows,
      columns: props.columns,
      budget: props.operationBudget,
    },
  );
  notice.value = describeSkipped(result) ?? '';
  if (result.edits.length > 0) emit('edit', result.edits);
}

function selectAtCursor(selectRow: boolean) {
  if (selectRow) {
    const row = props.rows[active.value.row];
    if (row && row.state !== 'deleted' && row.state !== 'inserted') {
      selectedRows.value = toggle(selectedRows.value, row.rowId);
    }
    return;
  }
  const column = props.columns[active.value.column];
  if (column) selectedColumns.value = toggle(selectedColumns.value, column.id);
}

function toggleRowDeletion(row: GridRow) {
  if (row.state === 'deleted') emit('restoreRow', row.rowId);
  else emit('deleteRow', row.rowId);
}

function toggle(items: string[], id: string) {
  return items.includes(id)
    ? items.filter((item) => item !== id)
    : [...items, id];
}
</script>

<template>
  <p :id="instructionsId" class="sr-only">
    {{
      $t(
        'Usa flechas para moverte, Intro o F2 para editar y Escape para cerrar la edición. Mayús más Espacio selecciona la fila. Control o Comando más Espacio selecciona la columna. Mayús más Suprimir borra o restaura una fila del borrador.',
      )
    }}
  </p>
  <p v-if="notice" class="p-2 text-sm text-warning" role="status">
    {{ notice }}
  </p>
  <div
    ref="scroller"
    data-grid-scroll
    class="max-h-[65dvh] overflow-auto"
    :tabindex="activeInDom ? -1 : 0"
    @focus="enterGrid"
  >
    <table
      ref="grid"
      role="grid"
      :aria-describedby="instructionsId"
      :aria-readonly="!canEdit"
      :aria-rowcount="rows.length + 1"
      :aria-colcount="columnCount"
      :aria-label="$t('Filas de la hoja')"
      class="w-full border-separate border-spacing-0 text-sm"
      @keydown="onKey"
      @paste="onPaste"
    >
      <thead class="sticky top-0 z-10 bg-muted text-left">
        <tr :aria-rowindex="1">
          <th scope="col" class="border-b border-e border-default px-2 py-1">
            {{ $t('Fila') }}
          </th>
          <th
            v-for="column in columns"
            :key="column.id"
            scope="col"
            :data-ai-anchor="column.id"
            class="min-w-36 border-b border-e border-default px-2 py-1"
            :class="{
              'outline-2 -outline-offset-2 outline-dashed outline-(--app-ai)':
                markedColumns.includes(column.id),
            }"
          >
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                tabindex="-1"
                :checked="selectedColumns.includes(column.id)"
                :aria-label="`Seleccionar columna ${column.name}`"
                @change="selectedColumns = toggle(selectedColumns, column.id)"
              />
              {{ column.name }}
              <UIcon
                v-if="column.type === 'calculated'"
                name="i-lucide-sigma"
                :title="$t('Calculada')"
              />
            </label>
          </th>
          <th
            v-if="canEdit"
            scope="col"
            class="border-b border-default px-2 py-1"
          >
            <span class="sr-only">{{ $t('Acciones') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paddingTop" role="presentation" aria-hidden="true">
          <td :colspan="columnCount" :style="{ height: `${paddingTop}px` }" />
        </tr>
        <tr
          v-for="{ row, index: rowIndex } in rowsInDom"
          :key="row.rowId"
          :ref="measureRow"
          :data-index="rowIndex"
          :aria-rowindex="rowIndex + 2"
          class="hover:bg-elevated/60"
          :aria-selected="selectedRows.includes(row.rowId)"
        >
          <th
            scope="row"
            class="border-b border-e border-default px-2 font-normal text-muted"
          >
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                tabindex="-1"
                :disabled="row.state === 'deleted' || row.state === 'inserted'"
                :checked="selectedRows.includes(row.rowId)"
                :aria-label="`Seleccionar fila ${rowIndex + 1}`"
                @change="selectedRows = toggle(selectedRows, row.rowId)"
              />
              {{ rowIndex + 1 }}
            </label>
          </th>
          <td
            v-for="(column, columnIndex) in columns"
            :key="column.id"
            :data-cell="`${rowIndex}:${columnIndex}`"
            :tabindex="isAt(active, rowIndex, columnIndex) && !editing ? 0 : -1"
            :aria-readonly="!isWritable(row, column)"
            :aria-invalid="row.problemColumnIds.has(column.id)"
            class="h-9 max-w-80 border-b border-e border-default focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            :class="{
              'text-right tabular-nums': isNumericColumn(column),
              'line-through opacity-60': row.state === 'deleted',
              'bg-primary/10': row.editedColumnIds.has(column.id),
              'bg-ai-wash': proposedColumns.includes(column.id),
            }"
            @focus="active = { row: rowIndex, column: columnIndex }"
            @dblclick="beginEdit({ row: rowIndex, column: columnIndex })"
          >
            <WorksheetsCellEditor
              v-if="isAt(editing, rowIndex, columnIndex)"
              v-model="text"
              :column="column"
              :error="error"
              @commit="commitEdit"
              @cancel="cancelEdit"
            />
            <div
              v-else
              class="truncate px-2 py-1"
              :title="displayCell(column, row.values[column.id] ?? null)"
            >
              <UIcon
                v-if="row.problemColumnIds.has(column.id)"
                name="i-lucide-circle-alert"
                class="me-1 text-error"
                :aria-label="$t('Valor con problema')"
              />
              <UIcon
                v-if="proposedColumns.includes(column.id)"
                name="i-lucide-sparkles"
                class="me-1"
                :aria-label="$t('Columna de la propuesta del asistente')"
              />
              {{ displayCell(column, row.values[column.id] ?? null) }}
              <span v-if="row.editedColumnIds.has(column.id)" class="sr-only">{{
                $t('Valor del borrador')
              }}</span>
            </div>
          </td>
          <td v-if="canEdit" class="border-b border-default px-1">
            <UButton
              :icon="
                row.state === 'deleted' ? 'i-lucide-undo-2' : 'i-lucide-trash-2'
              "
              tabindex="-1"
              :aria-label="
                row.state === 'deleted'
                  ? `Restaurar fila ${rowIndex + 1}`
                  : `Borrar fila ${rowIndex + 1}`
              "
              color="neutral"
              variant="ghost"
              size="sm"
              @click="toggleRowDeletion(row)"
            />
          </td>
        </tr>
        <tr v-if="paddingBottom" role="presentation" aria-hidden="true">
          <td
            :colspan="columnCount"
            :style="{ height: `${paddingBottom}px` }"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {
  VIEW_VISIBILITY_LABELS,
  WORKSHEET_LIMITS,
  type RowQuery,
  type SavedView,
  type SortTerm,
  type ViewVisibility,
  type WorksheetColumn,
} from '../../types/worksheets';
import {
  buildFilter,
  conditionsFromFilter,
  isQueryableColumn,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  type FilterCondition,
} from '../../utils/row-filter';

const props = defineProps<{
  query: RowQuery;
  columns: WorksheetColumn[];
  views: SavedView[];
  activeView: SavedView | undefined;
  canShare: boolean;
  busy: boolean;
}>();
const emit = defineEmits<{
  apply: [query: RowQuery];
  select: [id: string];
  save: [
    name: string,
    visibility: ViewVisibility,
    query: RowQuery,
    existing?: SavedView,
  ];
  remove: [view: SavedView];
}>();

const conditions = ref<FilterCondition[]>([]);
const sort = ref<SortTerm[]>([]);
const visible = ref<string[]>([]);
const name = ref('');
const visibility = ref<ViewVisibility>('personal');
const advancedFilter = shallowRef<RowQuery['filter']>();
const queryable = computed(() => props.columns.filter(isQueryableColumn));
const filter = computed(() => buildFilter(conditions.value, props.columns));
const query = computed<RowQuery>(() => ({
  filter: advancedFilter.value ?? filter.value,
  sort: sort.value,
  columns:
    visible.value.length === props.columns.length ? undefined : visible.value,
}));
const invalid = computed(() => {
  const result = filter.value;
  const count = result ? ('and' in result ? result.and.length : 1) : 0;
  const uniqueSort = new Set(sort.value.map((term) => term.columnId));
  const hasColumns = props.columns.length === 0 || visible.value.length > 0;
  return (
    count !== conditions.value.length ||
    !hasColumns ||
    uniqueSort.size !== sort.value.length
  );
});

watch(
  () => [props.query, props.activeView] as const,
  () => {
    const parsed = conditionsFromFilter(props.query.filter);
    conditions.value = parsed ?? [];
    advancedFilter.value = parsed === null ? props.query.filter : undefined;
    sort.value = props.query.sort?.map((entry) => ({ ...entry })) ?? [];
    visible.value =
      props.query.columns ?? props.columns.map((column) => column.id);
    name.value = props.activeView?.name ?? '';
    visibility.value = props.activeView?.visibility ?? 'personal';
  },
  { immediate: true },
);

function operators(columnId: string) {
  const column = props.columns.find((candidate) => candidate.id === columnId);
  return column ? OPERATORS_BY_TYPE[column.type] : [];
}

function addCondition() {
  const column = queryable.value[0];
  if (!column) return;
  const operator = operators(column.id)[0];
  if (operator)
    conditions.value.push({ columnId: column.id, operator, text: '' });
}

function resetCondition(condition: FilterCondition) {
  condition.operator = operators(condition.columnId)[0] ?? 'equals';
  condition.text = '';
}

function addSort() {
  const available = queryable.value.find(
    (column) => !sort.value.some((term) => term.columnId === column.id),
  );
  if (available) sort.value.push({ columnId: available.id, direction: 'asc' });
}
</script>

<template>
  <form
    class="space-y-5 text-sm"
    @submit.prevent="!invalid && emit('apply', query)"
  >
    <UFormField :label="$t('Vista guardada')">
      <select
        class="worksheet-select w-full"
        :value="activeView?.id ?? ''"
        @change="emit('select', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ $t('Vista de la hoja') }}</option>
        <option v-for="view in views" :key="view.id" :value="view.id">
          {{ view.name }} · {{ $t(VIEW_VISIBILITY_LABELS[view.visibility]) }}
        </option>
      </select>
    </UFormField>
    <fieldset class="space-y-2">
      <legend class="font-medium">{{ $t('Filtros simultáneos') }}</legend>
      <div v-if="advancedFilter" class="flex items-center gap-2">
        <p>{{ $t('Esta vista usa un filtro avanzado.') }}</p>
        <UButton
          size="xs"
          type="button"
          variant="ghost"
          @click="advancedFilter = undefined"
          >{{ $t('Quitar filtro') }}</UButton
        >
      </div>
      <div
        v-for="(condition, index) in conditions"
        :key="index"
        class="flex flex-wrap gap-2"
      >
        <select
          v-model="condition.columnId"
          class="worksheet-select"
          :aria-label="$t('Columna del filtro {0}', [index + 1])"
          @change="resetCondition(condition)"
        >
          <option
            v-for="column in queryable"
            :key="column.id"
            :value="column.id"
          >
            {{ column.name }}
          </option>
        </select>
        <select
          v-model="condition.operator"
          class="worksheet-select"
          :aria-label="$t('Operador del filtro {0}', [index + 1])"
        >
          <option
            v-for="op in operators(condition.columnId)"
            :key="op"
            :value="op"
          >
            {{ $t(OPERATOR_LABELS[op]) }}
          </option>
        </select>
        <UInput
          v-if="condition.operator !== 'is_null'"
          v-model="condition.text"
          :aria-label="$t('Valor del filtro {0}', [index + 1])"
        />
        <UButton
          type="button"
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          :aria-label="`Quitar filtro ${index + 1}`"
          @click="conditions.splice(index, 1)"
        />
      </div>
      <UButton
        v-if="!advancedFilter && queryable.length"
        type="button"
        size="sm"
        variant="soft"
        :disabled="conditions.length >= WORKSHEET_LIMITS.filterPredicates"
        @click="addCondition"
        >{{ $t('Añadir filtro') }}</UButton
      >
    </fieldset>

    <fieldset class="space-y-2">
      <legend class="font-medium">{{ $t('Orden') }}</legend>
      <div
        v-for="(term, index) in sort"
        :key="index"
        class="flex flex-wrap gap-2"
      >
        <select
          v-model="term.columnId"
          class="worksheet-select"
          :aria-label="$t('Columna de orden {0}', [index + 1])"
        >
          <option
            v-for="column in queryable"
            :key="column.id"
            :value="column.id"
          >
            {{ column.name }}
          </option>
        </select>
        <select
          v-model="term.direction"
          class="worksheet-select"
          :aria-label="$t('Sentido de orden {0}', [index + 1])"
        >
          <option value="asc">{{ $t('Ascendente') }}</option>
          <option value="desc">{{ $t('Descendente') }}</option>
        </select>
        <UButton
          type="button"
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          :aria-label="`Quitar orden ${index + 1}`"
          @click="sort.splice(index, 1)"
        />
      </div>
      <UButton
        v-if="queryable.length"
        type="button"
        size="sm"
        variant="soft"
        :disabled="
          sort.length >=
          Math.min(WORKSHEET_LIMITS.sortColumns, queryable.length)
        "
        @click="addSort"
        >{{ $t('Añadir orden') }}</UButton
      >
    </fieldset>

    <fieldset v-if="columns.length" class="space-y-2">
      <legend class="font-medium">{{ $t('Columnas visibles') }}</legend>
      <label
        v-for="column in columns"
        :key="column.id"
        class="flex items-center gap-2"
      >
        <input v-model="visible" type="checkbox" :value="column.id" />
        {{ column.name }}
      </label>
    </fieldset>
    <p v-if="invalid" role="status" class="text-warning">
      {{
        $t(
          'Completa los filtros, elige columnas visibles y evita repetir el orden.',
        )
      }}
    </p>
    <UButton type="submit" :disabled="invalid">{{
      $t('Aplicar a la tabla')
    }}</UButton>
    <fieldset class="space-y-3 border-t border-default pt-3">
      <legend class="sr-only">{{ $t('Guardar vista') }}</legend>
      <UFormField :label="$t('Nombre de la vista')">
        <UInput v-model="name" :maxlength="120" class="w-full" />
      </UFormField>
      <UFormField :label="$t('Visibilidad')">
        <select v-model="visibility" class="worksheet-select w-full">
          <option value="personal">{{ $t('Solo para mí') }}</option>
          <option
            v-if="canShare || activeView?.visibility === 'team'"
            value="team"
          >
            {{ $t('Para el equipo') }}
          </option>
        </select>
      </UFormField>
      <div class="flex flex-wrap gap-2">
        <UButton
          type="button"
          variant="soft"
          :disabled="
            invalid || !name.trim() || (visibility === 'team' && !canShare)
          "
          :loading="busy"
          @click="emit('save', name.trim(), visibility, query)"
          >{{ $t('Guardar nueva') }}</UButton
        >
        <UButton
          v-if="activeView?.canEdit"
          type="button"
          variant="soft"
          :disabled="invalid || !name.trim()"
          :loading="busy"
          @click="emit('save', name.trim(), visibility, query, activeView)"
          >{{ $t('Actualizar vista') }}</UButton
        >
        <UButton
          v-if="activeView?.canEdit"
          type="button"
          color="error"
          variant="ghost"
          :disabled="busy"
          @click="emit('remove', activeView)"
          >{{ $t('Eliminar vista') }}</UButton
        >
      </div>
    </fieldset>
  </form>
</template>

<style scoped>
.worksheet-select {
  border: 1px solid var(--ui-border-accented);
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  padding: 0.375rem;
}
</style>

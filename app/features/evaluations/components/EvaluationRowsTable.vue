<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import {
  OUTCOME_LABELS,
  type EvaluationRow,
  type RowOutcome,
} from '../types/evaluations';
import { attributeLabel } from '../../rulesets/types/rulesets';

const { t } = useAppLocale();

/**
 * Filas evaluadas: fila del CSV, producto, resultado y el primer motivo. Las
 * filas con problemas se despliegan para ver todos con su corrección sugerida.
 */
const props = defineProps<{ rows: EvaluationRow[] }>();

const OUTCOME_COLORS: Record<RowOutcome, 'success' | 'error' | 'neutral'> = {
  valid: 'success',
  invalid: 'error',
  excluded: 'neutral',
};

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');

/**
 * Igual que `ExpandedState` de TanStack (no es dependencia directa del
 * proyecto): `true` abre todas, o un objeto con las filas abiertas.
 */
type ExpandedRows = true | Record<string, boolean>;

const expanded = ref<ExpandedRows | undefined>({});

// Otra página u otro filtro: ninguna fila abierta.
watch(
  () => props.rows,
  () => {
    expanded.value = {};
  },
);

const columns: TableColumn<EvaluationRow>[] = [
  {
    id: 'expand',
    cell: ({ row }) => {
      if (row.original.problems.length === 0) return null;
      return h(UButton, {
        icon: 'i-lucide-chevron-right',
        color: 'neutral',
        variant: 'ghost',
        size: 'xs',
        class: row.getIsExpanded() ? 'rotate-90' : '',
        'aria-expanded': row.getIsExpanded(),
        'aria-label': t('Ver los problemas de la fila {0}', [
          row.original.sourceRow,
        ]),
        onClick: () => row.toggleExpanded(),
      });
    },
  },
  { accessorKey: 'sourceRow', header: t('Fila') },
  {
    accessorKey: 'externalId',
    header: 'Producto',
    cell: ({ row }) =>
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'truncate text-default' }, row.original.externalId),
        h('p', { class: 'truncate text-xs text-muted' }, titleOf(row.original)),
      ]),
  },
  {
    accessorKey: 'outcome',
    header: 'Resultado',
    cell: ({ row }) =>
      h(
        UBadge,
        { color: OUTCOME_COLORS[row.original.outcome], variant: 'subtle' },
        () => t(OUTCOME_LABELS[row.original.outcome]),
      ),
  },
  {
    id: 'reason',
    header: 'Motivo',
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-toned' }, reasonOf(row.original)),
  },
];

function titleOf(row: EvaluationRow) {
  return row.values?.title ?? '';
}

/** El primer problema y cuántos más hay; al desplegar se ven todos. */
function reasonOf(row: EvaluationRow) {
  if (row.outcome === 'excluded') {
    return row.excludedByRule
      ? t('Excluida por la regla {0}', [row.excludedByRule])
      : t('Excluida');
  }
  const [first, ...rest] = row.problems;
  if (!first) return '—';
  if (rest.length === 0) return first.problem.es;
  return t('{0} (y {1} más)', [first.problem.es, rest.length]);
}
</script>

<template>
  <UTable v-model:expanded="expanded" :data="rows" :columns="columns">
    <template #expanded="{ row }">
      <ul class="space-y-2 py-1 ps-10">
        <li
          v-for="(problem, index) in row.original.problems"
          :key="index"
          class="text-sm"
        >
          <span class="font-medium text-highlighted">{{
            attributeLabel(problem.attribute)
          }}</span>
          · {{ problem.problem.es }}
          <p class="text-muted">{{ problem.suggestion.es }}</p>
        </li>
      </ul>
    </template>
  </UTable>
</template>

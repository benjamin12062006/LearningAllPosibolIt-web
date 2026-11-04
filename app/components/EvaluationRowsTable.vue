<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import {
  OUTCOME_LABELS,
  type EvaluationRow,
  type RowOutcome,
} from '../types/evaluations';

/** Filas evaluadas: fila del CSV, producto, resultado y el primer motivo. */
defineProps<{ rows: EvaluationRow[] }>();

const OUTCOME_COLORS: Record<RowOutcome, 'success' | 'error' | 'neutral'> = {
  valid: 'success',
  invalid: 'error',
  excluded: 'neutral',
};

const UBadge = resolveComponent('UBadge');

const columns: TableColumn<EvaluationRow>[] = [
  { accessorKey: 'sourceRow', header: 'Fila' },
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
        () => OUTCOME_LABELS[row.original.outcome],
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

/** El primer problema y cuántos más hay; en el informe completo se verán todos. */
function reasonOf(row: EvaluationRow) {
  if (row.outcome === 'excluded') {
    return row.excludedByRule
      ? `Excluida por la regla ${row.excludedByRule}`
      : 'Excluida';
  }
  const [first, ...rest] = row.problems;
  if (!first) return '—';
  if (rest.length === 0) return first.problem.es;
  return `${first.problem.es} (y ${rest.length} más)`;
}
</script>

<template>
  <UTable :data="rows" :columns="columns" />
</template>

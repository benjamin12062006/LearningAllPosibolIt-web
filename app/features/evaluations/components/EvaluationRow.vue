<!-- Una evaluación del historial como fila Focus: estado, revisión, fecha y conteos. -->
<script setup lang="ts">
import {
  EVALUATION_STATUS_LABELS,
  isActiveEvaluation,
  type Evaluation,
} from '../types/evaluations';

const { t, formatDateTime } = useAppLocale();

const props = defineProps<{ evaluation: Evaluation; to: string }>();

const icon = computed(() => {
  if (isActiveEvaluation(props.evaluation)) return 'i-lucide-loader-circle';
  if (props.evaluation.status === 'failed') return 'i-lucide-circle-x';
  return 'i-lucide-circle-check';
});

const iconClass = computed(() => {
  if (isActiveEvaluation(props.evaluation)) return 'text-info';
  if (props.evaluation.status === 'failed') return 'text-error';
  return 'text-primary';
});

/** Conteos si terminó; si no, su estado. */
const detail = computed(() => {
  const { counts, status, createdAt } = props.evaluation;
  const when = formatDateTime(createdAt);
  if (!counts) return `${t(EVALUATION_STATUS_LABELS[status])} · ${when}`;
  return t('{0} válidos · {1} inválidos · {2} excluidos · {3}', [
    counts.valid,
    counts.invalid,
    counts.excluded,
    when,
  ]);
});
</script>

<template>
  <NuxtLink
    :to="to"
    class="focus-row group -mx-2 rounded-md px-2 transition-colors hover:bg-elevated/40"
  >
    <UIcon :name="icon" class="size-5 shrink-0" :class="iconClass" />
    <span class="min-w-0 flex-1">
      <span class="block text-sm text-default">
        {{ $t('Revisión') }} {{ evaluation.rulesetRevision }}
      </span>
      <span class="block truncate text-xs text-muted">{{ detail }}</span>
    </span>
    <span class="sr-only">{{
      $t(EVALUATION_STATUS_LABELS[evaluation.status])
    }}</span>
    <UIcon
      name="i-lucide-chevron-right"
      class="size-4 text-dimmed opacity-0 transition-opacity group-hover:opacity-100"
    />
  </NuxtLink>
</template>

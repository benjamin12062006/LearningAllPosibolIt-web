<script setup lang="ts">
import { OUTCOME_LABELS } from '../../evaluations/types/evaluations';
import type { ProblemGroup, RulesPreview } from '../types/feed-viewer';
import { attributeLabel } from '../../rulesets/types/rulesets';

const { language } = useAppLocale();

/**
 * Qué cambiaría con unas reglas que todavía no se guardaron (V5): problemas
 * que aparecen, se resuelven o siguen, y los productos a los que les cambia
 * algo. Es solo lectura: probar no guarda nada.
 */
const props = defineProps<{ preview: RulesPreview }>();

const emit = defineEmits<{ page: [offset: number] }>();

const PROBLEM_SECTIONS = [
  {
    key: 'appeared',
    title: 'Problemas nuevos',
    icon: 'i-lucide-circle-alert',
    iconClass: 'text-error',
  },
  {
    key: 'resolved',
    title: 'Problemas resueltos',
    icon: 'i-lucide-circle-check',
    iconClass: 'text-success',
  },
  {
    key: 'persisting',
    title: 'Problemas que siguen',
    icon: 'i-lucide-circle-dot',
    iconClass: 'text-muted',
  },
] as const;

const sections = computed(() =>
  PROBLEM_SECTIONS.map((section) => ({
    ...section,
    groups: props.preview.problems[section.key],
  })).filter((section) => section.groups.length > 0),
);

const hasNoChanges = computed(
  () => props.preview.changedProducts === 0 && sections.value.length === 0,
);

function describeGroup(group: ProblemGroup) {
  return `${attributeLabel(group.attribute)}: ${group.problem.es}`;
}

function nextOffset(direction: 1 | -1) {
  const { offset, limit } = props.preview.page;
  return Math.max(0, offset + direction * limit);
}
</script>

<template>
  <section
    aria-labelledby="vista-previa-reglas"
    class="rounded-lg p-5 ring-1 ring-default"
  >
    <h2 id="vista-previa-reglas" class="text-lg font-medium text-highlighted">
      {{ $t('Prueba de las reglas') }}
    </h2>
    <p class="mt-1 text-sm text-muted">
      {{ $t('Comparado con la revisión') }} {{ preview.baseRevision
      }}{{ $t('. Nada de esto se ha guardado.') }}
    </p>

    <dl class="mt-4 grid grid-cols-3 gap-3 text-sm">
      <div
        v-for="outcome in ['valid', 'invalid', 'excluded'] as const"
        :key="outcome"
        class="rounded-md bg-muted px-3 py-2"
      >
        <dt class="text-xs text-muted">
          {{ $t(OUTCOME_LABELS[outcome] + 's') }}
        </dt>
        <dd class="tabular-nums">
          {{ preview.counts.current[outcome].toLocaleString(language) }}
          <UIcon
            name="i-lucide-arrow-right"
            class="mx-1 inline size-3.5 align-middle text-dimmed"
            :aria-label="$t('pasa a')"
          />
          <strong class="font-semibold text-highlighted">
            {{ preview.counts.proposed[outcome].toLocaleString(language) }}
          </strong>
        </dd>
      </div>
    </dl>

    <p v-if="hasNoChanges" class="mt-4 text-sm text-toned">
      {{ $t('Estas reglas dan el mismo resultado que las guardadas.') }}
    </p>

    <div v-for="section in sections" :key="section.key" class="mt-5">
      <h3 class="flex items-center gap-2 text-sm font-medium text-toned">
        <UIcon :name="section.icon" class="size-4" :class="section.iconClass" />
        {{ section.title }}
      </h3>
      <ul class="mt-1 divide-y divide-default">
        <li
          v-for="group in section.groups"
          :key="`${group.attribute}:${group.code}`"
          class="flex items-baseline justify-between gap-3 py-1.5 text-sm"
        >
          <span>{{ describeGroup(group) }}</span>
          <span class="shrink-0 text-xs text-muted tabular-nums">
            {{ group.productCount.toLocaleString(language) }}
            {{ $t('productos') }}
          </span>
        </li>
      </ul>
    </div>

    <div v-if="preview.products.length > 0" class="mt-5">
      <h3 class="text-sm font-medium text-toned">
        {{ $t('Productos que cambian (')
        }}{{ preview.changedProducts.toLocaleString(language) }})
      </h3>
      <ul class="mt-1 divide-y divide-default">
        <li
          v-for="product in preview.products"
          :key="product.sourceRow"
          class="py-2.5"
        >
          <p class="flex flex-wrap items-center gap-2 text-sm">
            <span class="font-mono text-xs select-text">
              {{ product.externalId }}
            </span>
            <span
              v-if="product.current.outcome !== product.proposed.outcome"
              class="text-toned"
            >
              {{ $t(OUTCOME_LABELS[product.current.outcome]) }}
              <UIcon
                name="i-lucide-arrow-right"
                class="mx-0.5 inline size-3.5 align-middle text-dimmed"
                :aria-label="$t('pasa a')"
              />
              {{ $t(OUTCOME_LABELS[product.proposed.outcome]) }}
            </span>
          </p>
          <FeedViewerValueChange
            v-for="value in product.values"
            :key="value.attribute"
            :label="attributeLabel(value.attribute)"
            :before="value.before"
            :after="value.after"
          />
        </li>
      </ul>
      <div
        v-if="preview.page.offset > 0 || preview.page.hasMore"
        class="mt-2 flex gap-2"
      >
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-chevron-left"
          :disabled="preview.page.offset === 0"
          @click="emit('page', nextOffset(-1))"
        >
          {{ $t('Anteriores') }}
        </UButton>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-chevron-right"
          :disabled="!preview.page.hasMore"
          @click="emit('page', nextOffset(1))"
        >
          {{ $t('Siguientes') }}
        </UButton>
      </div>
    </div>
  </section>
</template>

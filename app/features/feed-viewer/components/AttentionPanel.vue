<script setup lang="ts">
import type { AttentionGroupRef } from '../services/feed-viewer';
import type { ExclusionGroup, ProblemGroup } from '../types/feed-viewer';
import { attributeLabel, isRule } from '../../rulesets/types/rulesets';
import { describeRule } from '../../rulesets/utils/describe-rule';

const { language, t } = useAppLocale();

/**
 * «Requiere atención» (V3): qué arreglar antes de publicar, agrupado por
 * problema. Las exclusiones van aparte: no son errores, son decisiones de las
 * reglas. Un producto con dos problemas está en dos grupos y cuenta una vez.
 */
const props = defineProps<{ projectId: string; evaluationId: string }>();

const { $feedViewer } = useNuxtApp();

const {
  data: attention,
  status,
  error,
  refresh,
} = useAsyncData(
  () => `attention:${props.evaluationId}`,
  () => $feedViewer.attention(props.projectId, props.evaluationId),
  { server: false },
);

interface GroupItem {
  value: string;
  ref: AttentionGroupRef;
  title: string;
  detail: string;
  productCount: number;
}

const problemItems = computed<GroupItem[]>(() =>
  (attention.value?.problemGroups ?? []).map(toProblemItem),
);
const exclusionItems = computed<GroupItem[]>(() =>
  (attention.value?.exclusionGroups ?? []).map(toExclusionItem),
);
const hasNothing = computed(
  () => problemItems.value.length === 0 && exclusionItems.value.length === 0,
);

function toProblemItem(group: ProblemGroup): GroupItem {
  return {
    value: `problema:${group.attribute}:${group.code}`,
    ref: { kind: 'problem', attribute: group.attribute, code: group.code },
    title: `${attributeLabel(group.attribute)}: ${group.problem.es}`,
    detail: group.suggestion.es,
    productCount: group.productCount,
  };
}

function toExclusionItem(group: ExclusionGroup): GroupItem {
  return {
    value: `regla:${group.rulePosition}`,
    ref: { kind: 'exclusion', rulePosition: group.rulePosition },
    title: `Regla ${group.rulePosition}`,
    detail: isRule(group.rule)
      ? describeRule(group.rule, t, language.value)
      : '',
    productCount: group.productCount,
  };
}
</script>

<template>
  <section aria-labelledby="requiere-atencion">
    <h2 id="requiere-atencion" class="text-lg font-medium text-highlighted">
      {{ $t('Requiere atención') }}
    </h2>

    <div v-if="status === 'pending' && !attention" class="mt-3 space-y-3">
      <USkeleton v-for="row in 3" :key="row" class="h-11 w-full" />
    </div>

    <FeedViewerFailure
      v-else-if="error"
      class="mt-3"
      :project-id="projectId"
      :failure="error"
      @retry="refresh()"
    />

    <template v-else-if="attention">
      <p v-if="hasNothing" class="mt-2 flex items-center gap-2 text-sm">
        <UIcon name="i-lucide-circle-check" class="size-4 text-success" />
        {{ $t('Nada que arreglar: todos los productos son válidos.') }}
      </p>

      <template v-if="problemItems.length > 0">
        <p class="mt-2 text-sm text-muted">
          {{ attention.affectedProducts.toLocaleString(language) }}
          {{
            $t(
              'productos con algún problema. Uno con dos problemas aparece en dos grupos.',
            )
          }}
        </p>
        <UiAccordion :items="problemItems" class="mt-2">
          <template #header="{ item }">
            <span class="flex items-center gap-2 text-sm">
              <UIcon
                name="i-lucide-circle-alert"
                class="size-4 shrink-0 text-error"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-default">{{ item.title }}</span>
                <span class="block text-xs text-muted">{{ item.detail }}</span>
              </span>
              <span class="shrink-0 text-xs text-toned tabular-nums">
                {{ item.productCount.toLocaleString(language) }}
                {{ $t('productos') }}
              </span>
            </span>
          </template>
          <template #default="{ item }">
            <FeedViewerAttentionRows
              :project-id="projectId"
              :evaluation-id="evaluationId"
              :group="item.ref"
              :group-key="item.value"
            />
          </template>
        </UiAccordion>
      </template>

      <template v-if="exclusionItems.length > 0">
        <h3 class="mt-6 text-sm font-medium text-toned">
          {{ $t('Excluidos por las reglas') }}
        </h3>
        <p class="mt-1 text-sm text-muted">
          {{ attention.excludedProducts.toLocaleString(language) }}
          {{
            $t(
              'productos que las reglas dejan fuera a propósito. No son errores.',
            )
          }}
        </p>
        <UiAccordion :items="exclusionItems" class="mt-2">
          <template #header="{ item }">
            <span class="flex items-center gap-2 text-sm">
              <UIcon
                name="i-lucide-filter-x"
                class="size-4 shrink-0 text-muted"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-default">{{ item.title }}</span>
                <span class="block text-xs text-muted">{{ item.detail }}</span>
              </span>
              <span class="shrink-0 text-xs text-toned tabular-nums">
                {{ item.productCount.toLocaleString(language) }}
                {{ $t('productos') }}
              </span>
            </span>
          </template>
          <template #default="{ item }">
            <FeedViewerAttentionRows
              :project-id="projectId"
              :evaluation-id="evaluationId"
              :group="item.ref"
              :group-key="item.value"
            />
          </template>
        </UiAccordion>
      </template>
    </template>
  </section>
</template>

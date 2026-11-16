<script setup lang="ts">
import { useRuleset } from '../../../../features/rulesets/composables/useRulesets';
import {
  RULE_TYPE_ICONS,
  describeRule,
} from '~/features/rulesets/utils/describe-rule';
import {
  ATTRIBUTE_LABELS,
  PRODUCT_ATTRIBUTES,
  isRequiredAttribute,
  type ProductAttribute,
} from '../../../../features/rulesets/types/rulesets';

const { formatDate, language, t } = useAppLocale();

definePageMeta({ layout: 'workspace' });

const route = useRoute();
const projectId = computed(() => String(route.params.id));
// Si no es un número, la API responde 404 RULESET_NOT_FOUND y se muestra su mensaje.
const revision = computed(() => Number(route.params.revision));

const { ruleset, status, error, refresh } = useRuleset(projectId, revision);

const title = computed(() => t('Revisión {0}', [route.params.revision]));
const isEvaluateOpen = ref(false);

/** Todos los datos de Google en el mismo orden, mapeados o no. */
const mappingRows = computed(() =>
  PRODUCT_ATTRIBUTES.map((attribute) => ({
    attribute,
    label: t(ATTRIBUTE_LABELS[attribute]),
    column: columnFor(attribute),
    required: isRequiredAttribute(attribute),
  })),
);

function columnFor(attribute: ProductAttribute) {
  const mapping = ruleset.value?.mapping.find(
    (pair) => pair.attribute === attribute,
  );
  return mapping?.column ?? null;
}
</script>

<template>
  <WorkspacePage id="revision" :title="title" compact-cover>
    <template #title-actions>
      <div v-if="ruleset" class="flex flex-wrap gap-2">
        <UButton
          :to="`/projects/${projectId}/rules/new?base=${ruleset.revision}`"
          icon="i-lucide-copy-plus"
          color="neutral"
          variant="soft"
        >
          {{ $t('Usar como base') }}
        </UButton>
        <UButton icon="i-lucide-play" @click="isEvaluateOpen = true">
          {{ $t('Evaluar con esta revisión') }}
        </UButton>
      </div>
      <EvaluateDialog
        v-if="ruleset"
        v-model:open="isEvaluateOpen"
        :project-id="projectId"
        :default-revision="ruleset.revision"
      />
    </template>

    <template #subtitle>
      <p v-if="ruleset" class="mt-1 text-sm text-muted">
        {{ $t('Guardada el') }} {{ formatDate(ruleset.createdAt)
        }}{{
          $t('. No se modifica: para cambiarla se crea la revisión siguiente.')
        }}
      </p>
    </template>

    <ProjectNav :project-id="projectId" class="mb-6" />

    <div v-if="status === 'pending' && !ruleset" class="space-y-3">
      <USkeleton v-for="row in 5" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-file-x"
      :title="error.message"
      :actions="[
        { label: 'Reintentar', onClick: () => refresh() },
        {
          label: 'Ver todas las revisiones',
          to: `/projects/${projectId}/rules`,
          variant: 'ghost',
        },
      ]"
    />

    <template v-else-if="ruleset">
      <section aria-labelledby="mapeo">
        <h2 id="mapeo" class="text-lg font-medium text-highlighted">
          {{ $t('Mapeo') }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{ $t('Qué columna del CSV da cada dato de Google.') }}
        </p>
        <dl class="mt-3">
          <div
            v-for="row in mappingRows"
            :key="row.attribute"
            class="focus-row justify-between"
          >
            <dt class="flex items-center gap-2 text-sm">
              {{ row.label }}
              <UBadge
                v-if="row.required"
                color="neutral"
                variant="outline"
                size="sm"
              >
                {{ $t('Obligatorio') }}
              </UBadge>
            </dt>
            <dd class="text-sm">
              <code v-if="row.column" class="text-highlighted">{{
                row.column
              }}</code>
              <span v-else class="text-dimmed">{{ $t('Sin mapear') }}</span>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="reglas" class="mt-10">
        <h2 id="reglas" class="text-lg font-medium text-highlighted">
          {{ $t('Reglas') }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{ $t('Se aplican en este orden.') }}
        </p>
        <p v-if="ruleset.rules.length === 0" class="mt-3 text-sm text-dimmed">
          {{ $t('Sin reglas: los datos se usan tal como vienen del CSV.') }}
        </p>
        <ol v-else class="mt-3">
          <li
            v-for="(rule, index) in ruleset.rules"
            :key="index"
            class="focus-row"
          >
            <span class="w-5 text-sm text-dimmed tabular-nums">{{
              index + 1
            }}</span>
            <UIcon
              :name="RULE_TYPE_ICONS[rule.type]"
              class="size-4 shrink-0 text-primary"
            />
            <span class="min-w-0 flex-1 text-sm break-words">{{
              describeRule(rule, t, language)
            }}</span>
          </li>
        </ol>
      </section>
    </template>
  </WorkspacePage>
</template>

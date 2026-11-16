<script setup lang="ts">
import { RULE_TYPE_ICONS, RULE_TYPE_LABELS } from '../utils/describe-rule';
import {
  ATTRIBUTE_LABELS,
  CLEANABLE_ATTRIBUTES,
  EXCLUDE_OPERATORS,
  OPERATOR_LABELS,
  PRODUCT_ATTRIBUTES,
  type Rule,
} from '../types/rulesets';

const { t } = useAppLocale();

/**
 * Una regla dentro del formulario de revisión. Edita la regla del borrador
 * (v-model) y avisa al formulario para moverla o quitarla.
 */
const rule = defineModel<Rule>({ required: true });

const props = defineProps<{
  index: number;
  isFirst: boolean;
  isLast: boolean;
}>();

const emit = defineEmits<{ moveUp: []; moveDown: []; remove: [] }>();

const cleanableItems = CLEANABLE_ATTRIBUTES.map((attribute) => ({
  value: attribute,
  label: t(ATTRIBUTE_LABELS[attribute]),
}));

const conditionItems = (['id', ...PRODUCT_ATTRIBUTES] as const).map(
  (attribute) => ({ value: attribute, label: t(ATTRIBUTE_LABELS[attribute]) }),
);

const operatorItems = EXCLUDE_OPERATORS.map((operator) => ({
  value: operator,
  label: t(OPERATOR_LABELS[operator]),
}));

const placeholders = PRODUCT_ATTRIBUTES.map(
  (attribute) => `{${attribute}}`,
).join(' ');

/** Nombres de campo que entiende UForm: `rules.2.template`, etc. */
function fieldName(field?: string) {
  const base = `rules.${props.index}`;
  return field ? `${base}.${field}` : base;
}
</script>

<template>
  <div class="rounded-lg bg-elevated/40 p-4 ring-1 ring-default">
    <div class="flex items-center gap-2">
      <span class="w-5 text-sm text-dimmed tabular-nums">{{ index + 1 }}</span>
      <UIcon :name="RULE_TYPE_ICONS[rule.type]" class="size-4 text-primary" />
      <span class="flex-1 text-sm font-medium text-highlighted">{{
        $t(RULE_TYPE_LABELS[rule.type])
      }}</span>
      <UButton
        icon="i-lucide-arrow-up"
        color="neutral"
        variant="ghost"
        size="xs"
        :disabled="isFirst"
        :aria-label="`Subir la regla ${index + 1}`"
        @click="emit('moveUp')"
      />
      <UButton
        icon="i-lucide-arrow-down"
        color="neutral"
        variant="ghost"
        size="xs"
        :disabled="isLast"
        :aria-label="`Bajar la regla ${index + 1}`"
        @click="emit('moveDown')"
      />
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-label="`Quitar la regla ${index + 1}`"
        @click="emit('remove')"
      />
    </div>

    <!-- Errores de la API que señalan la regla entera (por ejemplo, un atributo no disponible). -->
    <UFormField :name="fieldName()" class="mt-1" />

    <div class="mt-3">
      <UFormField
        v-if="rule.type === 'clean_text'"
        :name="fieldName('attributes')"
        :label="$t('Datos a limpiar')"
        :description="
          $t('Junta espacios y saltos de línea seguidos en uno solo.')
        "
      >
        <UCheckboxGroup
          v-model="rule.attributes"
          :items="cleanableItems"
          orientation="horizontal"
          class="mt-1"
        />
      </UFormField>

      <UFormField
        v-else-if="rule.type === 'build_title'"
        :name="fieldName('template')"
        :label="$t('Cómo se forma el título')"
        :description="
          $t('Escribe {dato} para insertar un dato mapeado: {0}', [
            placeholders,
          ])
        "
      >
        <UInput v-model="rule.template" class="w-full" />
      </UFormField>

      <div v-else class="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
        <UFormField :name="fieldName('attribute')" :label="$t('Excluir si')">
          <USelect
            v-model="rule.attribute"
            :items="conditionItems"
            class="w-full"
          />
        </UFormField>
        <UFormField :name="fieldName('operator')" :label="$t('Condición')">
          <USelect
            v-model="rule.operator"
            :items="operatorItems"
            class="w-full"
          />
        </UFormField>
        <UFormField :name="fieldName('value')" :label="$t('Valor')">
          <UInput
            v-model="rule.value"
            :disabled="rule.operator === 'is_empty'"
            :placeholder="
              rule.operator === 'is_empty' ? $t('No hace falta') : ''
            "
            class="w-full"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>

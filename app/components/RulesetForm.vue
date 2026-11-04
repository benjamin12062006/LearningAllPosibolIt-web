<script setup lang="ts">
import type { DropdownMenuItem, Form, FormSubmitEvent } from '@nuxt/ui';
import { ApiFailure, type FieldIssue } from '../services/api-client';
import type { CatalogImport } from '../types/imports';
import {
  ATTRIBUTE_LABELS,
  PRODUCT_ATTRIBUTES,
  isRequiredAttribute,
  type AttributeMapping,
  type ProductAttribute,
  type RulesetVersion,
} from '../types/rulesets';
import {
  RULESET_LIMITS,
  draftFromRuleset,
  inputFromDraft,
  issueLocation,
  newRule,
  rulesetDraftSchema,
  type RulesetDraft,
} from '../utils/ruleset-draft';

/**
 * Crea la revisión siguiente a partir de otra (o de cero). Las columnas salen
 * de una importación lista; la API valida la coherencia al guardar.
 */
const props = defineProps<{
  projectId: string;
  base: RulesetVersion | null;
  readyImports: CatalogImport[];
}>();

const { $rulesets } = useNuxtApp();
const { refresh: refreshRulesets } = useRulesets(() => props.projectId);
const toast = useToast();

const form = useTemplateRef<Form<typeof rulesetDraftSchema>>('form');
const state = reactive<RulesetDraft>(draftFromRuleset(props.base));
const generalError = ref<string | null>(null);

// La importación más reciente que esté lista: la lista llega ordenada por fecha.
const sourceId = ref<string | undefined>(props.readyImports[0]?.id);
const { headers, status: headersStatus } = useImportSnapshot(
  () => props.projectId,
  () => sourceId.value ?? null,
);

const sourceItems = computed(() =>
  props.readyImports.map((item) => ({
    value: item.id,
    label: `${item.originalName} · ${formatDate(item.createdAt)}`,
  })),
);

const isAtRuleLimit = computed(
  () => state.rules.length >= RULESET_LIMITS.rules,
);

const addRuleItems = computed<DropdownMenuItem[]>(() =>
  (['clean_text', 'build_title', 'exclude_when'] as const).map((type) => ({
    label: RULE_TYPE_LABELS[type],
    icon: RULE_TYPE_ICONS[type],
    onSelect: () => state.rules.push(newRule(type)),
  })),
);

/** Cabeceras del CSV y, aparte, columnas de la revisión base que este CSV no tiene. */
function columnItems(attribute: ProductAttribute) {
  const items = headers.value.map((header) => ({
    value: header,
    label: header,
  }));
  const current = state.mapping[attribute];
  if (current !== '' && !headers.value.includes(current)) {
    items.push({ value: current, label: `${current} (no está en este CSV)` });
  }
  return items;
}

function moveRule(from: number, to: number) {
  const [rule] = state.rules.splice(from, 1);
  if (rule) state.rules.splice(to, 0, rule);
}

async function onSubmit(event: FormSubmitEvent<RulesetDraft>) {
  generalError.value = null;
  const input = inputFromDraft(event.data);
  try {
    const saved = await $rulesets.create(props.projectId, input);
    await refreshRulesets();
    toast.add({
      title: `Revisión ${saved.revision} guardada`,
      color: 'success',
      icon: 'i-lucide-check',
    });
    await navigateTo(`/projects/${props.projectId}/rules/${saved.revision}`);
  } catch (error) {
    showSaveError(error, input.mapping);
  }
}

function showSaveError(error: unknown, sentMapping: AttributeMapping[]) {
  const failure =
    error instanceof ApiFailure
      ? error
      : new ApiFailure(0, 'No pudimos guardar la revisión.');

  const { located, general } = locateIssues(failure.issues, sentMapping);
  form.value?.setErrors(located);
  generalError.value = general.length > 0 ? general.join(' ') : failure.message;
}

/** Cada error de la API va a su fila; los que no tienen fila se muestran arriba. */
function locateIssues(issues: FieldIssue[], sentMapping: AttributeMapping[]) {
  const located: { name: string; message: string }[] = [];
  const general: string[] = [];
  for (const issue of issues) {
    const name = issueLocation(issue.field, sentMapping);
    if (name) located.push({ name, message: issue.message });
    else general.push(issue.message);
  }
  return { located, general };
}
</script>

<template>
  <UForm
    ref="form"
    :schema="rulesetDraftSchema"
    :state="state"
    class="space-y-10"
    @submit="onSubmit"
  >
    <UAlert
      v-if="generalError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="No se guardó la revisión"
      :description="generalError"
    />

    <section aria-labelledby="columnas">
      <h2 id="columnas" class="text-lg font-medium text-highlighted">
        Columnas del CSV
      </h2>
      <p class="mt-1 text-sm text-muted">
        Se leen de una importación lista. Al evaluar se puede usar otra con las
        mismas columnas.
      </p>
      <USelect
        v-model="sourceId"
        :items="sourceItems"
        :loading="headersStatus === 'pending'"
        class="mt-3 w-full sm:max-w-md"
        aria-label="Importación de la que leer las columnas"
      />
    </section>

    <section aria-labelledby="mapeo">
      <h2 id="mapeo" class="text-lg font-medium text-highlighted">Mapeo</h2>
      <p class="mt-1 text-sm text-muted">
        Qué columna da cada dato de Google. Los obligatorios deben estar
        mapeados o producirlos una regla.
      </p>
      <UFormField name="mapping" class="mt-2" />
      <div class="mt-2">
        <UFormField
          v-for="attribute in PRODUCT_ATTRIBUTES"
          :key="attribute"
          :name="`mapping.${attribute}`"
          class="border-b border-default py-2.5"
        >
          <div class="flex items-center gap-3">
            <span class="flex w-44 shrink-0 items-center gap-2 text-sm">
              {{ ATTRIBUTE_LABELS[attribute] }}
              <UBadge
                v-if="isRequiredAttribute(attribute)"
                color="neutral"
                variant="outline"
                size="sm"
              >
                Obligatorio
              </UBadge>
            </span>
            <USelect
              v-model="state.mapping[attribute]"
              :items="columnItems(attribute)"
              placeholder="Sin mapear"
              class="min-w-0 flex-1"
              :aria-label="`Columna para ${ATTRIBUTE_LABELS[attribute]}`"
            />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              :class="{ invisible: state.mapping[attribute] === '' }"
              :aria-label="`Quitar la columna de ${ATTRIBUTE_LABELS[attribute]}`"
              @click="state.mapping[attribute] = ''"
            />
          </div>
        </UFormField>
      </div>
    </section>

    <section aria-labelledby="reglas">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reglas" class="text-lg font-medium text-highlighted">
            Reglas
          </h2>
          <p class="mt-1 text-sm text-muted">
            Se aplican en orden, de arriba abajo. Máximo
            {{ RULESET_LIMITS.rules }}.
          </p>
        </div>
        <UDropdownMenu :items="addRuleItems">
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="soft"
            :disabled="isAtRuleLimit"
          >
            Añadir regla
          </UButton>
        </UDropdownMenu>
      </div>

      <UFormField name="rules" class="mt-2" />

      <p v-if="state.rules.length === 0" class="mt-3 text-sm text-dimmed">
        Sin reglas: los datos se usan tal como vienen del CSV.
      </p>
      <ol v-else class="mt-3 space-y-3">
        <!-- La tarjeta no guarda estado propio: basta el índice como clave. -->
        <li v-for="(rule, index) in state.rules" :key="index">
          <RuleCard
            :model-value="rule"
            :index="index"
            :is-first="index === 0"
            :is-last="index === state.rules.length - 1"
            @move-up="moveRule(index, index - 1)"
            @move-down="moveRule(index, index + 1)"
            @remove="state.rules.splice(index, 1)"
            @update:model-value="(value) => (state.rules[index] = value)"
          />
        </li>
      </ol>
    </section>

    <div class="flex flex-wrap gap-2">
      <UButton type="submit" icon="i-lucide-save">Guardar revisión</UButton>
      <UButton
        color="neutral"
        variant="ghost"
        :to="`/projects/${projectId}/rules`"
      >
        Cancelar
      </UButton>
    </div>
  </UForm>
</template>

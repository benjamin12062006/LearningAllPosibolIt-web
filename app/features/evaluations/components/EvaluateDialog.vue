<script setup lang="ts">
import { useProjectImports } from '../../catalog/composables/useProjectImports';
import { useRulesets } from '../../rulesets/composables/useRulesets';
import { ApiFailure } from '../../../services/api-client';

const { t, formatDate } = useAppLocale();

/**
 * Diálogo para evaluar una importación lista con una revisión. Es propio de
 * esta funcionalidad (como el modal de reseñas del curso): carga sus datos y,
 * al aceptar, abre la página de la evaluación.
 */
const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{ projectId: string; defaultRevision?: number }>();

const { $evaluations } = useNuxtApp();
const { imports, status: importsStatus } = useProjectImports(
  () => props.projectId,
);
const { rulesets, status: rulesetsStatus } = useRulesets(() => props.projectId);
const toast = useToast();

const snapshotId = ref<string | undefined>();
const revision = ref<number | undefined>();
const isSubmitting = ref(false);
const failure = ref<string | null>(null);

const importItems = computed(() =>
  imports.value
    .filter((item) => item.status === 'ready')
    .map((item) => ({
      value: item.id,
      label: `${item.originalName} · ${formatDate(item.createdAt)}`,
    })),
);

const revisionItems = computed(() =>
  rulesets.value.map((ruleset) => ({
    value: ruleset.revision,
    label: t('Revisión {0} · {1}', [
      ruleset.revision,
      formatDate(ruleset.createdAt),
    ]),
  })),
);

const isLoading = computed(
  () => importsStatus.value === 'pending' || rulesetsStatus.value === 'pending',
);
const isMissingData = computed(
  () =>
    !isLoading.value &&
    (importItems.value.length === 0 || revisionItems.value.length === 0),
);
const canSubmit = computed(
  () => snapshotId.value !== undefined && revision.value !== undefined,
);

// Al abrir: la importación lista más reciente y la revisión pedida o la última.
watch(
  [open, importItems, revisionItems],
  () => {
    if (!open.value) return;
    snapshotId.value ??= importItems.value[0]?.value;
    revision.value ??= props.defaultRevision ?? revisionItems.value[0]?.value;
  },
  { immediate: true },
);

async function evaluate() {
  if (snapshotId.value === undefined || revision.value === undefined) return;
  isSubmitting.value = true;
  failure.value = null;
  try {
    const evaluationId = await $evaluations.create(props.projectId, {
      snapshotId: snapshotId.value,
      rulesetRevision: revision.value,
    });
    open.value = false;
    toast.add({
      title: t('Evaluación en marcha'),
      color: 'success',
      icon: 'i-lucide-play',
    });
    await navigateTo(
      `/projects/${props.projectId}/evaluations/${evaluationId}`,
    );
  } catch (error) {
    failure.value =
      error instanceof ApiFailure
        ? error.message
        : t('No pudimos empezar la evaluación.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="$t('Evaluar el catálogo')"
    :description="
      $t(
        'Aplica una revisión de reglas a una importación y revisa qué productos cumple Google.',
      )
    "
  >
    <template #body>
      <div v-if="isLoading" class="space-y-3">
        <USkeleton v-for="row in 2" :key="row" class="h-9 w-full" />
      </div>

      <UAlert
        v-else-if="isMissingData"
        color="warning"
        variant="subtle"
        icon="i-lucide-info"
        :title="$t('Falta algo para evaluar')"
        :description="
          $t(
            'Necesitas al menos una importación lista y una revisión de reglas.',
          )
        "
      />

      <div v-else class="space-y-4">
        <UFormField :label="$t('Importación')">
          <USelect v-model="snapshotId" :items="importItems" class="w-full" />
        </UFormField>
        <UFormField :label="$t('Revisión de reglas')">
          <USelect v-model="revision" :items="revisionItems" class="w-full" />
        </UFormField>
        <UAlert
          v-if="failure"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="failure"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">
          {{ $t('Cancelar') }}
        </UButton>
        <UButton
          icon="i-lucide-play"
          :loading="isSubmitting"
          :disabled="!canSubmit || isMissingData"
          @click="evaluate"
        >
          {{ $t('Evaluar') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

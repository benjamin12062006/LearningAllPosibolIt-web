<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { z } from 'zod';
import { ApiFailure } from '../services/api-client';
import type { PolicyInput } from '../services/feeds';
import type { Feed } from '../types/feeds';

/**
 * Política de la publicación automática: con qué revisión se evalúa y qué
 * límites debe cumplir para publicarse sin revisión. Las cifras las decide la
 * persona (no hay valores «buenos» ocultos); si no se cumplen, no publica.
 */
const props = defineProps<{ projectId: string; feed: Feed }>();
const emit = defineEmits<{ saved: [feed: Feed] }>();

const { $feeds } = useNuxtApp();
const toast = useToast();
const { rulesets } = useRulesets(() => props.projectId);

// La fecha de aprobación sigue al feed; los campos parten de la política actual.
const policy = computed(() => props.feed.policy);
const state = reactive<Partial<z.input<typeof feedPolicySchema>>>({
  rulesetRevision: props.feed.policy?.rulesetRevision,
  maxInvalid: props.feed.policy?.maxInvalid,
  maxExcluded: props.feed.policy?.maxExcluded,
  maxDropPercent: props.feed.policy?.maxDropPercent,
});

const revisionItems = computed(() =>
  rulesets.value.map((ruleset) => ({
    value: ruleset.revision,
    label: `Revisión ${ruleset.revision} · ${formatDate(ruleset.createdAt)}`,
  })),
);

async function onSubmit(event: FormSubmitEvent<PolicyInput>) {
  try {
    const saved = await $feeds.approvePolicy(
      props.projectId,
      props.feed.id,
      event.data,
    );
    emit('saved', saved);
    toast.add({
      title: 'Política aprobada',
      color: 'success',
      icon: 'i-lucide-check',
    });
  } catch (failure) {
    toast.add({
      title: 'No se aprobó la política',
      description:
        failure instanceof ApiFailure ? failure.message : 'Inténtalo de nuevo.',
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  }
}
</script>

<template>
  <UForm
    :schema="feedPolicySchema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <p v-if="policy" class="text-sm text-muted">
      Aprobada el {{ formatDateTime(policy.approvedAt) }}. Si cambian las
      comprobaciones de Google, habrá que aprobarla otra vez.
    </p>
    <UFormField label="Revisión de reglas" name="rulesetRevision">
      <USelect
        v-model="state.rulesetRevision"
        :items="revisionItems"
        placeholder="Elige una revisión"
        class="w-full sm:max-w-sm"
      />
    </UFormField>
    <div class="grid gap-4 sm:grid-cols-3">
      <UFormField label="Máximo de inválidos" name="maxInvalid">
        <UInput
          v-model.number="state.maxInvalid"
          type="number"
          min="0"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Máximo de excluidos" name="maxExcluded">
        <UInput
          v-model.number="state.maxExcluded"
          type="number"
          min="0"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Caída máxima (%)"
        name="maxDropPercent"
        description="Frente a los productos publicados ahora."
      >
        <UInput
          v-model.number="state.maxDropPercent"
          type="number"
          min="0"
          max="100"
          class="w-full"
        />
      </UFormField>
    </div>
    <UButton
      type="submit"
      icon="i-lucide-shield-check"
      color="neutral"
      variant="soft"
    >
      Aprobar política
    </UButton>
  </UForm>
</template>

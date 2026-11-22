<script setup lang="ts">
import type { Proposal } from '../types/assistant';
import { proposalLink } from '../utils/proposal-link';

const props = defineProps<{
  proposal: Proposal;
  projectId: string;
  busy: boolean;
  canDecide: boolean;
  external?: boolean;
}>();
const emit = defineEmits<{ decide: [decision: 'confirm' | 'reject'] }>();
const link = computed(() =>
  props.proposal.status === 'confirmed'
    ? proposalLink(props.projectId, props.proposal)
    : null,
);
const expired = computed(
  () => Date.parse(props.proposal.expiresAt) <= Date.now(),
);
const { language } = useAppLocale();
const failure = computed(() =>
  props.proposal.status === 'failed'
    ? (props.proposal.error?.message[language.value] ?? '')
    : '',
);
</script>

<template>
  <section class="space-y-3 rounded-lg border border-ai bg-ai-wash p-3">
    <h3 class="flex gap-2 font-medium">
      <UIcon name="i-lucide-sparkles" aria-hidden="true" />
      {{ $t(external ? 'Cambio externo' : 'Cambio del asistente') }}
    </h3>
    <p class="whitespace-pre-wrap break-words text-sm">
      {{ proposal.summary }}
    </p>
    <details v-if="proposal.rulesetReview" open class="text-sm">
      <summary class="cursor-pointer font-medium">
        {{ $t('Mapeo y reglas propuestos') }}
      </summary>
      <pre
        class="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded bg-default p-2"
        >{{ JSON.stringify(proposal.rulesetReview, null, 2) }}</pre>
    </details>
    <p v-if="proposal.status === 'rejected'" class="text-sm">
      {{ $t('Propuesta rechazada.') }}
    </p>
    <p v-else-if="proposal.status === 'confirmed'" class="text-sm">
      {{ $t('Cambio aplicado.') }}
    </p>
    <p v-else-if="proposal.status === 'failed'" class="text-sm text-error">
      {{ $t(external ? 'No se pudo aplicar la propuesta.' : 'No se pudo aplicar. El asistente sigue con el motivo:') }}
      {{ failure }}
    </p>
    <p v-else-if="expired" class="text-sm">{{ $t('Propuesta caducada.') }}</p>
    <div
      v-else-if="canDecide && proposal.status === 'ready'"
      class="flex flex-wrap gap-2"
    >
      <UButton size="sm" :loading="busy" @click="emit('decide', 'confirm')">{{
        $t('Confirmar propuesta')
      }}</UButton>
      <UButton
        size="sm"
        color="neutral"
        variant="soft"
        :disabled="busy"
        @click="emit('decide', 'reject')"
        >{{ $t('Rechazar') }}</UButton
      >
    </div>
    <UButton v-if="link" :to="link.to" variant="soft" size="sm">{{
      $t(link.label)
    }}</UButton>
  </section>
</template>

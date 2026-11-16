<script setup lang="ts">
const { t } = useAppLocale();

/**
 * Confirma la copia cuando el navegador acepta el texto y anuncia el resultado
 * sin mover el foco.
 */
const props = withDefaults(
  defineProps<{
    text: string;
    label?: string;
    copiedLabel?: string;
    variant?: 'solid' | 'soft' | 'ghost' | 'outline';
    color?: 'primary' | 'neutral';
    icon?: string;
  }>(),
  {
    variant: 'soft',
    color: 'neutral',
    icon: 'i-lucide-copy',
  },
);

const idleLabel = computed(() => props.label ?? t('Copiar'));
const successLabel = computed(() => props.copiedLabel ?? t('Copiado'));

const emit = defineEmits<{ copied: [] }>();

const COPIED_FEEDBACK_MS = 2_000;
const status = ref<'idle' | 'copying' | 'copied' | 'failed'>('idle');
let resetFeedback: ReturnType<typeof setTimeout> | undefined;
let attempt = 0;

function reset() {
  attempt += 1;
  clearTimeout(resetFeedback);
  status.value = 'idle';
}

watch(() => props.text, reset);
onBeforeUnmount(reset);

async function copy(event: MouseEvent) {
  const button = event.currentTarget;
  if (
    !(button instanceof HTMLElement) ||
    !props.text ||
    status.value === 'copying'
  )
    return;
  const current = ++attempt;
  const value = props.text;
  clearTimeout(resetFeedback);
  status.value = 'copying';
  const accepted = await copyText(value, button);
  if (current !== attempt) return;

  if (accepted) {
    status.value = 'copied';
    emit('copied');
    resetFeedback = setTimeout(reset, COPIED_FEEDBACK_MS);
  } else {
    status.value = 'failed';
  }
}

async function copyText(value: string, button: HTMLElement) {
  const clipboard = button.ownerDocument.defaultView?.navigator.clipboard;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(value);
      return true;
    } catch {
      return copyFromSelection(value, button);
    }
  }
  return copyFromSelection(value, button);
}

function copyFromSelection(value: string, button: HTMLElement) {
  const doc = button.ownerDocument;
  if (!button.isConnected || typeof doc.execCommand !== 'function')
    return false;
  const field = doc.createElement('textarea');
  field.value = value;
  field.readOnly = true;
  field.tabIndex = -1;
  field.style.cssText =
    'position: fixed; inset: 0 auto auto 0; opacity: 0; pointer-events: none';
  // El diálogo mantiene el foco dentro de su contenido.
  (button.closest('[role="dialog"]') ?? doc.body).appendChild(field);
  try {
    field.focus({ preventScroll: true });
    field.select();
    return doc.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove();
    if (button.isConnected) button.focus({ preventScroll: true });
  }
}
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-2">
    <UButton
      type="button"
      :color="color"
      :variant="variant"
      :icon="status === 'copied' ? 'i-lucide-check' : icon"
      :disabled="!text"
      :aria-disabled="status === 'copying' || undefined"
      class="touch-target"
      @click="copy"
    >
      {{ status === 'copied' ? successLabel : idleLabel }}
    </UButton>
    <span
      role="status"
      aria-live="polite"
      :class="status === 'failed' ? 'text-sm text-error' : 'sr-only'"
    >
      <template v-if="status === 'failed'">{{
        $t('No se pudo copiar. Selecciona el texto y cópialo manualmente.')
      }}</template>
      <template v-else-if="status === 'copied'">{{ successLabel }}</template>
    </span>
  </span>
</template>

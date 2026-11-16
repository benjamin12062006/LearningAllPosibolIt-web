<script setup lang="ts">
import { ApiFailure } from '../../../services/api-client';
import type { Feed } from '../types/feeds';

const { t } = useAppLocale();

/**
 * Entrega del feed: si la URL pública funciona, pedir una nueva (la anterior
 * deja de valer) o desactivarla. Las dos invalidan lo que tenga Merchant
 * Center, así que se confirman.
 */
const props = defineProps<{ projectId: string; feed: Feed }>();

const emit = defineEmits<{
  /** El feed cambió; con URL nueva si se rotó el token. */
  changed: [feed: Feed, deliveryUrl: string | null];
}>();

const { $feeds } = useNuxtApp();
const toast = useToast();

type PendingAction = 'rotate' | 'disable';
const pending = ref<PendingAction | null>(null);
const isWorking = ref(false);

const isConfirmOpen = computed({
  get: () => pending.value !== null,
  set: (open) => {
    if (!open) pending.value = null;
  },
});

const CONFIRM_TEXTS: Record<
  PendingAction,
  { title: string; description: string; label: string }
> = {
  rotate: {
    title: t('¿Crear una URL nueva?'),
    description: t(
      'La URL actual dejará de funcionar. Tendrás que poner la nueva en Merchant Center.',
    ),
    label: 'Crear URL nueva',
  },
  disable: {
    title: t('¿Desactivar la entrega?'),
    description: t(
      'Merchant Center no podrá descargar el feed hasta que crees una URL nueva.',
    ),
    label: t('Desactivar'),
  },
};

const confirmText = computed(() =>
  pending.value ? CONFIRM_TEXTS[pending.value] : CONFIRM_TEXTS.rotate,
);

async function confirm() {
  const action = pending.value;
  if (!action) return;
  isWorking.value = true;
  try {
    if (action === 'rotate') {
      const result = await $feeds.rotateDeliveryToken(
        props.projectId,
        props.feed.id,
      );
      emit('changed', result.feed, result.deliveryUrl);
    } else {
      await $feeds.disableDelivery(props.projectId, props.feed.id);
      emit('changed', { ...props.feed, deliveryEnabled: false }, null);
      toast.add({ title: 'Entrega desactivada', icon: 'i-lucide-link-2-off' });
    }
  } catch (error) {
    toast.add({
      title: t('No se pudo cambiar la entrega'),
      description:
        error instanceof ApiFailure ? error.message : t('Inténtalo de nuevo.'),
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isWorking.value = false;
    pending.value = null;
  }
}
</script>

<template>
  <section aria-labelledby="entrega">
    <h2 id="entrega" class="text-lg font-medium text-highlighted">
      {{ $t('Entrega') }}
    </h2>
    <div class="focus-row mt-2">
      <UIcon
        :name="feed.deliveryEnabled ? 'i-lucide-link-2' : 'i-lucide-link-2-off'"
        class="size-5 shrink-0"
        :class="feed.deliveryEnabled ? 'text-success' : 'text-dimmed'"
      />
      <p class="min-w-0 flex-1 text-sm">
        <template v-if="feed.deliveryEnabled">
          {{
            $t(
              'Activa. Merchant Center descarga la URL que guardaste al crearla.',
            )
          }}
        </template>
        <template v-else>
          {{ $t('Desactivada: la URL anterior responde «no encontrado».') }}
        </template>
      </p>
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      <UButton
        icon="i-lucide-refresh-ccw"
        color="neutral"
        variant="soft"
        @click="pending = 'rotate'"
      >
        {{
          feed.deliveryEnabled
            ? 'Crear URL nueva'
            : $t('Activar con una URL nueva')
        }}
      </UButton>
      <UButton
        v-if="feed.deliveryEnabled"
        icon="i-lucide-link-2-off"
        color="neutral"
        variant="ghost"
        @click="pending = 'disable'"
      >
        {{ $t('Desactivar') }}
      </UButton>
    </div>

    <UModal
      v-model:open="isConfirmOpen"
      :title="confirmText.title"
      :description="confirmText.description"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isConfirmOpen = false"
          >
            {{ $t('Cancelar') }}
          </UButton>
          <UButton color="warning" :loading="isWorking" @click="confirm">
            {{ confirmText.label }}
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>

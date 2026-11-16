<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';

/**
 * Plantilla «Panel lateral» (plan ui 04, §3.3): un diálogo de Ark pegado a la
 * derecha, de 28 rem en escritorio y a pantalla completa en el móvil. Ark
 * encierra el foco mientras está abierto y lo devuelve al cerrar; quien lo
 * abre desde la URL dice adónde con `returnFocusTo`.
 */
const props = defineProps<{
  title: string;
  description?: string;
  /** El elemento que recupera el foco al cerrar, por ejemplo la fila abierta. */
  returnFocusTo?: () => HTMLElement | null;
}>();

const open = defineModel<boolean>('open', { required: true });
</script>

<template>
  <Dialog.Root
    v-model:open="open"
    lazy-mount
    unmount-on-exit
    :final-focus-el="props.returnFocusTo"
  >
    <Teleport to="body">
      <Dialog.Backdrop
        class="fixed inset-0 z-(--layer-dialog) bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
      />
      <Dialog.Positioner
        class="fixed inset-0 z-(--layer-dialog) flex justify-end"
      >
        <Dialog.Content
          class="flex h-full w-full flex-col bg-default shadow-xl outline-none data-[state=closed]:animate-panel-out data-[state=open]:animate-panel-in sm:w-[28rem] sm:border-s sm:border-default"
        >
          <header
            class="flex shrink-0 items-start gap-3 border-b border-default px-5 py-4"
          >
            <div class="min-w-0 flex-1">
              <Dialog.Title
                class="truncate text-lg font-semibold text-highlighted"
              >
                {{ title }}
              </Dialog.Title>
              <Dialog.Description
                v-if="description"
                class="mt-0.5 text-sm text-muted"
              >
                {{ description }}
              </Dialog.Description>
            </div>
            <Dialog.CloseTrigger as-child>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                :aria-label="$t('Cerrar')"
                class="touch-target"
              />
            </Dialog.CloseTrigger>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="flex shrink-0 flex-wrap justify-end gap-2 border-t border-default px-5 py-3"
          >
            <slot name="footer" />
          </footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>

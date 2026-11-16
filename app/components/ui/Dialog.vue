<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';

/**
 * Diálogo centrado de Ark con el tema de la app: para confirmar o pedir un
 * dato corto. En el móvil ocupa el ancho y se pega abajo, al alcance del
 * pulgar. Ark encierra el foco y lo devuelve a quien lo abrió.
 */
defineProps<{ title: string; description?: string }>();

const open = defineModel<boolean>('open', { required: true });
</script>

<template>
  <Dialog.Root v-model:open="open" lazy-mount unmount-on-exit>
    <Teleport to="body">
      <Dialog.Backdrop
        class="fixed inset-0 z-(--layer-dialog) bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
      />
      <Dialog.Positioner
        class="fixed inset-0 z-(--layer-dialog) flex items-end justify-center sm:items-center sm:p-4"
      >
        <Dialog.Content
          class="flex max-h-full w-full flex-col rounded-t-xl bg-default shadow-xl outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-rise-in sm:max-w-lg sm:rounded-xl sm:ring-1 sm:ring-default"
        >
          <header class="flex items-start gap-3 px-5 pt-5">
            <div class="min-w-0 flex-1">
              <Dialog.Title class="text-lg font-semibold text-highlighted">
                {{ title }}
              </Dialog.Title>
              <Dialog.Description
                v-if="description"
                class="mt-1 text-sm text-muted"
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
                class="touch-target -me-2 -mt-1"
              />
            </Dialog.CloseTrigger>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="flex flex-wrap justify-end gap-2 border-t border-default px-5 py-3"
          >
            <slot name="footer" />
          </footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>

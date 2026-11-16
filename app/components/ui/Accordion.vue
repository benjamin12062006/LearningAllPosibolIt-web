<script setup lang="ts" generic="Item extends { value: string }">
import { Accordion } from '@ark-ui/vue/accordion';

/**
 * Lista de grupos que se despliegan (Ark). El contenido de cada grupo se monta
 * al abrirlo por primera vez: un grupo cerrado no pide sus datos.
 */
defineProps<{ items: Item[] }>();

defineSlots<{
  header(props: { item: Item }): unknown;
  default(props: { item: Item }): unknown;
}>();
</script>

<template>
  <Accordion.Root
    multiple
    collapsible
    lazy-mount
    class="divide-y divide-default"
  >
    <Accordion.Item v-for="item in items" :key="item.value" :value="item.value">
      <Accordion.ItemTrigger
        class="group flex min-h-11 w-full items-center gap-3 py-2.5 text-left outline-primary focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span class="min-w-0 flex-1"><slot name="header" :item="item" /></span>
        <UIcon
          name="i-lucide-chevron-down"
          class="size-4 shrink-0 text-muted transition-transform duration-(--motion-standard) group-data-[state=open]:rotate-180"
        />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent class="pb-4">
        <slot :item="item" />
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion.Root>
</template>

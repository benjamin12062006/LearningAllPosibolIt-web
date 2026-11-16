<script setup lang="ts" generic="Value extends string">
import { Tabs } from '@ark-ui/vue/tabs';

/**
 * Pestañas de Ark con el tema de la app. Cada pestaña es un slot con el nombre
 * de su valor. Su contenido se monta al abrirla por primera vez (`lazy-mount`):
 * una pestaña que nadie abre no pide sus datos.
 */
export interface TabItem<TabValue extends string> {
  value: TabValue;
  label: string;
  icon?: string;
  /** Un recuento o un estado corto junto a la etiqueta. */
  badge?: string | number;
}

defineProps<{ items: TabItem<Value>[]; label: string }>();

const selected = defineModel<Value>({ required: true });

// Ark trabaja con `string`: el valor siempre es uno de `items`.
function select(value: string, items: TabItem<Value>[]) {
  const item = items.find((candidate) => candidate.value === value);
  if (item) selected.value = item.value;
}
</script>

<template>
  <Tabs.Root
    :model-value="selected"
    lazy-mount
    @value-change="({ value }) => select(value, items)"
  >
    <Tabs.List
      :aria-label="label"
      class="relative flex gap-1 overflow-x-auto border-b border-default"
    >
      <Tabs.Trigger
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        class="touch-target focus-ring flex shrink-0 items-center gap-2 rounded-t-md px-3 py-2 text-sm text-muted transition-colors duration-(--motion-instant) hover:text-default data-[selected]:font-medium data-[selected]:text-highlighted"
      >
        <UIcon v-if="item.icon" :name="item.icon" class="size-4" />
        {{ item.label }}
        <span
          v-if="item.badge !== undefined"
          class="rounded-full bg-elevated px-1.5 text-xs text-toned tabular-nums"
        >
          {{ item.badge }}
        </span>
      </Tabs.Trigger>
      <Tabs.Indicator
        class="absolute bottom-0 h-0.5 w-(--width) bg-primary transition-[translate,width] duration-(--motion-standard)"
      />
    </Tabs.List>

    <Tabs.Content
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      class="pt-5 outline-none"
    >
      <slot :name="item.value" />
    </Tabs.Content>
  </Tabs.Root>
</template>

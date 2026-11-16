<script setup lang="ts" generic="Value extends string">
import { SegmentGroup } from '@ark-ui/vue/segment-group';

/**
 * Elegir una entre pocas opciones a la vista (un grupo de radios con forma de
 * botones). La opción elegida lleva fondo y peso, no solo color.
 */
const props = defineProps<{
  label: string;
  options: Record<Value, string>;
}>();

const selected = defineModel<Value>({ required: true });

const entries = computed(
  () => Object.entries(props.options) as [Value, string][],
);

function select(value: string | null) {
  const match = entries.value.find(([option]) => option === value);
  if (match) selected.value = match[0];
}
</script>

<template>
  <SegmentGroup.Root
    :model-value="selected"
    orientation="horizontal"
    class="inline-flex rounded-lg bg-muted p-0.5"
    @value-change="({ value }) => select(value)"
  >
    <SegmentGroup.Label class="sr-only">{{ label }}</SegmentGroup.Label>
    <SegmentGroup.Item
      v-for="[value, text] in entries"
      :key="value"
      :value="value"
      class="touch-target flex cursor-pointer items-center rounded-md px-3 py-1 text-sm text-muted transition-colors duration-(--motion-instant) hover:text-default has-focus-visible:outline-2 has-focus-visible:outline-primary data-[state=checked]:bg-default data-[state=checked]:font-medium data-[state=checked]:text-highlighted data-[state=checked]:shadow-xs"
    >
      <SegmentGroup.ItemText>{{ text }}</SegmentGroup.ItemText>
      <SegmentGroup.ItemControl />
      <SegmentGroup.ItemHiddenInput />
    </SegmentGroup.Item>
  </SegmentGroup.Root>
</template>

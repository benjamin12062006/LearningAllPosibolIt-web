<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu';

/**
 * Menú de acciones de Ark con el tema de la app: se abre desde un botón, se
 * recorre con las flechas y se cierra con Escape devolviendo el foco al botón.
 */
export interface MenuAction {
  /** Único dentro del menú. */
  value: string;
  label: string;
  icon?: string;
  /** Acciones que no se deshacen fácil: van en el color de error y con su icono. */
  isDestructive?: boolean;
  disabled?: boolean;
}

withDefaults(
  defineProps<{
    label: string;
    actions: MenuAction[];
    icon?: string;
    /** Sin texto: solo el icono, con `label` como nombre accesible. */
    iconOnly?: boolean;
  }>(),
  { icon: 'i-lucide-ellipsis', iconOnly: true },
);

const emit = defineEmits<{ select: [value: string] }>();
</script>

<template>
  <Menu.Root @select="({ value }) => emit('select', value)">
    <Menu.Trigger as-child>
      <UButton
        color="neutral"
        variant="ghost"
        :icon="icon"
        :aria-label="iconOnly ? label : undefined"
        class="touch-target"
      >
        <template v-if="!iconOnly">{{ label }}</template>
      </UButton>
    </Menu.Trigger>
    <Teleport to="body">
      <Menu.Positioner class="z-(--layer-menu)">
        <Menu.Content
          class="min-w-44 rounded-lg bg-default p-1 shadow-lg ring-1 ring-default outline-none data-[state=open]:animate-rise-in"
        >
          <Menu.Item
            v-for="action in actions"
            :key="action.value"
            :value="action.value"
            :disabled="action.disabled"
            class="flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-dimmed data-[highlighted]:bg-elevated pointer-coarse:min-h-11"
            :class="action.isDestructive ? 'text-error' : 'text-default'"
          >
            <UIcon v-if="action.icon" :name="action.icon" class="size-4" />
            {{ action.label }}
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Teleport>
  </Menu.Root>
</template>

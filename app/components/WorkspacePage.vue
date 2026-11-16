<script setup lang="ts">
/**
 * Estructura común de cada vista del espacio de trabajo, como en Focus:
 * cabecera ilustrada, título grande y fino y contenido en filas.
 */
withDefaults(
  defineProps<{ id: string; title: string; compactCover?: boolean }>(),
  { compactCover: false },
);
</script>

<template>
  <UDashboardPanel :id="id" :ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }">
    <template #body>
      <div
        class="pointer-events-none sticky top-0 z-(--layer-bar) flex h-0 shrink-0 justify-end"
      >
        <div class="pointer-events-auto me-3 mt-3 self-start">
          <AssistantProjectLauncher />
        </div>
      </div>
      <FocusCover :compact="compactCover">
        <template #leading>
          <UDashboardSidebarToggle
            color="neutral"
            variant="soft"
            class="bg-black/25 text-white hover:bg-black/35"
          />
        </template>
        <template #actions>
          <div v-if="$slots.actions" class="me-12 flex items-center gap-1">
            <slot name="actions" />
          </div>
        </template>
      </FocusCover>

      <div
        class="mx-auto w-full max-w-4xl flex-1 px-5 pt-8 pb-12 sm:px-12 sm:pt-10"
      >
        <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div class="min-w-0">
            <h1 data-assistant-route-anchor class="focus-title break-words">
              {{ title }}
            </h1>
            <slot name="subtitle" />
          </div>
          <slot name="title-actions" />
        </header>

        <slot />
      </div>
    </template>
  </UDashboardPanel>
</template>

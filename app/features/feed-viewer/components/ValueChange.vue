<script setup lang="ts">
/**
 * Un valor «antes → después». `null` es que ese lado no tiene el campo. El
 * cambio se lee con las palabras y la flecha, no solo por el color (WCAG 1.4.1).
 */
defineProps<{ label: string; before: string | null; after: string | null }>();
</script>

<template>
  <div class="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 py-1 text-sm">
    <span class="font-mono text-xs break-all text-muted">{{ label }}</span>
    <span class="min-w-0 break-words select-text">
      <del class="text-muted decoration-error/70">
        <span class="sr-only">{{ $t('Antes:') }} </span
        >{{ before ?? $t('Sin valor') }}
      </del>
      <UIcon
        name="i-lucide-arrow-right"
        class="mx-1.5 inline size-3.5 align-middle text-dimmed"
        aria-hidden="true"
      />
      <ins class="text-default no-underline">
        <span class="sr-only">{{ $t('Después:') }} </span
        >{{ after ?? $t('Sin valor') }}
      </ins>
    </span>
  </div>
</template>

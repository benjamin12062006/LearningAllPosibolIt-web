<script setup lang="ts">
defineProps<{ message?: string }>();
</script>

<template>
  <div role="status" aria-live="polite" class="py-10 text-center">
    <UIcon
      name="i-lucide-loader-circle"
      class="mx-auto mb-5 size-8 animate-spin text-primary motion-reduce:animate-none"
    />
    <p class="text-base text-toned">
      {{ message ?? $t('Recuperando tu sesión…') }}
    </p>
  </div>
</template>

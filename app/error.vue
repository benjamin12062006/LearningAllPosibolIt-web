<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{ error: NuxtError }>();
</script>

<!-- UError de Nuxt UI dentro de UApp, para que también aquí haya tema y toasts. -->
<template>
  <UApp>
    <UError
      :error="{
        statusCode: error.statusCode,
        statusMessage:
          error.statusCode === 404
            ? 'Esta página no está aquí.'
            : 'Algo interrumpió el camino.',
        message: 'Puedes volver a tus proyectos y continuar desde allí.',
      }"
      redirect="/projects"
      :clear="{ label: 'Volver a mis proyectos', color: 'primary' }"
    />
  </UApp>
</template>

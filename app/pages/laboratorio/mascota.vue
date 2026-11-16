<script setup lang="ts">
definePageMeta({ layout: false });

if (!import.meta.dev)
  throw createError({ statusCode: 404, statusMessage: 'Página no encontrada' });
await navigateTo('/laboratorio#mascota', { replace: true });
</script>

<template><div /></template>

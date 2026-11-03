<script setup lang="ts">
definePageMeta({ layout: 'workspace' });
</script>

<template>
  <WorkspacePage id="nuevo-proyecto" title="Nuevo proyecto" compact-cover>
    <template #subtitle>
      <p class="mt-1 text-sm text-muted">
        País, moneda y canal deciden cómo se revisa y publica el catálogo.
      </p>
    </template>

    <ProjectForm />
  </WorkspacePage>
</template>

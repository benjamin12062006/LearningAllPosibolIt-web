<script setup lang="ts">
const { state, actions } = useAccess();
const progress = computed(() => {
  if (state.value.status === 'signingOut') return 'Cerrando tu sesión…';
  if (state.value.status === 'preparingProfile') return 'Preparando tu cuenta…';
  return 'Recuperando tu sesión…';
});
</script>

<template>
  <div>
    <p class="focus-section-label">Tu cuenta</p>
    <template v-if="state.status === 'error'">
      <h1 class="mt-3 text-3xl font-light tracking-tight text-highlighted">
        Vamos a intentarlo de nuevo.
      </h1>
      <UAlert
        class="mt-5"
        color="error"
        variant="subtle"
        icon="i-lucide-cloud-off"
        :title="state.message"
        role="alert"
      />
      <UButton class="mt-6" size="lg" block @click="actions.retry">
        Reintentar
      </UButton>
      <div v-if="state.stage !== 'configuration'" class="mt-2 text-center">
        <UButton color="neutral" variant="ghost" @click="actions.signOut">
          Volver al inicio
        </UButton>
      </div>
    </template>
    <template v-else>
      <SessionProgress :message="progress" />
      <div v-if="state.status === 'preparingProfile'" class="text-center">
        <UButton color="neutral" variant="ghost" @click="actions.signOut">
          Cancelar
        </UButton>
      </div>
    </template>
  </div>
</template>

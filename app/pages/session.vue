<script setup lang="ts">
import { useAccess } from '../features/access/composables/useAccess';

const { t } = useAppLocale();

const { state, actions } = useAccess();
const progress = computed(() => {
  if (state.value.status === 'signingOut') return t('Cerrando tu sesión…');
  if (state.value.status === 'preparingProfile') return t('Preparando tu cuenta…');
  return t('Recuperando tu sesión…');
});
</script>

<template>
  <div>
    <p class="focus-section-label">{{ $t('Tu cuenta') }}</p>
    <template v-if="state.status === 'error'">
      <h1 class="mt-3 text-3xl font-light tracking-tight text-highlighted">
        {{ $t('Vamos a intentarlo de nuevo.') }}
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
        {{ $t('Reintentar') }}
      </UButton>
      <div v-if="state.stage !== 'configuration'" class="mt-2 text-center">
        <UButton color="neutral" variant="ghost" @click="actions.signOut">
          {{ $t('Volver al inicio') }}
        </UButton>
      </div>
    </template>
    <template v-else>
      <SessionProgress :message="progress" />
      <div v-if="state.status === 'preparingProfile'" class="text-center">
        <UButton color="neutral" variant="ghost" @click="actions.signOut">
          {{ $t('Cancelar') }}
        </UButton>
      </div>
    </template>
  </div>
</template>

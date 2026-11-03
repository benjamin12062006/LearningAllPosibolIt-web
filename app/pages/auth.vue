<script setup lang="ts">
const { state, actions } = useAccess();
const route = useRoute();
const active = computed(() => state.value.status === 'authenticating');

let resuming = false;
watch(
  [() => state.value.status, () => route.fullPath],
  () => {
    // Descope consumes its own OAuth/Magic Link parameters when the Flow mounts.
    if (
      !resuming &&
      state.value.status === 'signedOut' &&
      ('code' in route.query ||
        'descope-login-flow' in route.query ||
        't' in route.query)
    ) {
      resuming = true;
      actions.beginSignIn();
    }
  },
  { immediate: true },
);

function cancel() {
  actions.cancelSignIn();
  if (Object.keys(route.query).length)
    void navigateTo('/auth', { replace: true });
}

onBeforeRouteLeave(() => {
  if (active.value) actions.cancelSignIn();
});
</script>

<template>
  <div v-if="state.status === 'signedOut' || state.status === 'authenticating'">
    <p class="focus-section-label">Tu espacio de trabajo</p>
    <h1 class="mt-3 text-3xl font-light tracking-tight text-highlighted">
      {{ active ? 'Ya casi estás dentro.' : 'Qué bueno verte.' }}
    </h1>
    <p class="mt-3 text-base text-toned">
      {{
        active
          ? 'Continúa para acceder a tu cuenta.'
          : 'Entra o crea tu cuenta para comenzar.'
      }}
    </p>

    <template v-if="state.status === 'authenticating'">
      <ClientOnly>
        <DescopeFlow :key="state.attempt" :attempt="state.attempt" />
      </ClientOnly>
      <div class="mt-6 flex justify-center">
        <UButton color="neutral" variant="ghost" @click="cancel">
          Cancelar
        </UButton>
      </div>
    </template>
    <template v-else>
      <UIcon
        name="i-lucide-fingerprint"
        class="mx-auto mt-9 mb-8 block size-14 text-primary"
      />
      <UButton
        size="lg"
        block
        trailing-icon="i-lucide-arrow-right"
        @click="actions.beginSignIn"
      >
        Continuar
      </UButton>
      <p v-if="state.notice" role="status" class="mt-4 text-sm text-muted">
        {{ state.notice }}
      </p>
    </template>

    <footer
      class="mt-9 border-t border-default pt-5 text-center text-sm text-muted"
    >
      Tu cuenta, bajo tu control.
    </footer>
  </div>
  <SessionProgress v-else />
</template>

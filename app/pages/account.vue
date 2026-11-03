<script setup lang="ts">
definePageMeta({ layout: 'workspace' });

const { state, actions } = useAccess();

const user = computed(() =>
  state.value.status === 'ready' ? state.value.user : null,
);
const title = computed(() => user.value?.displayName ?? 'Tu cuenta');
const memberSince = computed(() =>
  user.value ? formatDate(user.value.createdAt) : '',
);
</script>

<template>
  <WorkspacePage id="cuenta" :title="title" compact-cover>
    <template #subtitle>
      <p class="mt-1 text-sm text-muted">
        Tu sesión está activa y tu cuenta está lista.
      </p>
    </template>

    <dl v-if="user" class="max-w-xl">
      <div class="focus-row justify-between">
        <dt class="text-sm text-muted">Correo</dt>
        <dd class="text-sm break-all select-text">
          {{ user.email ?? 'Sin correo disponible' }}
        </dd>
      </div>
      <div class="focus-row justify-between">
        <dt class="text-sm text-muted">Miembro desde</dt>
        <dd class="text-sm">
          <time :datetime="user.createdAt">{{ memberSince }}</time>
        </dd>
      </div>
    </dl>

    <UButton
      class="mt-8"
      color="neutral"
      variant="soft"
      icon="i-lucide-log-out"
      @click="actions.signOut"
    >
      Cerrar sesión
    </UButton>
  </WorkspacePage>
</template>

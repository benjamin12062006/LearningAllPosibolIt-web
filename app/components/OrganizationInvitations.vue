<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { ApiFailure } from '../services/api-client';
import {
  ORGANIZATION_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type OrganizationInvitation,
  type OrganizationRole,
} from '../types/organizations';

/**
 * Invitar y gestionar invitaciones pendientes (solo con `members.manage`). La
 * API no envía correos: devuelve un token una sola vez y la web lo convierte
 * en un enlace para compartir.
 */
const props = defineProps<{ organizationId: string }>();

const { $organizations } = useNuxtApp();
const toast = useToast();
const { invitations, status, error, refresh } = useOrganizationInvitations(
  () => props.organizationId,
);

// Mismas reglas que `InviteMemberDto`: correo ≤ 254 y rol de la lista cerrada.
const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, 'El correo es demasiado largo.')
    .pipe(z.email('Escribe un correo válido.')),
  role: z.enum(ORGANIZATION_ROLES),
});

const state = reactive<{ email: string; role: OrganizationRole }>({
  email: '',
  role: 'editor',
});

const roleItems = ORGANIZATION_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
  description: ROLE_DESCRIPTIONS[role],
}));

const shownLink = ref<string | null>(null);
const isLinkOpen = computed({
  get: () => shownLink.value !== null,
  set: (open) => {
    if (!open) shownLink.value = null;
  },
});

const pendingRevoke = ref<OrganizationInvitation | null>(null);
const isRevoking = ref(false);
const isRevokeOpen = computed({
  get: () => pendingRevoke.value !== null,
  set: (open) => {
    if (!open) pendingRevoke.value = null;
  },
});

async function onInvite(
  event: FormSubmitEvent<{ email: string; role: OrganizationRole }>,
) {
  try {
    const created = await $organizations.invite(
      props.organizationId,
      event.data,
    );
    shownLink.value = invitationLink(created.token, window.location.origin);
    state.email = '';
    await refresh();
  } catch (failure) {
    notifyError('No se creó la invitación', failure);
  }
}

async function confirmRevoke() {
  const invitation = pendingRevoke.value;
  if (!invitation) return;
  isRevoking.value = true;
  try {
    await $organizations.revokeInvitation(props.organizationId, invitation.id);
    await refresh();
    toast.add({ title: 'Invitación anulada', icon: 'i-lucide-mail-x' });
  } catch (failure) {
    notifyError('No se anuló la invitación', failure);
  } finally {
    isRevoking.value = false;
    pendingRevoke.value = null;
  }
}

function notifyError(title: string, failure: unknown) {
  toast.add({
    title,
    description:
      failure instanceof ApiFailure ? failure.message : 'Inténtalo de nuevo.',
    color: 'error',
    icon: 'i-lucide-circle-alert',
  });
}
</script>

<template>
  <section aria-labelledby="invitaciones" class="space-y-4">
    <h2 id="invitaciones" class="text-lg font-medium text-highlighted">
      Invitar
    </h2>

    <UForm
      :schema="inviteSchema"
      :state="state"
      class="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-start"
      @submit="onInvite"
    >
      <UFormField name="email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="correo@empresa.com"
          autocomplete="off"
          aria-label="Correo de la persona invitada"
          class="w-full"
        />
      </UFormField>
      <UFormField name="role">
        <USelect
          v-model="state.role"
          :items="roleItems"
          aria-label="Rol"
          class="w-full"
        />
      </UFormField>
      <UButton type="submit" icon="i-lucide-send">Crear invitación</UButton>
    </UForm>
    <p class="text-xs text-muted">
      La persona debe entrar con ese mismo correo para aceptar. Si no había
      iniciado sesión, al entrar vuelve sola a la invitación.
    </p>

    <div
      v-if="status === 'pending' && invitations.length === 0"
      class="space-y-3"
    >
      <USkeleton class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
    />

    <ul v-else-if="invitations.length > 0">
      <li
        v-for="invitation in invitations"
        :key="invitation.id"
        class="focus-row"
      >
        <UIcon name="i-lucide-mail" class="size-5 shrink-0 text-dimmed" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm text-default">{{
            invitation.email
          }}</span>
          <span class="block truncate text-xs text-muted">
            {{ ROLE_LABELS[invitation.role] }} · caduca el
            {{ formatDateTime(invitation.expiresAt) }}
          </span>
        </span>
        <UButton
          icon="i-lucide-mail-x"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="`Anular la invitación de ${invitation.email}`"
          @click="pendingRevoke = invitation"
        />
      </li>
    </ul>

    <OneTimeLinkModal
      v-if="shownLink"
      v-model:open="isLinkOpen"
      :url="shownLink"
      title="Enlace de invitación"
      warning-title="Compártelo solo con la persona invitada."
      warning-description="Si se pierde, anula la invitación y crea otra."
    />

    <UModal
      v-model:open="isRevokeOpen"
      title="¿Anular la invitación?"
      :description="`El enlace enviado a ${pendingRevoke?.email ?? ''} dejará de funcionar.`"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isRevokeOpen = false"
          >
            Cancelar
          </UButton>
          <UButton color="error" :loading="isRevoking" @click="confirmRevoke">
            Anular
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>

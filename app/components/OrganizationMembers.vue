<script setup lang="ts">
import { ApiFailure } from '../services/api-client';
import {
  ORGANIZATION_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type OrganizationMember,
  type OrganizationRole,
} from '../types/organizations';

/**
 * Miembros y sus roles. Quien tiene `members.manage` cambia roles y quita
 * personas; cualquiera puede salir (salvo de su organización personal). Las
 * reglas finas (último propietario) las decide la API y se muestra su mensaje.
 */
const props = defineProps<{
  organizationId: string;
  canManage: boolean;
  isPersonal: boolean;
}>();

/** Mi rol pudo cambiar: la página vuelve a leer lo que puedo hacer. */
const emit = defineEmits<{ accessChanged: []; left: [] }>();

const { $organizations } = useNuxtApp();
const toast = useToast();
const { state } = useAccess();
const { members, status, error, refresh } = useOrganizationMembers(
  () => props.organizationId,
);

const myUserId = computed(() =>
  state.value.status === 'ready' ? state.value.user.id : null,
);

const roleItems = ORGANIZATION_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
  description: ROLE_DESCRIPTIONS[role],
}));

const pendingRemoval = ref<OrganizationMember | null>(null);
const isRemoving = ref(false);
const isRemovalOpen = computed({
  get: () => pendingRemoval.value !== null,
  set: (open) => {
    if (!open) pendingRemoval.value = null;
  },
});

const removalIsMe = computed(
  () => pendingRemoval.value?.userId === myUserId.value,
);

function nameOf(member: OrganizationMember) {
  return member.displayName ?? member.email ?? 'Sin nombre';
}

function isMe(member: OrganizationMember) {
  return member.userId === myUserId.value;
}

/** Salir no se ofrece en la organización personal: la API no lo permite. */
function canRemove(member: OrganizationMember) {
  if (isMe(member)) return !props.isPersonal;
  return props.canManage;
}

async function changeRole(member: OrganizationMember, role: OrganizationRole) {
  if (role === member.role) return;
  try {
    await $organizations.changeRole(props.organizationId, member.userId, role);
    toast.add({
      title: `${nameOf(member)} ahora es ${ROLE_LABELS[role].toLowerCase()}`,
      color: 'success',
      icon: 'i-lucide-user-cog',
    });
    if (isMe(member)) emit('accessChanged');
  } catch (failure) {
    notifyError('No se cambió el rol', failure);
  } finally {
    // Con éxito o sin él, la lista vuelve a mostrar lo que hay en la API.
    await refresh();
  }
}

async function confirmRemoval() {
  const member = pendingRemoval.value;
  if (!member) return;
  isRemoving.value = true;
  try {
    await $organizations.removeMember(props.organizationId, member.userId);
    if (isMe(member)) {
      emit('left');
      return;
    }
    await refresh();
    toast.add({
      title: `${nameOf(member)} ya no es miembro`,
      icon: 'i-lucide-user-minus',
    });
  } catch (failure) {
    notifyError(
      isMe(member) ? 'No pudiste salir' : 'No se quitó al miembro',
      failure,
    );
  } finally {
    isRemoving.value = false;
    pendingRemoval.value = null;
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
  <section aria-labelledby="miembros">
    <h2 id="miembros" class="text-lg font-medium text-highlighted">Miembros</h2>

    <div
      v-if="status === 'pending' && members.length === 0"
      class="mt-3 space-y-3"
    >
      <USkeleton v-for="row in 2" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-3"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <ul v-else class="mt-1">
      <li v-for="member in members" :key="member.userId" class="focus-row">
        <UAvatar :alt="nameOf(member)" size="sm" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm text-default">
            {{ nameOf(member)
            }}<span v-if="isMe(member)" class="text-muted"> (tú)</span>
          </span>
          <span
            v-if="member.email && member.displayName"
            class="block truncate text-xs text-muted"
          >
            {{ member.email }}
          </span>
        </span>
        <USelect
          v-if="canManage"
          :model-value="member.role"
          :items="roleItems"
          size="sm"
          class="w-40"
          :aria-label="`Rol de ${nameOf(member)}`"
          @update:model-value="(role) => changeRole(member, role)"
        />
        <UBadge v-else color="neutral" variant="subtle">{{
          ROLE_LABELS[member.role]
        }}</UBadge>
        <UButton
          v-if="canRemove(member)"
          :icon="isMe(member) ? 'i-lucide-log-out' : 'i-lucide-user-minus'"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="
            isMe(member)
              ? 'Salir de la organización'
              : `Quitar a ${nameOf(member)}`
          "
          @click="pendingRemoval = member"
        />
      </li>
    </ul>

    <UModal
      v-model:open="isRemovalOpen"
      :title="
        removalIsMe ? '¿Salir de la organización?' : '¿Quitar a este miembro?'
      "
      :description="
        removalIsMe
          ? 'Dejarás de ver esta organización. Para volver necesitarás otra invitación.'
          : `${pendingRemoval ? nameOf(pendingRemoval) : ''} dejará de tener acceso.`
      "
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isRemovalOpen = false"
          >
            Cancelar
          </UButton>
          <UButton color="error" :loading="isRemoving" @click="confirmRemoval">
            {{ removalIsMe ? 'Salir' : 'Quitar' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>

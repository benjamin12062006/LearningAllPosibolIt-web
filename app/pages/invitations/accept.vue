<script setup lang="ts">
import { useOrganizations } from '../../features/organizations/composables/useOrganizations';
import { tokenFromHash } from '~/features/organizations/utils/invitation-link';
import { ApiFailure } from '../../services/api-client';

const { t } = useAppLocale();

definePageMeta({ layout: 'workspace' });

/**
 * Aceptar una invitación desde su enlace (`/invitations/accept#<token>`). Se
 * pide confirmar antes de llamar a la API: abrir un enlace no debe unirte a
 * una organización por sí solo.
 */
const route = useRoute();
const router = useRouter();
const { $organizations } = useNuxtApp();
const { refresh: refreshOrganizations } = useOrganizations();
const toast = useToast();

const token = computed(() => tokenFromHash(route.hash));
const isAccepting = ref(false);
const failure = ref<ApiFailure | null>(null);

async function accept() {
  const value = token.value;
  if (!value) return;
  isAccepting.value = true;
  failure.value = null;
  try {
    const joined = await $organizations.acceptInvitation(value);
    await refreshOrganizations();
    toast.add({
      title: t('Ya eres miembro de {0}', [joined.organization.name]),
      color: 'success',
      icon: 'i-lucide-party-popper',
    });
    // Sin el token en el historial: el enlace ya se usó.
    await router.replace(`/organizations/${joined.organization.id}`);
  } catch (error) {
    failure.value =
      error instanceof ApiFailure
        ? error
        : new ApiFailure(0, t('No pudimos aceptar la invitación.'));
  } finally {
    isAccepting.value = false;
  }
}
</script>

<template>
  <WorkspacePage
    id="aceptar-invitacion"
    :title="$t('Invitación')"
    compact-cover
  >
    <UAlert
      v-if="!token"
      color="warning"
      variant="subtle"
      icon="i-lucide-link-2-off"
      :title="$t('El enlace está incompleto')"
      :description="
        $t(
          'Pide a quien te invitó que copie el enlace entero, incluida la parte después de «#».',
        )
      "
    />

    <div v-else class="max-w-lg space-y-5">
      <p class="text-sm text-toned">
        {{
          $t(
            'Te invitaron a una organización. Al aceptar, verás la organización, sus miembros y la lista de sus proyectos, con el rol que te dieron.',
          )
        }}
      </p>

      <UAlert
        v-if="failure"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :title="$t('No se aceptó la invitación')"
        :description="failure.message"
      />

      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-check" :loading="isAccepting" @click="accept">
          {{ $t('Aceptar invitación') }}
        </UButton>
        <UButton to="/organizations" color="neutral" variant="ghost">
          {{ $t('Ahora no') }}
        </UButton>
      </div>
    </div>
  </WorkspacePage>
</template>

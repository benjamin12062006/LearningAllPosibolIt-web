<script setup lang="ts">
import { useOrganizations } from '../composables/useOrganizations';
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { ApiFailure } from '../../../services/api-client';

const { t } = useAppLocale();

/** Crear una organización de equipo; quien la crea queda como propietario. */
const open = defineModel<boolean>('open', { required: true });

const { $organizations } = useNuxtApp();
const { refresh } = useOrganizations();
const toast = useToast();

// Mismas reglas que `CreateOrganizationDto` de la API.
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, t('Escribe un nombre.'))
    .max(120, t('Usa como máximo 120 caracteres.')),
});

const state = reactive({ name: '' });

async function onSubmit(event: FormSubmitEvent<{ name: string }>) {
  try {
    const created = await $organizations.create(event.data.name);
    await refresh();
    open.value = false;
    state.name = '';
    await navigateTo(`/organizations/${created.organization.id}`);
  } catch (failure) {
    toast.add({
      title: t('No se creó la organización'),
      description:
        failure instanceof ApiFailure
          ? failure.message
          : t('Inténtalo de nuevo.'),
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="$t('Nueva organización')"
    :description="
      $t(
        'Para trabajar con otras personas. Tu cuenta tiene además una organización personal.',
      )
    "
  >
    <template #body>
      <UForm
        id="nueva-organizacion"
        :schema="schema"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField :label="$t('Nombre')" name="name" required>
          <UInput
            v-model="state.name"
            :placeholder="$t('Mi empresa')"
            autofocus
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">{{
          $t('Cancelar')
        }}</UButton>
        <UButton type="submit" form="nueva-organizacion" icon="i-lucide-plus">{{
          $t('Crear')
        }}</UButton>
      </div>
    </template>
  </UModal>
</template>

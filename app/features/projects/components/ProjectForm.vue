<script setup lang="ts">
import { useProjects } from '../composables/useProjects';
import type { Form, FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { ApiFailure } from '../../../services/api-client';
import {
  currencyOptions,
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  isProjectCountry,
  isProjectCurrency,
  regionOptions,
} from '../utils/project-localization';
import {
  CHANNEL_PROFILE_LABELS,
  type Project,
  type ProjectInput,
} from '../types/projects';

/**
 * Crear y editar comparten formulario (como en el curso). La validación la hace
 * UForm con el esquema; la API vuelve a validar y sus errores por campo se
 * muestran en el mismo sitio.
 */
const props = defineProps<{ project?: Project }>();

const { $projects } = useNuxtApp();
const { language, t } = useAppLocale();
const { refresh: refreshProjects } = useProjects();
const toast = useToast();

// Mismas reglas que CreateProjectDto de la API (nombre ≤ 120, ISO 3166 e ISO 4217).
const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => t('Escribe un nombre.') })
    .max(120, { error: () => t('Usa como máximo 120 caracteres.') }),
  country: z
    .string()
    .trim()
    .transform((code) => code.toUpperCase())
    .refine(isProjectCountry, { error: () => t('Selecciona un país válido.') }),
  currency: z
    .string()
    .trim()
    .transform((code) => code.toUpperCase())
    .refine(isProjectCurrency, {
      error: () => t('Selecciona una moneda válida.'),
    }),
  channelProfile: z.enum(['google_merchant']),
});

type ProjectFormState = z.input<typeof projectSchema>;

const form = useTemplateRef<Form<typeof projectSchema>>('form');
const isEditing = computed(() => props.project !== undefined);
const state = reactive<ProjectFormState>(initialState(props.project));
const countries = computed(() => regionOptions(language.value));
const currencies = computed(() => currencyOptions(language.value));

const channelItems = Object.entries(CHANNEL_PROFILE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const saving = ref(false);
let lastAttempt: { payload: string; key: string } | undefined;

async function onSubmit(event: FormSubmitEvent<ProjectInput>) {
  if (saving.value) return;
  saving.value = true;
  let saved: Project;
  try {
    saved = await save(event.data);
  } catch (error) {
    showSaveError(error);
    return;
  } finally {
    saving.value = false;
  }
  toast.add({
    title: t(isEditing.value ? 'Proyecto actualizado' : 'Proyecto creado'),
    description: saved.name,
    color: 'success',
    icon: 'i-lucide-check',
  });
  void refreshProjects();
  await navigateTo(`/projects/${saved.id}`);
}

function save(input: ProjectInput) {
  if (props.project) return $projects.update(props.project.id, input);
  const payload = JSON.stringify(input);
  if (lastAttempt?.payload !== payload)
    lastAttempt = { payload, key: crypto.randomUUID() };
  return $projects.create(input, lastAttempt.key);
}

function showSaveError(error: unknown) {
  const failure =
    error instanceof ApiFailure
      ? error
      : new ApiFailure(0, t('No pudimos guardar el proyecto.'));

  if (failure.issues.length > 0) {
    form.value?.setErrors(
      failure.issues.map((issue) => ({
        name: issue.field,
        message: issue.message,
      })),
    );
  }
  toast.add({
    title: t('No se guardó el proyecto'),
    description: failure.message,
    color: 'error',
    icon: 'i-lucide-circle-alert',
  });
}

/** Un proyecto sin configurar tiene país, moneda y canal en `null`. */
function initialState(project?: Project): ProjectFormState {
  return {
    name: project?.name ?? '',
    country: project ? (project.country ?? '') : DEFAULT_COUNTRY,
    currency: project ? (project.currency ?? '') : DEFAULT_CURRENCY,
    channelProfile: project?.channelProfile ?? 'google_merchant',
  };
}
</script>

<template>
  <UForm
    ref="form"
    :schema="projectSchema"
    :state="state"
    class="max-w-xl space-y-5"
    @submit="onSubmit"
  >
    <UFormField :label="t('Nombre')" name="name" required>
      <UInput
        v-model="state.name"
        :placeholder="t('Mi tienda')"
        autocomplete="off"
        class="w-full"
      />
    </UFormField>

    <div class="grid gap-5 sm:grid-cols-2">
      <UFormField :label="t('País')" name="country" required>
        <USelectMenu
          v-model="state.country"
          :items="countries"
          value-key="value"
          :placeholder="t('Selecciona un país')"
          class="w-full"
        />
      </UFormField>
      <UFormField :label="t('Moneda')" name="currency" required>
        <USelectMenu
          v-model="state.currency"
          :items="currencies"
          value-key="value"
          :placeholder="t('Selecciona una moneda')"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField :label="t('Canal')" name="channelProfile" required>
      <USelect
        v-model="state.channelProfile"
        :items="channelItems"
        class="w-full"
      />
    </UFormField>

    <div class="flex flex-wrap gap-2 pt-2">
      <UButton type="submit" icon="i-lucide-save" :loading="saving">
        {{ t(isEditing ? 'Guardar cambios' : 'Crear proyecto') }}
      </UButton>
      <UButton
        color="neutral"
        variant="ghost"
        :to="project ? `/projects/${project.id}` : '/projects'"
      >
        {{ t('Cancelar') }}
      </UButton>
    </div>
  </UForm>
</template>

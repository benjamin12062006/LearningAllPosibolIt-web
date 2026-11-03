<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { ApiFailure } from '../services/api-client';
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
const { refresh: refreshProjects } = useProjects();
const toast = useToast();

// Mismas reglas que CreateProjectDto de la API (nombre ≤ 120, ISO 3166 e ISO 4217).
const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe un nombre.')
    .max(120, 'Usa como máximo 120 caracteres.'),
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'Usa el código de 2 letras, por ejemplo BO.')
    .transform((code) => code.toUpperCase()),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, 'Usa el código de 3 letras, por ejemplo BOB.')
    .transform((code) => code.toUpperCase()),
  channelProfile: z.enum(['google_merchant']),
});

type ProjectFormState = z.input<typeof projectSchema>;

const form = useTemplateRef<Form<typeof projectSchema>>('form');
const isEditing = computed(() => props.project !== undefined);
const state = reactive<ProjectFormState>(initialState(props.project));

const channelItems = Object.entries(CHANNEL_PROFILE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

async function onSubmit(event: FormSubmitEvent<ProjectInput>) {
  try {
    const saved = await save(event.data);
    await refreshProjects();
    toast.add({
      title: isEditing.value ? 'Proyecto actualizado' : 'Proyecto creado',
      description: saved.name,
      color: 'success',
      icon: 'i-lucide-check',
    });
    await navigateTo(`/projects/${saved.id}`);
  } catch (error) {
    showSaveError(error);
  }
}

function save(input: ProjectInput) {
  if (props.project) return $projects.update(props.project.id, input);
  return $projects.create(input);
}

function showSaveError(error: unknown) {
  const failure =
    error instanceof ApiFailure
      ? error
      : new ApiFailure(0, 'No pudimos guardar el proyecto.');

  if (failure.issues.length > 0) {
    form.value?.setErrors(
      failure.issues.map((issue) => ({
        name: issue.field,
        message: issue.message,
      })),
    );
  }
  toast.add({
    title: 'No se guardó el proyecto',
    description: failure.message,
    color: 'error',
    icon: 'i-lucide-circle-alert',
  });
}

/** Un proyecto sin configurar tiene país, moneda y canal en `null`. */
function initialState(project?: Project): ProjectFormState {
  return {
    name: project?.name ?? '',
    country: project?.country ?? '',
    currency: project?.currency ?? '',
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
    <UFormField label="Nombre" name="name" required>
      <UInput
        v-model="state.name"
        placeholder="Mi tienda"
        autocomplete="off"
        class="w-full"
      />
    </UFormField>

    <div class="grid gap-5 sm:grid-cols-2">
      <UFormField
        label="País"
        name="country"
        description="Código ISO de 2 letras."
        required
      >
        <UInput
          v-model="state.country"
          placeholder="BO"
          maxlength="2"
          autocomplete="country"
          class="w-full uppercase"
        />
      </UFormField>
      <UFormField
        label="Moneda"
        name="currency"
        description="Código ISO de 3 letras."
        required
      >
        <UInput
          v-model="state.currency"
          placeholder="BOB"
          maxlength="3"
          autocomplete="off"
          class="w-full uppercase"
        />
      </UFormField>
    </div>

    <UFormField label="Canal" name="channelProfile" required>
      <USelect
        v-model="state.channelProfile"
        :items="channelItems"
        class="w-full"
      />
    </UFormField>

    <div class="flex flex-wrap gap-2 pt-2">
      <UButton type="submit" icon="i-lucide-save">
        {{ isEditing ? 'Guardar cambios' : 'Crear proyecto' }}
      </UButton>
      <UButton
        color="neutral"
        variant="ghost"
        :to="project ? `/projects/${project.id}` : '/projects'"
      >
        Cancelar
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import type { ImportDelimiter, ImportUpload } from '../types/imports';

/**
 * Subir un CSV de catálogo. Se avisa antes de enviar de lo que la API
 * rechazaría seguro (extensión y 10 MiB); filas y columnas las valida ella.
 */
const props = defineProps<{ upload: (file: ImportUpload) => Promise<void> }>();

const MAX_FILE_BYTES = 10 * 1024 * 1024; // IMPORT_LIMITS.fileBytes de la API

const DELIMITER_ITEMS: { value: ImportDelimiter; label: string }[] = [
  { value: 'comma', label: 'Coma ( , )' },
  { value: 'semicolon', label: 'Punto y coma ( ; )' },
];

const uploadSchema = z.object({
  file: z
    .custom<File>(isFile, 'Elige un archivo CSV.')
    .refine(hasCsvName, 'El archivo debe terminar en .csv.')
    .refine((file) => file.size <= MAX_FILE_BYTES, 'El archivo supera 10 MB.'),
  idColumn: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de la columna con el identificador.')
    .max(128, 'Usa como máximo 128 caracteres.'),
  delimiter: z.enum(['comma', 'semicolon']),
});

type UploadState = {
  file: File | null | undefined;
  idColumn: string;
  delimiter: ImportDelimiter;
};

const state = reactive<UploadState>(emptyState());

async function onSubmit(event: FormSubmitEvent<ImportUpload>) {
  await props.upload(event.data);
  Object.assign(state, emptyState());
}

function emptyState(): UploadState {
  return { file: undefined, idColumn: 'id', delimiter: 'comma' };
}

function isFile(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

function hasCsvName(file: File) {
  return file.name.toLowerCase().endsWith('.csv');
}
</script>

<template>
  <UForm
    :schema="uploadSchema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField name="file">
      <UFileUpload
        v-model="state.file"
        accept=".csv,text/csv"
        icon="i-lucide-file-spreadsheet"
        label="Arrastra tu CSV aquí"
        description="Hasta 10 MB y 5.000 filas."
        class="min-h-36 w-full"
      />
    </UFormField>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        label="Columna del identificador"
        name="idColumn"
        description="Tal como aparece en la cabecera del CSV."
      >
        <UInput v-model="state.idColumn" autocomplete="off" class="w-full" />
      </UFormField>
      <UFormField label="Separador" name="delimiter">
        <USelect
          v-model="state.delimiter"
          :items="DELIMITER_ITEMS"
          class="w-full"
        />
      </UFormField>
    </div>

    <UButton type="submit" icon="i-lucide-upload">Importar catálogo</UButton>
  </UForm>
</template>

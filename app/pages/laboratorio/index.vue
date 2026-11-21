<script setup lang="ts">
import type { WorksheetColumn } from '../../features/worksheets/types/worksheets';
import type { GridRow } from '../../features/worksheets/utils/draft-overlay';
import {
  EMPTY_LIVE_RUN,
  type LiveRun,
} from '../../features/assistant/utils/run-state';

definePageMeta({ layout: false });

if (!import.meta.dev)
  throw createError({ statusCode: 404, statusMessage: 'Página no encontrada' });

const columns: WorksheetColumn[] = [
  { id: 'name', name: 'Producto', type: 'text', position: 0, required: true },
  { id: 'price', name: 'Precio', type: 'decimal', position: 1, required: true },
  {
    id: 'stock',
    name: 'Existencias',
    type: 'integer',
    position: 2,
    required: false,
  },
  {
    id: 'active',
    name: 'Activo',
    type: 'boolean',
    position: 3,
    required: false,
  },
  {
    id: 'date',
    name: 'Fecha de entrega',
    type: 'date',
    position: 4,
    required: false,
  },
];
const sample: GridRow[] = [
  {
    rowId: '1',
    values: {
      name: 'Lámpara de lectura',
      price: '105.00',
      stock: '12',
      active: true,
      date: '2026-11-14',
    },
    state: 'clean',
    problemColumnIds: new Set(),
    editedColumnIds: new Set(),
  },
  {
    rowId: '2',
    values: {
      name: 'Mesa auxiliar',
      price: '82.25',
      stock: '3',
      active: true,
      date: null,
    },
    state: 'clean',
    problemColumnIds: new Set(),
    editedColumnIds: new Set(),
  },
  {
    rowId: '3',
    values: {
      name: 'Silla de nogal',
      price: null,
      stock: '8',
      active: false,
      date: null,
    },
    state: 'clean',
    problemColumnIds: new Set(['price']),
    editedColumnIds: new Set(),
  },
];
const rows = shallowRef(sample);
const selectedRows = ref<string[]>([]);
const selectedColumns = ref<string[]>([]);
const live = shallowRef<LiveRun>(EMPTY_LIVE_RUN);
const tab = ref<'mcp' | 'cli'>('mcp');
const editor = ref(true);
const measurement = ref('');
const colorMode = useColorMode();
const preferences = usePreferences();
const modes: { label: string; state: LiveRun['state'] }[] = [
  { label: 'Reposo', state: 'idle' },
  { label: 'Pensar', state: 'thinking' },
  { label: 'Leer precio', state: 'reading' },
  { label: 'Preparar cambio', state: 'writing' },
  { label: 'Proponer', state: 'proposing' },
  { label: 'Terminar', state: 'done' },
  { label: 'Pedir aclaración', state: 'question' },
  { label: 'Fallar', state: 'error' },
];

function simulate(state: LiveRun['state']) {
  live.value = {
    ...EMPTY_LIVE_RUN,
    state,
    target: ['reading', 'writing', 'proposing'].includes(state)
      ? { worksheetId: 'demo', columnIds: ['price'] }
      : null,
  };
}

async function measure() {
  measurement.value = '';
  await nextTick();
  const start = performance.now();
  let longestTask = 0;
  const observer = new PerformanceObserver((entries) => {
    for (const task of entries.getEntries())
      longestTask = Math.max(longestTask, task.duration);
  });
  if (PerformanceObserver.supportedEntryTypes.includes('longtask'))
    observer.observe({ type: 'longtask' });
  rows.value = Array.from({ length: 5000 }, (_, index) => {
    const original = sample[index % 3] ?? sample[0];
    if (!original) throw new Error('Faltan filas de ejemplo.');
    return { ...original, rowId: String(index + 1) };
  });
  await nextTick();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const paint = Math.round(performance.now() - start);
      const domRows = document.querySelectorAll(
        '[data-grid-scroll] tbody tr[data-index]',
      ).length;
      setTimeout(() => {
        observer.disconnect();
        measurement.value = `5.000 filas · ${paint} ms hasta el siguiente cuadro visible · ${domRows} filas en el DOM · tarea más larga ${longestTask} ms`;
      }, 200);
    }),
  );
}

function edit(
  edits: { rowId: string; columnId: string; value: string | boolean | null }[],
) {
  const changes = Map.groupBy(edits, (item) => item.rowId);
  rows.value = rows.value.map((row) => {
    const replacements = changes.get(row.rowId);
    if (!replacements) return row;
    const values = { ...row.values };
    const editedColumnIds = new Set(row.editedColumnIds);
    for (const { columnId, value } of replacements) {
      values[columnId] = value;
      editedColumnIds.add(columnId);
    }
    return { ...row, values, editedColumnIds, state: 'edited' };
  });
}
</script>

<template>
  <main class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
    <header>
      <h1 class="text-3xl font-semibold">Laboratorio de interfaz</h1>
      <p class="mt-1 text-muted">Hoja de ejemplo, asistente e integraciones.</p>
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          @click="
            colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
          "
        >
          {{ colorMode.value === 'dark' ? 'Tema claro' : 'Tema oscuro' }}
        </UButton>
        <UButton
          color="neutral"
          variant="soft"
          @click="
            preferences.setMotion(
              preferences.hasLessMotion.value ? 'full' : 'reduced',
            )
          "
          >Cambiar movimiento</UButton
        >
        <UCheckbox v-model="editor" label="Permitir edición" />
      </div>
    </header>

    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <section class="min-w-0 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="me-auto text-xl font-semibold">Hoja de productos</h2>
          <UButton size="sm" variant="soft" @click="measure"
            >Medir 5.000 filas</UButton
          >
          <UButton
            v-if="rows.length > 3"
            size="sm"
            variant="ghost"
            @click="rows = sample"
            >Restablecer</UButton
          >
        </div>
        <p v-if="measurement" role="status" class="text-sm text-muted">
          {{ measurement }}
        </p>
        <div
          data-assistant-sheet="demo"
          class="rounded-lg border border-default"
        >
          <WorksheetsGrid
            v-model:selected-rows="selectedRows"
            v-model:selected-columns="selectedColumns"
            :rows="rows"
            :columns="columns"
            :operation-budget="1000"
            :can-edit="editor"
            :marked-columns="live.state === 'reading' ? ['price'] : []"
            :proposed-columns="
              ['writing', 'proposing'].includes(live.state) ? ['price'] : []
            "
            @edit="edit"
          />
        </div>
      </section>
      <section
        id="mascota"
        class="space-y-3 rounded-lg border border-default p-4"
      >
        <h2 class="text-xl font-semibold">Mascota</h2>
        <AssistantMascot :live="live" />
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="mode in modes"
            :key="mode.state"
            size="xs"
            :variant="live.state === mode.state ? 'solid' : 'soft'"
            @click="simulate(mode.state)"
            >{{ mode.label }}</UButton
          >
        </div>
      </section>
    </div>

    <section class="max-w-3xl space-y-2">
      <h2 class="text-xl font-semibold">Integraciones</h2>
      <IntegrationsSetupGuide
        v-model:tab="tab"
        :scope="{ organizationId: 'demostracion', projectId: 'demostracion' }"
        project-name="Demostración"
        oauth-resource-url="https://example.invalid/mcp"
      />
    </section>
  </main>
</template>

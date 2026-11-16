<script setup lang="ts">
import type { ProjectScope } from '../../../projects/types/project-scope';
import type { ChangesetSummary } from '../../types/changesets';
import { CHANGESET_STATUS_LABELS } from '../../types/changesets';
import type {
  WorksheetExport,
  WorksheetImportSummary,
} from '../../types/worksheet-transfers';
import {
  REVISION_SOURCE_LABELS,
  type Page,
  type RevisionEntry,
} from '../../types/worksheets';
import { saveBlob } from '../../../../utils/download';

const { t } = useAppLocale();

type HistoryTab = 'revisions' | 'drafts' | 'imports' | 'exports';

const props = defineProps<{
  scope: ProjectScope;
  worksheetId: string;
  canWrite: boolean;
  refreshKey: number;
  name: string;
}>();
const emit = defineEmits<{
  selectDraft: [id: string];
  selectRevision: [id: string];
  openDraft: [id: string];
}>();
const { $worksheets, $changesets, $worksheetTransfers } = useNuxtApp();
const { run, isRunning } = useAction();
const tab = ref<HistoryTab>('revisions');
const limit = 15;
const offset = ref(0);
const tabs = [
  { value: 'revisions', label: 'Revisiones' },
  { value: 'drafts', label: 'Borradores' },
  { value: 'imports', label: t('Importaciones') },
  { value: 'exports', label: 'Exportaciones' },
] satisfies { value: HistoryTab; label: string }[];

type HistoryResult =
  | { kind: 'revisions'; data: Page<RevisionEntry> }
  | { kind: 'drafts'; data: Page<ChangesetSummary> }
  | { kind: 'imports'; data: Page<WorksheetImportSummary> }
  | { kind: 'exports'; data: Page<WorksheetExport> };

const { data, status, error, refresh } = useAsyncData<HistoryResult>(
  () =>
    `sheet-history:${props.scope.projectId}:${props.worksheetId}:${tab.value}:${offset.value}`,
  readHistory,
  { server: false, watch: [() => props.refreshKey] },
);

function selectTab(value: HistoryTab) {
  offset.value = 0;
  tab.value = value;
}

async function readHistory(): Promise<HistoryResult> {
  const query = { limit, offset: offset.value };
  const { scope, worksheetId } = props;
  switch (tab.value) {
    case 'revisions':
      return {
        kind: 'revisions',
        data: await $worksheets.revisions(scope, worksheetId, query),
      };
    case 'drafts':
      return {
        kind: 'drafts',
        data: await $changesets.list(scope, worksheetId, query),
      };
    case 'imports':
      return {
        kind: 'imports',
        data: await $worksheetTransfers.imports(scope, worksheetId, query),
      };
    case 'exports':
      return {
        kind: 'exports',
        data: await $worksheetTransfers.exports(scope, worksheetId, query),
      };
  }
}

async function revert(revisionId: string) {
  const result = await run(t('No se preparó la vuelta atrás'), () =>
    $changesets.proposeRevert(props.scope, revisionId),
  );
  if (result) emit('openDraft', result.changeset.id);
}

async function download(record: WorksheetExport) {
  const blob = await run(t('No se pudo descargar el archivo'), () =>
    $worksheetTransfers.downloadExport(props.scope, record.id),
  );
  if (blob)
    saveBlob(
      blob,
      `${props.name}-r${record.revisionSequence}.${record.format}`,
    );
}
</script>

<template>
  <UiTabs
    :model-value="tab"
    :items="tabs"
    :label="$t('Historial de la hoja')"
    @update:model-value="selectTab"
  >
    <template v-for="item in tabs" :key="item.value" #[item.value]>
      <USkeleton v-if="status === 'pending'" class="h-24" />
      <UAlert
        v-else-if="error"
        color="error"
        :title="error.message"
        :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
      />
      <p v-else-if="!data?.data.items.length" class="text-sm text-muted">
        {{ $t('Todavía no hay registros.') }}
      </p>
      <ul v-else class="divide-y divide-default text-sm">
        <template v-if="data.kind === 'revisions'">
          <li
            v-for="record in data.data.items"
            :key="record.id"
            class="space-y-2 py-3"
          >
            <p class="font-medium">
              {{ $t('Revisión') }} {{ record.sequence }} ·
              {{ $t(REVISION_SOURCE_LABELS[record.source]) }}
            </p>
            <p class="text-muted">
              {{ record.rowCount }} {{ $t('filas ·') }}
              {{ record.createdAt.slice(0, 10) }}
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                size="xs"
                variant="soft"
                @click="emit('selectRevision', record.id)"
                >{{ $t('Ver revisión') }}</UButton
              >
              <UButton
                v-if="record.changesetId"
                size="xs"
                variant="ghost"
                @click="emit('selectDraft', record.changesetId)"
                >{{ $t('Ver borrador') }}</UButton
              >
              <UButton
                v-if="canWrite && record.changesetId"
                size="xs"
                variant="ghost"
                :loading="isRunning"
                @click="revert(record.id)"
                >{{ $t('Proponer reversión') }}</UButton
              >
            </div>
          </li>
        </template>
        <template v-if="data.kind === 'drafts'">
          <li v-for="record in data.data.items" :key="record.id" class="py-3">
            <UButton
              variant="link"
              class="px-0"
              @click="emit('selectDraft', record.id)"
              >{{ record.title }}</UButton
            >
            <p class="text-muted">
              {{ $t(CHANGESET_STATUS_LABELS[record.status]) }} ·
              {{ record.operationCount }} {{ $t('operaciones') }}
            </p>
          </li>
        </template>
        <template v-if="data.kind === 'imports'">
          <li v-for="record in data.data.items" :key="record.id" class="py-3">
            <p>
              {{ record.format.toUpperCase() }} · {{ record.report.rows }}
              {{ $t('filas ·') }} {{ record.createdAt.slice(0, 10) }}
            </p>
            <p class="text-muted">
              {{ record.report.inserted }} {{ $t('nuevas ·') }}
              {{ record.report.updated }} {{ $t('actualizadas ·') }}
              {{ record.report.invalid }} {{ $t('inválidas') }}
            </p>
            <UButton
              variant="link"
              class="px-0"
              @click="emit('selectDraft', record.changesetId)"
              >{{ $t('Abrir borrador') }}</UButton
            >
          </li>
        </template>
        <template v-if="data.kind === 'exports'">
          <li
            v-for="record in data.data.items"
            :key="record.id"
            class="flex items-center justify-between gap-2 py-3"
          >
            <p>
              {{ record.format.toUpperCase() }} {{ $t('· Revisión') }}
              {{ record.revisionSequence }} · {{ record.rowCount }}
              {{ $t('filas') }}
            </p>
            <UButton
              size="xs"
              variant="soft"
              icon="i-lucide-download"
              :loading="isRunning"
              @click="download(record)"
              >{{ $t('Descargar') }}</UButton
            >
          </li>
        </template>
      </ul>
      <div v-if="offset || data?.data.page.hasMore" class="mt-3 flex gap-2">
        <UButton
          variant="soft"
          size="sm"
          :disabled="offset === 0 || status === 'pending'"
          @click="offset -= limit"
          >{{ $t('Anterior') }}</UButton
        >
        <UButton
          variant="soft"
          size="sm"
          :disabled="!data?.data.page.hasMore || status === 'pending'"
          @click="offset += limit"
          >{{ $t('Siguiente') }}</UButton
        >
      </div>
    </template>
  </UiTabs>
</template>

<script setup lang="ts">
import { useWorksheetWorkspace } from '../composables/useWorksheetWorkspace';
import { MAX_OPERATIONS } from '../types/changesets';
import { isArchivedWorksheet, WORKSHEET_LIMITS } from '../types/worksheets';
import { useAssistantWorkspace } from '../../assistant/composables/useAssistantWorkspace';

const {
  projectId,
  worksheetId,
  project,
  worksheet,
  workbookLink,
  status,
  loadError,
  retry,
  scope,
  canExport,
  canWrite,
  canApprove,
  draft,
  draftId,
  historicalRevision,
  revisionId,
  isAuthor,
  canEdit,
  loadingDraft,
  draftError,
  safeDraftVersion,
  dirty,
  saving,
  busy,
  stale,
  operations,
  history,
  save,
  undo,
  loadDraft,
  discardLocalChanges,
  createDraft,
  selectDraft,
  selectRevision,
  refreshAfterReview,
  refreshAfterApply,
  draftTitleOpen,
  panel,
  panelOpen,
  panelTitles,
  refreshKey,
  isRunning,
  views,
  selectedView,
  activeView,
  query,
  viewsError,
  savingView,
  refreshViews,
  applyQuery,
  selectView,
  saveView,
  deleteView,
  rows,
  gridRows,
  officialColumns,
  shownColumns,
  pending,
  rowsError,
  cursor,
  loadRows,
  applyEdits,
  insertRow,
  deleteDraftRow,
  restoreDraftRow,
  showSchema,
  changeSchema,
  draftColumns,
  mappedColumns,
  assistantBusy,
  chatOpen,
  mobileView,
  selectionLabel,
  markedColumns,
  proposedColumns,
  selectedRows,
  selectedColumns,
  chatContext,
  locateColumn,
} = useWorksheetWorkspace();

const assistant = useAssistantWorkspace();
const assistantDock = useTemplateRef<HTMLElement>('assistantDock');
const placement = {
  worksheetId: worksheetId.value,
  element: assistantDock,
  selectionLabel,
  context: chatContext,
  locate: locateColumn,
};
onMounted(() => {
  assistant.worksheet.value = placement;
});
onBeforeUnmount(() => {
  if (assistant.worksheet.value === placement)
    assistant.worksheet.value = undefined;
});
</script>

<template>
  <div class="contents">
    <LayoutDataSpace
      id="worksheet"
      v-model:chat-open="chatOpen"
      v-model:mobile-view="mobileView"
      :is-chat-busy="assistantBusy"
      :crumbs="[
        { label: project?.name ?? 'Proyecto', to: `/projects/${projectId}` },
        { label: 'Hojas', to: workbookLink },
        { label: worksheet?.name ?? 'Hoja' },
      ]"
    >
      <template #status>
        <UBadge
          v-if="worksheet && isArchivedWorksheet(worksheet)"
          color="neutral"
          variant="subtle"
          >{{ $t('Archivada') }}</UBadge
        >
        <UBadge
          v-else-if="draft"
          color="primary"
          variant="subtle"
          class="max-sm:hidden"
          >{{ $t('Borrador') }}</UBadge
        >
      </template>
      <template #toolbar>
        <template v-if="worksheet">
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-list-filter"
            @click="panel = 'query'"
            >{{ $t('Vistas') }}</UButton
          >
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-history"
            @click="panel = 'history'"
            >{{ $t('Historial') }}</UButton
          >
          <UButton
            v-if="canWrite && !draftId && !historicalRevision"
            size="sm"
            icon="i-lucide-pencil"
            :loading="isRunning"
            @click="draftTitleOpen = true"
            >{{ $t('Nuevo borrador') }}</UButton
          >
          <UButton
            v-if="draft"
            size="sm"
            variant="soft"
            icon="i-lucide-list-checks"
            @click="panel = 'review'"
            >{{ $t('Revisar') }}</UButton
          >
          <UButton
            v-if="historicalRevision || draftId"
            size="sm"
            color="neutral"
            variant="ghost"
            :disabled="saving"
            @click="selectRevision()"
            >{{ $t('Volver a la hoja') }}</UButton
          >
          <UButton
            v-if="canWrite && !draftId && !historicalRevision"
            size="sm"
            variant="ghost"
            color="neutral"
            icon="i-lucide-file-up"
            @click="panel = 'import'"
            >{{ $t('Importar') }}</UButton
          >
          <UButton
            v-if="canExport || canWrite"
            size="sm"
            variant="ghost"
            color="neutral"
            icon="i-lucide-download"
            @click="panel = 'transfer'"
            >{{ $t('Exportar') }}</UButton
          >
          <template v-if="canEdit">
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-plus"
              :disabled="gridRows.length >= WORKSHEET_LIMITS.rowsPerWorksheet"
              @click="insertRow"
              >{{ $t('Fila') }}</UButton
            >
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-columns-2"
              :loading="isRunning"
              @click="showSchema"
              >{{ $t('Columnas') }}</UButton
            >
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-undo-2"
              :disabled="!history.length"
              @click="undo"
              >{{ $t('Deshacer') }}</UButton
            >
          </template>
        </template>
      </template>
      <template v-if="scope && worksheet" #chat>
        <div ref="assistantDock" class="flex min-h-0 min-w-0 flex-1" />
      </template>
      <template #aside>
        <div class="space-y-3 p-3">
          <UButton
            :to="workbookLink"
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            >{{ $t('Todos los libros') }}</UButton
          >
          <h2 class="text-sm font-semibold">{{ $t('Vistas guardadas') }}</h2>
          <UButton
            v-for="view in views"
            :key="view.id"
            class="w-full"
            :variant="selectedView === view.id ? 'soft' : 'ghost'"
            color="neutral"
            @click="selectView(view.id)"
            >{{ view.name }}</UButton
          >
          <UAlert
            v-if="viewsError"
            color="error"
            variant="subtle"
            :title="$t('No se pudieron cargar las vistas')"
            :actions="[{ label: 'Reintentar', onClick: () => refreshViews() }]"
          />
          <p v-else-if="!views.length" class="text-sm text-muted">
            {{ $t('Todavía no hay vistas.') }}
          </p>
        </div>
      </template>
      <div v-if="loadError" class="p-4">
        <UAlert
          color="error"
          :title="loadError.message"
          :actions="[{ label: 'Reintentar', onClick: retry }]"
        />
      </div>
      <div
        v-else-if="
          !worksheet || (status === 'pending' && !rows.length) || loadingDraft
        "
        class="space-y-2 p-4"
      >
        <USkeleton v-for="index in 8" :key="index" class="h-8" />
      </div>
      <template v-else>
        <div v-if="draftError || rowsError" class="space-y-2 p-3">
          <UAlert
            v-if="draftError"
            color="warning"
            :title="draftError"
            :actions="
              stale
                ? [
                    {
                      label: 'Abrir versión del servidor',
                      onClick: discardLocalChanges,
                    },
                  ]
                : [
                    {
                      label: 'Reintentar',
                      onClick: () => (dirty ? save() : loadDraft()),
                    },
                  ]
            "
          />
          <UAlert
            v-if="rowsError"
            color="error"
            :title="rowsError"
            :actions="[{ label: 'Reintentar', onClick: () => loadRows() }]"
          />
        </div>
        <div
          v-if="draft || historicalRevision"
          class="flex gap-2 border-b border-default px-3 py-2 text-sm"
          role="status"
        >
          <span v-if="historicalRevision">{{
            $t('Mostrando una revisión histórica')
          }}</span>
          <span v-else-if="saving">{{ $t('Guardando…') }}</span>
          <span v-else-if="dirty">{{ $t('Cambios por guardar') }}</span>
          <span v-else-if="safeDraftVersion">{{
            $t('Borrador guardado')
          }}</span>
          <UButton
            v-if="dirty && !stale"
            size="xs"
            variant="ghost"
            :disabled="busy && saving"
            @click="save"
            >{{ $t('Guardar ahora') }}</UButton
          >
          <span v-if="canEdit" class="text-muted">{{
            $t('· Cálculos de vista previa')
          }}</span>
        </div>
        <div v-if="pending && !rows.length" class="space-y-2 p-4">
          <USkeleton v-for="index in 8" :key="index" class="h-8" />
        </div>
        <div
          v-else-if="gridRows.length && shownColumns.length"
          :data-assistant-sheet="worksheetId"
          class="w-full max-w-full"
        >
          <WorksheetsGrid
            v-model:selected-rows="selectedRows"
            v-model:selected-columns="selectedColumns"
            :rows="gridRows"
            :columns="shownColumns"
            :can-edit="canEdit"
            :operation-budget="MAX_OPERATIONS - operations.length"
            :marked-columns="markedColumns"
            :proposed-columns="proposedColumns"
            @edit="applyEdits"
            @undo="undo"
            @delete-row="deleteDraftRow"
            @restore-row="restoreDraftRow"
          />
        </div>
        <UEmpty
          v-else-if="!rowsError"
          icon="i-lucide-table-2"
          :title="
            shownColumns.length
              ? $t('No hay filas en esta vista')
              : $t('Aún no hay columnas visibles')
          "
        />
        <div v-if="cursor" class="p-3">
          <UButton variant="soft" :loading="pending" @click="loadRows(true)">{{
            $t('Cargar más filas')
          }}</UButton>
        </div>
      </template>
    </LayoutDataSpace>

    <WorksheetsNameDialog
      v-model:open="draftTitleOpen"
      :title="$t('Nuevo borrador')"
      submit-label="Crear borrador"
      :is-saving="isRunning"
      @submit="createDraft"
    />
    <UiSidePanel
      v-model:open="panelOpen"
      :title="panel ? panelTitles[panel] : ''"
    >
      <template v-if="scope && worksheet && panel">
        <WorksheetsRowQuery
          v-if="panel === 'query'"
          :columns="officialColumns"
          :query="query"
          :views="views"
          :active-view="activeView"
          :can-share="canWrite"
          :busy="savingView"
          @apply="applyQuery"
          @select="selectView"
          @save="saveView"
          @remove="deleteView"
        />
        <WorksheetsHistory
          v-else-if="panel === 'history'"
          :scope="scope"
          :worksheet-id="worksheetId"
          :can-write="canWrite"
          :refresh-key="refreshKey"
          :name="worksheet.name"
          @select-draft="selectDraft"
          @open-draft="selectDraft"
          @select-revision="selectRevision"
        />
        <WorksheetsDraftReview
          v-else-if="panel === 'review' && draft"
          :scope="scope"
          :draft="draft"
          :can-write="canWrite"
          :can-approve="canApprove"
          :is-author="isAuthor"
          :has-unsaved-changes="dirty"
          @changed="refreshAfterReview"
          @applied="refreshAfterApply"
        />
        <LazyWorksheetsImportWizard
          v-else-if="panel === 'import' && canWrite"
          :scope="scope"
          :worksheet-id="worksheetId"
          :columns="officialColumns"
          @imported="selectDraft"
        />
        <WorksheetsTransfers
          v-else-if="panel === 'transfer' && revisionId"
          :scope="scope"
          :worksheet="worksheet"
          :revision-id="revisionId"
          :query="query"
          :can-export="canExport"
          :can-publish="canWrite"
          @exported="refreshKey++"
        />
        <WorksheetsSchemaEditor
          v-else-if="panel === 'schema' && canEdit"
          :columns="draftColumns"
          :mapped-columns="mappedColumns"
          @change="changeSchema"
        />
      </template>
    </UiSidePanel>
  </div>
</template>

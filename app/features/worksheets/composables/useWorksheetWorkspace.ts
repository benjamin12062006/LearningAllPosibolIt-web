import { useAccess } from '../../access/composables/useAccess';
import { useProjectScope } from '../../projects/composables/useProjectScope';
import { useProject } from '../../projects/composables/useProjects';
import { useWorksheetDraft } from './useWorksheetDraft';
import { useWorksheetRows } from './useWorksheetRows';
import { useWorksheetViews } from './useWorksheetViews';
import { etagOf } from '../services/changesets';
import type { RowsRequest } from '../services/worksheets';
import type { SchemaOperation } from '../types/changesets';
import { useWorksheetAssistant } from './useWorksheetAssistant';
import {
  isArchivedWorksheet,
  type RowQuery,
  type SavedView,
  type ViewVisibility,
} from '../types/worksheets';
import {
  columnsWithDraft,
  rowsWithDraft,
  withCellEdit,
  withDeletedRow,
  withInsertedRow,
  withRestoredRow,
  withSchemaOperation,
  type CellEdit,
  type GridRow,
} from '../utils/draft-overlay';

export function useWorksheetWorkspace() {
  const route = useRoute();
  const router = useRouter();
  const { $worksheets, $changesets, $worksheetTransfers } = useNuxtApp();
  const { state } = useAccess();
  const { run, isRunning } = useAction();
  const toast = useToast();
  const projectId = computed(() => String(route.params.id));
  const worksheetId = computed(() => String(route.params.worksheetId));
  const draftId = computed(() =>
    typeof route.query.draft === 'string' ? route.query.draft : null,
  );
  const historicalRevision = computed(() =>
    typeof route.query.revision === 'string' ? route.query.revision : null,
  );
  const { project } = useProject(projectId);
  const {
    scope,
    can,
    error: accessError,
    refresh: refreshAccess,
  } = useProjectScope(projectId);
  const {
    data,
    status,
    error: worksheetError,
    refresh: refreshWorksheet,
  } = useAsyncData(
    () => `worksheet:${projectId.value}:${worksheetId.value}`,
    () =>
      scope.value
        ? $worksheets.find(scope.value, worksheetId.value)
        : Promise.resolve(null),
    { server: false, watch: [scope] },
  );
  const worksheet = computed(() => data.value?.worksheet);
  const loadError = computed(() => accessError.value ?? worksheetError.value);
  const workbookLink = computed(() => `/projects/${projectId.value}/workbooks`);
  const canWrite = computed(
    () =>
      !!data.value?.capabilities.write &&
      !!worksheet.value &&
      !isArchivedWorksheet(worksheet.value),
  );
  const canApprove = computed(
    () =>
      !!data.value?.capabilities.approve &&
      !!worksheet.value &&
      !isArchivedWorksheet(worksheet.value),
  );
  const canExport = computed(() => can('organization.read'));
  const {
    views,
    selectedView,
    activeView,
    query,
    error: viewsError,
    isRunning: savingView,
    refresh: refreshViews,
    applyQuery: applyRowsQuery,
    selectView: selectSavedView,
    saveView: writeView,
    deleteView: removeView,
  } = useWorksheetViews(scope, worksheetId);
  const {
    version,
    operations,
    history,
    error: draftError,
    loading: loadingDraft,
    saving,
    stale,
    dirty,
    replace,
    undo,
    save,
    load: loadDraft,
    openServerVersion,
  } = useWorksheetDraft(scope, worksheetId, draftId);
  const draft = computed(() => version.value?.changeset);
  const isAuthor = computed(
    () =>
      state.value.status === 'ready' &&
      state.value.user.id === draft.value?.authorId,
  );
  const canEdit = computed(
    () =>
      canWrite.value &&
      draft.value?.status === 'draft' &&
      isAuthor.value &&
      !stale.value,
  );
  const editingRevision = computed(() =>
    draft.value?.status === 'draft' ? draft.value.baseRevisionId : null,
  );
  const revisionId = computed(
    () =>
      editingRevision.value ??
      historicalRevision.value ??
      worksheet.value?.headRevision.id,
  );
  const rowsRequest = computed<RowsRequest | null>(() => {
    if (!revisionId.value || loadingDraft.value) return null;
    if (activeView.value && !editingRevision.value)
      return { revisionId: revisionId.value, viewId: activeView.value.id };
    return {
      ...query.value,
      revisionId: revisionId.value,
      columns: editingRevision.value ? undefined : query.value.columns,
    };
  });
  const {
    rows,
    cursor,
    pending,
    error: rowsError,
    load: loadRows,
  } = useWorksheetRows(scope, worksheetId, rowsRequest);
  const officialColumns = computed(() => worksheet.value?.columns ?? []);
  const {
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
  } = useWorksheetAssistant(
    scope,
    worksheetId,
    revisionId,
    officialColumns,
    rows,
  );
  const draftOperations = computed(() =>
    editingRevision.value ? operations.value : [],
  );
  const draftColumns = computed(() =>
    columnsWithDraft(officialColumns.value, draftOperations.value),
  );
  const shownColumns = computed(() => {
    const ids = query.value.columns;
    if (!ids) return draftColumns.value;
    const byId = new Map(
      draftColumns.value.map((column) => [column.id, column]),
    );
    return ids.flatMap((id) => {
      const column = byId.get(id);
      return column ? [column] : [];
    });
  });
  const previousRows = new WeakMap<object, GridRow>();
  const gridRows = computed(() => {
    const previous = new Map<string, GridRow>();
    for (const row of rows.value) {
      const cached = previousRows.get(row);
      if (cached) previous.set(row.rowId, cached);
    }
    const result = rowsWithDraft(
      rows.value,
      draftOperations.value,
      draftColumns.value,
      previous,
    );
    result.forEach((row, index) => {
      const original = rows.value[index];
      if (original && row.state === 'clean') previousRows.set(original, row);
    });
    return result;
  });
  const baseRows = computed(
    () => new Map(rows.value.map((row) => [row.rowId, row])),
  );
  type Panel =
    'query' | 'history' | 'review' | 'import' | 'transfer' | 'schema';
  const panel = ref<Panel | null>(null);
  onMounted(() => {
    if (draftId.value) panel.value = 'review';
    else if (route.query.panel === 'history') panel.value = 'history';
  });
  watch(
    () => route.query.panel,
    (value) => {
      if (value === 'history' && !draftId.value) panel.value = 'history';
    },
  );
  const panelOpen = computed({
    get: () => !!panel.value,
    set: (open: boolean) => {
      if (!open) panel.value = null;
    },
  });
  const panelTitles: Record<Panel, string> = {
    query: 'Filtros y vistas',
    history: 'Historial de la hoja',
    review: 'Revisar borrador',
    import: 'Importar a la hoja',
    transfer: 'Exportar y llevar al catálogo',
    schema: 'Columnas del borrador',
  };
  const refreshKey = ref(0);
  const mappedColumns = shallowRef(new Set<string>());
  const busy = computed(() => dirty.value || saving.value || isRunning.value);

  watch(rowsRequest, () => {
    selectedRows.value = [];
    selectedColumns.value = [];
  });
  watch(
    [views, () => route.query.view],
    ([available, id]) => {
      if (
        typeof id === 'string' &&
        selectedView.value !== id &&
        available.some((view) => view.id === id)
      )
        selectView(id);
    },
    { immediate: true },
  );
  watch(draftId, (id) => {
    if (id) panel.value = 'review';
  });
  onBeforeRouteLeave(() => canLeaveDraft());
  onBeforeRouteUpdate(
    (to, from) =>
      (to.query.draft === from.query.draft &&
        to.query.revision === from.query.revision) ||
      canLeaveDraft(),
  );

  function canLeaveDraft() {
    return (
      !dirty.value ||
      window.confirm(
        'Hay cambios que aún no se guardaron. ¿Salir de todos modos?',
      )
    );
  }

  function applyQuery(next: RowQuery) {
    applyRowsQuery(next);
    panel.value = null;
  }

  function selectView(id: string) {
    selectSavedView(id);
    panel.value = null;
  }

  async function saveView(
    name: string,
    visibility: ViewVisibility,
    rowQuery: RowQuery,
    existing?: SavedView,
  ) {
    if (await writeView(name, visibility, rowQuery, existing))
      panel.value = null;
  }

  async function deleteView(view: SavedView) {
    if (await removeView(view)) panel.value = null;
  }

  async function createDraft(title: string) {
    const current = scope.value;
    if (!current || !canWrite.value) return;
    const created = await run('No se creó el borrador', () =>
      $changesets.create(current, worksheetId.value, title),
    );
    if (created) {
      draftTitleOpen.value = false;
      refreshKey.value++;
      await selectDraft(created.changeset.id);
      panel.value = null;
    }
  }

  function selectDraft(id: string) {
    if (draftId.value === id) {
      panel.value = 'review';
      return;
    }
    return router.push({
      query: { ...route.query, draft: id, revision: undefined },
    });
  }

  function selectRevision(id?: string) {
    panel.value = null;
    return router.push({
      query: { ...route.query, draft: undefined, revision: id },
    });
  }

  function applyEdits(edits: CellEdit[]) {
    let next = operations.value;
    for (const edit of edits) {
      const base =
        baseRows.value.get(edit.rowId)?.values[edit.columnId] ?? null;
      next = withCellEdit(next, edit, base);
    }
    replace(next);
  }

  async function showSchema() {
    const current = scope.value;
    if (!current) return;
    const templates = await run('No se pudieron consultar las plantillas', () =>
      $worksheetTransfers.importMappings(current, worksheetId.value, {
        limit: 100,
        offset: 0,
      }),
    );
    if (!templates) return;
    const affected = new Set<string>();
    for (const { mapping } of templates.items) {
      if (mapping.matchColumnId) affected.add(mapping.matchColumnId);
      for (const entry of mapping.columns)
        if ('columnId' in entry) affected.add(entry.columnId);
    }
    mappedColumns.value = affected;
    panel.value = 'schema';
  }

  function insertRow() {
    replace(withInsertedRow(operations.value, crypto.randomUUID()));
  }

  function discardLocalChanges() {
    if (window.confirm('¿Descartar los cambios locales?')) openServerVersion();
  }

  function changeSchema(operation: SchemaOperation) {
    replace(withSchemaOperation(operations.value, operation));
    if (operation.type === 'add_column' && query.value.columns) {
      query.value = {
        ...query.value,
        columns: [...query.value.columns, operation.columnId],
      };
    }
    panel.value = null;
  }

  async function refreshAfterReview() {
    refreshKey.value++;
    await Promise.all([loadDraft(), refreshWorksheet()]);
  }

  async function refreshAfterApply() {
    await selectRevision();
    await refreshAfterReview();
    await loadRows();
    toast.add({ title: 'Borrador aplicado', color: 'success' });
  }

  async function retry() {
    if (accessError.value) await refreshAccess();
    await refreshWorksheet();
  }

  const safeDraftVersion = computed(
    () =>
      version.value?.etag ??
      (draft.value ? etagOf(draft.value.draftVersion) : ''),
  );
  const draftTitleOpen = ref(false);

  function deleteDraftRow(rowId: string) {
    replace(withDeletedRow(operations.value, rowId));
  }

  function restoreDraftRow(rowId: string) {
    replace(withRestoredRow(operations.value, rowId));
  }

  return {
    projectId,
    worksheetId,
    project,
    worksheet,
    workbookLink,
    status,
    loadError,
    retry,
    scope,
    can,
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
  };
}

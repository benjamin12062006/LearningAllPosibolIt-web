import { ApiFailure } from '../../../services/api-client';
import type { RunContext } from '../../assistant/services/assistant';
import { useAssistantWorkspace } from '../../assistant/composables/useAssistantWorkspace';
import type { ProjectScope } from '../../projects/types/project-scope';
import type { RowItem, WorksheetColumn } from '../types/worksheets';

export function useWorksheetAssistant(
  scope: Ref<ProjectScope | null>,
  worksheetId: Ref<string>,
  revisionId: Ref<string | undefined>,
  officialColumns: Ref<WorksheetColumn[]>,
  rows: Ref<RowItem[]>,
) {
  const { $assistant } = useNuxtApp();
  const {
    busy: assistantBusy,
    live: assistantLive,
    open: chatOpen,
  } = useAssistantWorkspace();
  const currentView = ref<'main' | 'detail'>('main');
  const mobileView = computed({
    get: () => (chatOpen.value ? ('chat' as const) : currentView.value),
    set: (view: 'main' | 'chat' | 'detail') => {
      if (view !== 'chat') currentView.value = view;
      chatOpen.value = view === 'chat';
    },
  });
  const selectedRows = ref<string[]>([]);
  const selectedColumns = ref<string[]>([]);
  const selectedOfficialColumns = computed(() => {
    const visibleIds = new Set(selectedColumns.value);
    return officialColumns.value
      .filter((column) => visibleIds.has(column.id))
      .map((column) => column.id);
  });
  const selectionLabel = computed(() => {
    if (!selectedRows.value.length && !selectedOfficialColumns.value.length)
      return '';
    return `${selectedRows.value.length || 'Filas cargadas'} · ${selectedOfficialColumns.value.length || 'Todas las'} columnas en el contexto`;
  });
  const markedColumns = computed(() =>
    assistantLive.value.target?.worksheetId === worksheetId.value &&
    assistantLive.value.state === 'reading'
      ? assistantLive.value.target.columnIds
      : [],
  );
  const proposedColumns = computed(() => {
    if (!['writing', 'proposing'].includes(assistantLive.value.state))
      return [];
    const target = assistantLive.value.target;
    return target?.worksheetId === worksheetId.value ? target.columnIds : [];
  });
  async function chatContext(): Promise<RunContext | undefined> {
    const current = scope.value;
    const currentRevision = revisionId.value;
    const context = {
      worksheetId: worksheetId.value,
      revisionId: currentRevision,
    };
    if (!current || !currentRevision) return context;
    if (!selectedRows.value.length && !selectedOfficialColumns.value.length)
      return context;
    const rowIds = selectedRows.value.length
      ? selectedRows.value
      : rows.value.map((row) => row.rowId);
    if (rowIds.length > 200)
      throw new ApiFailure(
        400,
        'Selecciona hasta 200 filas para el contexto del asistente.',
      );
    if (!rowIds.length) return context;
    const columnIds = selectedOfficialColumns.value.length
      ? selectedOfficialColumns.value
      : officialColumns.value.map((column) => column.id);
    const selectionId = await $assistant.selection(
      current,
      worksheetId.value,
      currentRevision,
      columnIds,
      { kind: 'selectedRows', rowIds },
    );
    return { ...context, selectionId };
  }

  function locateColumn(id?: string) {
    if (!id) return;
    document
      .querySelector(`[data-ai-anchor="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  return {
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

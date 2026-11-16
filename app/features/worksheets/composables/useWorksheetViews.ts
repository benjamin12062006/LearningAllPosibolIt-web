import type { ProjectScope } from '../../projects/types/project-scope';
import type { RowQuery, SavedView, ViewVisibility } from '../types/worksheets';

export function useWorksheetViews(
  scope: Ref<ProjectScope | null>,
  worksheetId: Ref<string>,
) {
  const { $worksheets } = useNuxtApp();
  const { run, isRunning } = useAction();
  const { data, error, refresh } = useAsyncData(
    () => `views:${scope.value?.projectId ?? 'pending'}:${worksheetId.value}`,
    () =>
      scope.value
        ? $worksheets.savedViews(scope.value, worksheetId.value, {
            limit: 100,
            offset: 0,
          })
        : Promise.resolve(null),
    { server: false },
  );
  const views = computed(() => data.value?.items ?? []);
  const selectedView = ref('');
  const activeView = computed(() =>
    views.value.find((view) => view.id === selectedView.value),
  );
  const query = shallowRef<RowQuery>({});

  function applyQuery(next: RowQuery) {
    selectedView.value = '';
    query.value = next;
  }

  function selectView(id: string) {
    selectedView.value = id;
    query.value = activeView.value?.query ?? {};
  }

  async function saveView(
    name: string,
    visibility: ViewVisibility,
    rowQuery: RowQuery,
    existing?: SavedView,
  ) {
    const current = scope.value;
    if (!current) return false;
    const input = { name, visibility, query: rowQuery };
    const saved = await run('No se guardó la vista', () =>
      existing
        ? $worksheets.replaceSavedView(current, existing.id, input)
        : $worksheets.createSavedView(current, worksheetId.value, input),
    );
    if (!saved) return false;
    await refresh();
    selectView(saved.id);
    return true;
  }

  async function deleteView(view: SavedView) {
    const current = scope.value;
    if (!current || !window.confirm(`¿Eliminar la vista «${view.name}»?`))
      return false;
    const deleted = await run('No se eliminó la vista', async () => {
      await $worksheets.deleteSavedView(current, view.id);
      return true;
    });
    if (!deleted) return false;
    await refresh();
    selectView('');
    return true;
  }

  return {
    views,
    selectedView,
    activeView,
    query,
    error,
    isRunning,
    refresh,
    applyQuery,
    selectView,
    saveView,
    deleteView,
  };
}

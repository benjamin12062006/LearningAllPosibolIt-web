import type { ProjectScope } from '../../projects/types/project-scope';
import type { RowsRequest } from '../services/worksheets';
import type { RowItem } from '../types/worksheets';

export function useWorksheetRows(
  scope: Ref<ProjectScope | null>,
  worksheetId: Ref<string>,
  request: Ref<RowsRequest | null>,
) {
  const { $worksheets } = useNuxtApp();
  const rows = shallowRef<RowItem[]>([]);
  const cursor = ref<string | null>(null);
  const pending = ref(false);
  const error = ref('');
  let controller: AbortController | undefined;

  async function load(append = false) {
    if (append && (pending.value || cursor.value === null)) return;
    controller?.abort();
    if (!append) {
      rows.value = [];
      cursor.value = null;
    }
    const current = scope.value;
    const currentRequest = request.value;
    pending.value = false;
    error.value = '';
    if (!current || !currentRequest) return;

    const active = new AbortController();
    controller = active;
    pending.value = true;
    try {
      const page = await $worksheets.rows(
        current,
        worksheetId.value,
        { ...currentRequest, cursor: cursor.value ?? undefined, limit: 100 },
        active.signal,
      );
      if (active.signal.aborted) return;
      rows.value = append ? [...rows.value, ...page.items] : page.items;
      cursor.value = page.nextCursor;
    } catch (cause) {
      if (!active.signal.aborted) {
        error.value =
          cause instanceof Error
            ? cause.message
            : 'No se pudieron cargar las filas.';
      }
    } finally {
      if (controller === active) pending.value = false;
    }
  }

  if (import.meta.client) {
    watch([scope, worksheetId, request], () => void load(), {
      immediate: true,
    });
  }
  onScopeDispose(() => controller?.abort());

  return { rows, cursor, pending, error, load };
}

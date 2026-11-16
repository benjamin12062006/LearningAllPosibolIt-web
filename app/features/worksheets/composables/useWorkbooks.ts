import type { ProjectScope } from '../../projects/types/project-scope';
import type { Workbook, WorksheetSummary } from '../types/worksheets';

/** Lo que cabe en una página de la API; un proyecto con más se pagina. */
const LIST_LIMIT = 100;

export interface WorkbookWithSheets {
  workbook: Workbook;
  worksheets: WorksheetSummary[];
  hasMoreWorksheets: boolean;
}

/**
 * Los libros del proyecto con sus hojas. Por defecto solo los activos;
 * `includeArchived` trae también los archivados, que son de solo lectura.
 */
export function useWorkbooks(
  scope: MaybeRefOrGetter<ProjectScope | null>,
  includeArchived: MaybeRefOrGetter<boolean>,
) {
  const { $worksheets } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => {
      const current = toValue(scope);
      return `workbooks:${current?.projectId ?? 'sin-proyecto'}:${toValue(includeArchived)}`;
    },
    async () => {
      const current = toValue(scope);
      if (!current) return null;
      const query = listQuery(toValue(includeArchived));
      const { items, page } = await $worksheets.workbooks(current, query);
      const books = await Promise.all(
        items.map((workbook) => withSheets(current, workbook, query)),
      );
      return { books, hasMore: page.hasMore };
    },
    { server: false },
  );

  async function withSheets(
    current: ProjectScope,
    workbook: Workbook,
    query: ReturnType<typeof listQuery>,
  ): Promise<WorkbookWithSheets> {
    const { items, page } = await $worksheets.worksheets(
      current,
      workbook.id,
      query,
    );
    return {
      workbook,
      worksheets: items,
      hasMoreWorksheets: page.hasMore,
    };
  }

  const books = computed(() => data.value?.books ?? []);
  const hasMore = computed(() => data.value?.hasMore ?? false);

  return { books, hasMore, status, error, refresh };
}

/** Sin `archived`, la API devuelve activos y archivados. */
function listQuery(includeArchived: boolean) {
  return {
    limit: LIST_LIMIT,
    offset: 0,
    ...(includeArchived ? {} : { archived: false }),
  };
}

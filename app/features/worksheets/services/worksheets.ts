import {
  scopePath,
  type ProjectScope,
} from '../../projects/types/project-scope';
import {
  isRevisionEntry,
  isRowsPage,
  isSavedView,
  isWorkbook,
  isWorksheetSummary,
  isWorksheetWithCapabilities,
  readListPage,
  type ColumnDefinition,
  type Page,
  type RevisionEntry,
  type RowQuery,
  type RowsPage,
  type SavedView,
  type SavedViewInput,
  type Workbook,
  type WorksheetSummary,
  type WorksheetWithCapabilities,
} from '../types/worksheets';
import { isRecord } from '../../../utils/guards';
import { invalidResponse, type ApiClient } from '../../../services/api-client';

export interface ListQuery {
  limit: number;
  offset: number;
  /** Sin él, activos y archivados; con él, solo unos u otros. */
  archived?: boolean;
}

export interface RowsRequest extends RowQuery {
  revisionId?: string;
  /** Una vista guardada pone filtro, orden y columnas: no pueden venir además. */
  viewId?: string;
  cursor?: string;
  limit?: number;
}

export interface DuplicateRequest {
  name: string;
  /** Sin él, la copia va al mismo libro. */
  workbookId?: string;
}

/**
 * Libros, hojas, filas e historial («nuestro Excel», lectura y administración).
 * Todas las rutas cuelgan de la organización y el proyecto: Nest comprueba que
 * el proyecto sea de esa organización y que la persona sea miembro.
 */
export function createWorksheetsService(api: ApiClient) {
  return {
    async workbooks(
      scope: ProjectScope,
      query: ListQuery,
    ): Promise<Page<Workbook>> {
      const response = await api.request(`${scopePath(scope)}/workbooks`, {
        query: listQuery(query),
      });
      return requirePage(response, 'workbooks', isWorkbook);
    },

    async createWorkbook(scope: ProjectScope, name: string): Promise<Workbook> {
      const response = await api.request(`${scopePath(scope)}/workbooks`, {
        method: 'POST',
        body: { name },
      });
      return readWorkbook(response);
    },

    async renameWorkbook(
      scope: ProjectScope,
      workbookId: string,
      name: string,
    ): Promise<Workbook> {
      const response = await api.request(workbookPath(scope, workbookId), {
        method: 'PATCH',
        body: { name },
      });
      return readWorkbook(response);
    },

    /** Archivar el que ya lo está no cambia nada: la API responde igual. */
    async archiveWorkbook(
      scope: ProjectScope,
      workbookId: string,
    ): Promise<Workbook> {
      const response = await api.request(
        `${workbookPath(scope, workbookId)}/archive`,
        { method: 'POST' },
      );
      return readWorkbook(response);
    },

    async restoreWorkbook(
      scope: ProjectScope,
      workbookId: string,
    ): Promise<Workbook> {
      const response = await api.request(
        `${workbookPath(scope, workbookId)}/restore`,
        { method: 'POST' },
      );
      return readWorkbook(response);
    },

    async worksheets(
      scope: ProjectScope,
      workbookId: string,
      query: ListQuery,
    ): Promise<Page<WorksheetSummary>> {
      const response = await api.request(
        `${workbookPath(scope, workbookId)}/worksheets`,
        { query: listQuery(query) },
      );
      return requirePage(response, 'worksheets', isWorksheetSummary);
    },

    /** Una hoja vacía puede empezar sin columnas. */
    async createWorksheet(
      scope: ProjectScope,
      workbookId: string,
      input: { name: string; columns: ColumnDefinition[] },
    ): Promise<WorksheetWithCapabilities> {
      const response = await api.request(
        `${workbookPath(scope, workbookId)}/worksheets`,
        { method: 'POST', body: { ...input } },
      );
      return readWorksheet(response);
    },

    async find(
      scope: ProjectScope,
      worksheetId: string,
    ): Promise<WorksheetWithCapabilities> {
      const response = await api.request(worksheetPath(scope, worksheetId));
      return readWorksheet(response);
    },

    async rename(
      scope: ProjectScope,
      worksheetId: string,
      name: string,
    ): Promise<WorksheetWithCapabilities> {
      const response = await api.request(worksheetPath(scope, worksheetId), {
        method: 'PATCH',
        body: { name },
      });
      return readWorksheet(response);
    },

    /** La copia recuerda de qué hoja y de qué revisión salió (`duplicatedFrom`). */
    async duplicate(
      scope: ProjectScope,
      worksheetId: string,
      request: DuplicateRequest,
    ): Promise<WorksheetWithCapabilities> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/duplicate`,
        { method: 'POST', body: { ...request } },
      );
      return readWorksheet(response);
    },

    async archive(
      scope: ProjectScope,
      worksheetId: string,
    ): Promise<WorksheetWithCapabilities> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/archive`,
        { method: 'POST' },
      );
      return readWorksheet(response);
    },

    async restore(
      scope: ProjectScope,
      worksheetId: string,
    ): Promise<WorksheetWithCapabilities> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/restore`,
        { method: 'POST' },
      );
      return readWorksheet(response);
    },

    async revisions(
      scope: ProjectScope,
      worksheetId: string,
      query: ListQuery,
    ): Promise<Page<RevisionEntry>> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/revisions`,
        { query: listQuery(query) },
      );
      return requirePage(response, 'revisions', isRevisionEntry);
    },

    /**
     * Solo lectura; es `POST` porque el filtro es un árbol. El cursor va ligado
     * a la revisión y a la consulta: con otra consulta se empieza de nuevo.
     */
    async rows(
      scope: ProjectScope,
      worksheetId: string,
      request: RowsRequest,
      signal?: AbortSignal,
    ): Promise<RowsPage> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/rows/query`,
        { method: 'POST', body: { ...request }, signal },
      );
      if (!isRowsPage(response)) throw invalidResponse();
      return response;
    },

    /** Las del equipo y las propias. */
    async savedViews(
      scope: ProjectScope,
      worksheetId: string,
      query: ListQuery,
    ): Promise<Page<SavedView>> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/saved-views`,
        { query: listQuery(query) },
      );
      return requirePage(response, 'savedViews', isSavedView);
    },

    /** Personal, cualquier miembro; del equipo, Editor. */
    async createSavedView(
      scope: ProjectScope,
      worksheetId: string,
      input: SavedViewInput,
    ): Promise<SavedView> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/saved-views`,
        { method: 'POST', body: { ...input } },
      );
      return readSavedView(response);
    },

    async replaceSavedView(
      scope: ProjectScope,
      viewId: string,
      input: SavedViewInput,
    ): Promise<SavedView> {
      const response = await api.request(savedViewPath(scope, viewId), {
        method: 'PUT',
        body: { ...input },
      });
      return readSavedView(response);
    },

    async deleteSavedView(scope: ProjectScope, viewId: string): Promise<void> {
      await api.request(savedViewPath(scope, viewId), { method: 'DELETE' });
    },
  };
}

export type WorksheetsService = ReturnType<typeof createWorksheetsService>;

export function worksheetPath(scope: ProjectScope, worksheetId: string) {
  return `${scopePath(scope)}/worksheets/${encodeURIComponent(worksheetId)}`;
}

/** Un listado mal formado es una respuesta inválida, no una lista vacía. */
export function requirePage<Item>(
  response: unknown,
  key: string,
  isItem: (item: unknown) => item is Item,
): Page<Item> {
  const page = readListPage(response, key, isItem);
  if (!page) throw invalidResponse();
  return page;
}

export function listQuery({ limit, offset, archived }: ListQuery) {
  // La consulta viaja como texto: Nest solo entiende `true` y `false`.
  return {
    limit,
    offset,
    ...(archived === undefined ? {} : { archived: String(archived) }),
  };
}

function workbookPath(scope: ProjectScope, workbookId: string) {
  return `${scopePath(scope)}/workbooks/${encodeURIComponent(workbookId)}`;
}

function savedViewPath(scope: ProjectScope, viewId: string) {
  return `${scopePath(scope)}/saved-views/${encodeURIComponent(viewId)}`;
}

function readWorkbook(response: unknown): Workbook {
  if (isRecord(response) && isWorkbook(response.workbook)) {
    return response.workbook;
  }
  throw invalidResponse();
}

function readWorksheet(response: unknown): WorksheetWithCapabilities {
  if (!isWorksheetWithCapabilities(response)) throw invalidResponse();
  return response;
}

function readSavedView(response: unknown): SavedView {
  if (isRecord(response) && isSavedView(response.savedView)) {
    return response.savedView;
  }
  throw invalidResponse();
}

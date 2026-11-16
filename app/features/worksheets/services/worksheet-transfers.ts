import {
  scopePath,
  type ProjectScope,
} from '../../projects/types/project-scope';
import { isChangeset } from '../types/changesets';
import {
  isImportMapping,
  isImportPreview,
  isImportReport,
  isWorksheetCatalogSnapshot,
  isWorksheetExport,
  isWorksheetImportSummary,
  type CatalogSnapshotRequest,
  type CreatedImport,
  type CsvDelimiter,
  type ExportRequest,
  type ImportMapping,
  type ImportOptions,
  type ImportPreview,
  type MappingTemplate,
  type WorksheetCatalogSnapshot,
  type WorksheetExport,
  type WorksheetImportSummary,
} from '../types/worksheet-transfers';
import {
  isWorksheetWithCapabilities,
  type Page,
  type WorksheetWithCapabilities,
} from '../types/worksheets';
import { isNonEmptyString, isRecord } from '../../../utils/guards';
import { invalidResponse, type ApiClient } from '../../../services/api-client';
import {
  listQuery,
  requirePage,
  worksheetPath,
  type ListQuery,
} from './worksheets';

/** Lo que cambia la lectura del archivo antes de decidir el mapeo. */
export interface PreviewOptions {
  delimiter?: CsvDelimiter;
  sheet?: string;
  headerRow?: number;
  mappingId?: string;
}

/** Un catálogo creado desde una hoja: el trabajo de importación lo termina. */
export interface CatalogSnapshotAccepted {
  catalogSnapshot: WorksheetCatalogSnapshot;
  snapshotId: string;
  jobId: string | null;
}

/**
 * Entradas y salidas de una hoja: importar a un borrador, plantillas de mapeo,
 * exportar y el puente con el catálogo. Las subidas son `multipart`.
 */
export function createWorksheetTransfersService(api: ApiClient) {
  return {
    /** Lee el archivo sin guardar nada: cabeceras, muestra y columnas sugeridas. */
    async previewImport(
      scope: ProjectScope,
      worksheetId: string,
      file: File,
      options: PreviewOptions,
    ): Promise<ImportPreview> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/imports/preview`,
        { method: 'POST', body: previewForm(file, options) },
      );
      if (isRecord(response) && isImportPreview(response.preview)) {
        return response.preview;
      }
      throw invalidResponse();
    },

    /**
     * Crea un borrador con las filas del archivo. Con `mappingId`, el mapeo
     * sale de la plantilla y `options` solo lleva lo que depende del archivo.
     */
    async createImport(
      scope: ProjectScope,
      worksheetId: string,
      file: File,
      options: ImportOptions,
      mappingId?: string,
    ): Promise<CreatedImport> {
      const { body, etag } = await api.requestWithETag(
        `${worksheetPath(scope, worksheetId)}/imports`,
        { method: 'POST', body: importForm(file, options, mappingId) },
      );
      if (
        isRecord(body) &&
        isChangeset(body.changeset) &&
        isRecord(body.import) &&
        isNonEmptyString(body.import.id) &&
        isImportReport(body.import.report)
      ) {
        return {
          import: { id: body.import.id, report: body.import.report },
          changeset: body.changeset,
          etag,
        };
      }
      throw invalidResponse();
    },

    async imports(
      scope: ProjectScope,
      worksheetId: string,
      query: ListQuery,
    ): Promise<Page<WorksheetImportSummary>> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/imports`,
        { query: listQuery(query) },
      );
      return requirePage(response, 'imports', isWorksheetImportSummary);
    },

    async importMappings(
      scope: ProjectScope,
      worksheetId: string,
      query: ListQuery,
    ): Promise<Page<ImportMapping>> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/import-mappings`,
        { query: listQuery(query) },
      );
      return requirePage(response, 'importMappings', isImportMapping);
    },

    async createImportMapping(
      scope: ProjectScope,
      worksheetId: string,
      name: string,
      mapping: MappingTemplate,
    ): Promise<ImportMapping> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/import-mappings`,
        { method: 'POST', body: { name, mapping } },
      );
      if (isRecord(response) && isImportMapping(response.importMapping)) {
        return response.importMapping;
      }
      throw invalidResponse();
    },

    async deleteImportMapping(
      scope: ProjectScope,
      mappingId: string,
    ): Promise<void> {
      await api.request(
        `${scopePath(scope)}/import-mappings/${encodeURIComponent(mappingId)}`,
        { method: 'DELETE' },
      );
    },

    /** Exporta una revisión con sus columnas, filtro y orden. */
    async createExport(
      scope: ProjectScope,
      worksheetId: string,
      request: ExportRequest,
    ): Promise<WorksheetExport> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/exports`,
        { method: 'POST', body: { ...request } },
      );
      if (isRecord(response) && isWorksheetExport(response.export)) {
        return response.export;
      }
      throw invalidResponse();
    },

    async exports(
      scope: ProjectScope,
      worksheetId: string,
      query: ListQuery,
    ): Promise<Page<WorksheetExport>> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/exports`,
        { query: listQuery(query) },
      );
      return requirePage(response, 'exports', isWorksheetExport);
    },

    /** El archivo pide sesión: se descarga con el token, no con un enlace. */
    async downloadExport(scope: ProjectScope, exportId: string): Promise<Blob> {
      const response = await api.request(
        `${scopePath(scope)}/worksheet-exports/${encodeURIComponent(exportId)}/file`,
        { responseType: 'blob' },
      );
      if (response instanceof Blob) return response;
      throw invalidResponse();
    },

    /** Lleva una revisión al catálogo: nace una importación como las de CSV. */
    async createCatalogSnapshot(
      scope: ProjectScope,
      worksheetId: string,
      request: CatalogSnapshotRequest,
    ): Promise<CatalogSnapshotAccepted> {
      const response = await api.request(
        `${worksheetPath(scope, worksheetId)}/catalog-snapshots`,
        { method: 'POST', body: { ...request } },
      );
      if (
        isRecord(response) &&
        isWorksheetCatalogSnapshot(response.catalogSnapshot)
      ) {
        return {
          catalogSnapshot: response.catalogSnapshot,
          snapshotId: response.catalogSnapshot.snapshotId,
          jobId: isNonEmptyString(response.jobId) ? response.jobId : null,
        };
      }
      throw invalidResponse();
    },

    /** Abre un catálogo terminado como una hoja nueva de ese libro. */
    async openCatalogAsWorksheet(
      scope: ProjectScope,
      workbookId: string,
      request: { name: string; snapshotId: string },
    ): Promise<WorksheetWithCapabilities> {
      const response = await api.request(
        `${scopePath(scope)}/workbooks/${encodeURIComponent(workbookId)}/worksheets/from-catalog`,
        { method: 'POST', body: { ...request } },
      );
      if (!isWorksheetWithCapabilities(response)) throw invalidResponse();
      return response;
    },
  };
}

export type WorksheetTransfersService = ReturnType<
  typeof createWorksheetTransfersService
>;

/** Solo los campos con valor: Nest rechaza una opción de otro formato. */
function previewForm(file: File, options: PreviewOptions): FormData {
  const form = new FormData();
  form.append('file', file);
  if (options.delimiter) form.append('delimiter', options.delimiter);
  if (options.sheet) form.append('sheet', options.sheet);
  if (options.headerRow) form.append('headerRow', String(options.headerRow));
  if (options.mappingId) form.append('mappingId', options.mappingId);
  return form;
}

function importForm(
  file: File,
  options: ImportOptions,
  mappingId: string | undefined,
): FormData {
  const form = new FormData();
  form.append('file', file);
  form.append('options', JSON.stringify(options));
  if (mappingId) form.append('mappingId', mappingId);
  return form;
}

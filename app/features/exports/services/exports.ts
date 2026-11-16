import {
  isProductExport,
  type ExportApproval,
  type ProductExport,
} from '../types/exports';
import { isRecord } from '../../../utils/guards';
import { invalidResponse, type ApiClient } from '../../../services/api-client';

export function createExportsService(api: ApiClient) {
  return {
    /**
     * 201 con la exportación nueva o 200 con la que ya tenía la evaluación:
     * repetirlo es seguro y devuelve la misma.
     */
    async create(
      projectId: string,
      approval: ExportApproval,
    ): Promise<ProductExport> {
      const response = await api.request(exportsPath(projectId), {
        method: 'POST',
        body: { ...approval },
      });
      return readExport(response);
    },

    async find(projectId: string, exportId: string): Promise<ProductExport> {
      const response = await api.request(exportPath(projectId, exportId));
      return readExport(response);
    },

    /** `productos.tsv` con el token de la sesión: un enlace no lo enviaría. */
    async download(projectId: string, exportId: string): Promise<Blob> {
      const response = await api.request(
        `${exportPath(projectId, exportId)}/productos.tsv`,
        { responseType: 'blob' },
      );
      if (response instanceof Blob) return response;
      throw invalidResponse();
    },
  };
}

export type ExportsService = ReturnType<typeof createExportsService>;

function readExport(response: unknown): ProductExport {
  if (isRecord(response) && isProductExport(response.export)) {
    return response.export;
  }
  throw invalidResponse();
}

function exportsPath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}/exports`;
}

function exportPath(projectId: string, exportId: string) {
  return `${exportsPath(projectId)}/${encodeURIComponent(exportId)}`;
}

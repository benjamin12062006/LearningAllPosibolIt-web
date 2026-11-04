import {
  isImportAcceptance,
  isImportJob,
  isImportList,
  isImportSnapshot,
  type ImportAcceptance,
  type ImportJob,
  type ImportList,
  type ImportSnapshot,
  type ImportUpload,
} from '../types/imports';
import { isRecord } from '../utils/guards';
import { invalidResponse, type ApiClient } from './api-client';

export function createImportsService(api: ApiClient) {
  return {
    async list(projectId: string): Promise<ImportList> {
      const response = await api.request(`${projectPath(projectId)}/imports`);
      if (!isImportList(response)) throw invalidResponse();
      return response;
    },

    /** Multipart con los mismos nombres que espera el interceptor de la API. */
    async upload(
      projectId: string,
      upload: ImportUpload,
    ): Promise<ImportAcceptance> {
      const form = new FormData();
      form.append('idColumn', upload.idColumn);
      form.append('delimiter', upload.delimiter);
      form.append('file', upload.file, upload.file.name);

      const response = await api.request(`${projectPath(projectId)}/imports`, {
        method: 'POST',
        body: form,
      });
      if (!isImportAcceptance(response)) throw invalidResponse();
      return response;
    },

    /** Solo se usa la importación (sus cabeceras); la muestra de filas se ignora. */
    async findSnapshot(
      projectId: string,
      snapshotId: string,
    ): Promise<ImportSnapshot> {
      const response = await api.request(
        `${projectPath(projectId)}/imports/${encodeURIComponent(snapshotId)}`,
      );
      if (isRecord(response) && isImportSnapshot(response.snapshot)) {
        return response.snapshot;
      }
      throw invalidResponse();
    },

    async findJob(projectId: string, jobId: string): Promise<ImportJob> {
      const response = await api.request(
        `${projectPath(projectId)}/jobs/${encodeURIComponent(jobId)}`,
      );
      if (isRecord(response) && isImportJob(response.job)) return response.job;
      throw invalidResponse();
    },

    async remove(projectId: string, snapshotId: string): Promise<void> {
      await api.request(
        `${projectPath(projectId)}/imports/${encodeURIComponent(snapshotId)}`,
        { method: 'DELETE' },
      );
    },
  };
}

export type ImportsService = ReturnType<typeof createImportsService>;

function projectPath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}`;
}

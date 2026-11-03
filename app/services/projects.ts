import {
  isPageInfo,
  isProject,
  type Project,
  type ProjectInput,
  type ProjectList,
} from '../types/projects';
import { isRecord } from '../utils/guards';
import { invalidResponse, type ApiClient } from './api-client';

/** El lateral muestra todos los proyectos; 100 es el máximo que admite la API. */
const PROJECT_LIST_LIMIT = 100;

export function createProjectsService(api: ApiClient) {
  return {
    async list(): Promise<ProjectList> {
      const response = await api.request('/projects', {
        query: { limit: PROJECT_LIST_LIMIT },
      });
      if (!isProjectList(response)) throw invalidResponse();
      return response;
    },

    async find(id: string): Promise<Project> {
      const response = await api.request(`/projects/${encodeURIComponent(id)}`);
      return readProject(response);
    },

    async create(input: ProjectInput): Promise<Project> {
      const response = await api.request('/projects', {
        method: 'POST',
        body: { ...input },
      });
      return readProject(response);
    },

    async update(id: string, input: ProjectInput): Promise<Project> {
      const response = await api.request(
        `/projects/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: { ...input },
        },
      );
      return readProject(response);
    },

    /** La API borra también sus importaciones y archivos. */
    async remove(id: string): Promise<void> {
      await api.request(`/projects/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}

export type ProjectsService = ReturnType<typeof createProjectsService>;

function readProject(response: unknown): Project {
  if (isRecord(response) && isProject(response.project)) {
    return response.project;
  }
  throw invalidResponse();
}

function isProjectList(value: unknown): value is ProjectList {
  return (
    isRecord(value) &&
    Array.isArray(value.projects) &&
    value.projects.every(isProject) &&
    isPageInfo(value.page)
  );
}

import type { SessionService } from '../types/access';
import { isRecord } from '../utils/guards';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method?: HttpMethod;
  body?: Record<string, unknown> | FormData;
  query?: Record<string, string | number>;
}

/** Error de un campo concreto, tal como lo devuelve la validación de Nest. */
export interface FieldIssue {
  field: string;
  message: string;
}

/** Fallo de una petición, con el texto que ya puede mostrarse a la persona. */
export class ApiFailure extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string | null = null,
    public readonly issues: FieldIssue[] = [],
  ) {
    super(message);
    this.name = 'ApiFailure';
  }
}

/** La API respondió, pero no con la forma esperada. */
export function invalidResponse() {
  return new ApiFailure(0, 'La respuesta del servidor no es válida.');
}

export interface ApiClient {
  request(path: string, request?: ApiRequest): Promise<unknown>;
}

const REQUEST_TIMEOUT_MS = 30_000;

export function createApiClient(
  baseUrl: string,
  session?: SessionService,
): ApiClient {
  async function request(
    path: string,
    { method = 'GET', body, query }: ApiRequest = {},
  ) {
    if (!session) {
      throw new ApiFailure(401, 'Inicia sesión para continuar.');
    }
    // Un 401 puede ser un token caducado: se renueva y se intenta una vez más.
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await session.token(attempt === 1);
      try {
        return await $fetch<unknown>(baseUrl + path, {
          method,
          body,
          query,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'omit',
          redirect: 'error',
          retry: 0,
          timeout: REQUEST_TIMEOUT_MS,
        });
      } catch (error) {
        const failure = toApiFailure(error);
        if (failure.status === 401 && attempt === 0) continue;
        throw failure;
      }
    }
    throw new ApiFailure(401, fallbackMessage(401));
  }

  return { request };
}

/** Usa `message.es` del error público de la API; si no llega, un texto por estado. */
function toApiFailure(error: unknown): ApiFailure {
  const status = responseStatus(error);
  const body = isRecord(error) ? error.data : undefined;

  if (!isRecord(body) || !hasSpanishMessage(body.message)) {
    return new ApiFailure(status, fallbackMessage(status));
  }
  const code = typeof body.code === 'string' ? body.code : null;
  return new ApiFailure(status, body.message.es, code, readIssues(body.issues));
}

function responseStatus(error: unknown): number {
  if (isRecord(error) && typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  return 0;
}

function hasSpanishMessage(value: unknown): value is { es: string } {
  return isRecord(value) && typeof value.es === 'string';
}

function readIssues(value: unknown): FieldIssue[] {
  if (!Array.isArray(value)) return [];
  const issues: FieldIssue[] = [];
  for (const issue of value) {
    if (
      isRecord(issue) &&
      typeof issue.field === 'string' &&
      hasSpanishMessage(issue.message)
    ) {
      issues.push({ field: issue.field, message: issue.message.es });
    }
  }
  return issues;
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'Tu sesión terminó. Vuelve a entrar.';
  if (status === 403) return 'No tienes permiso para esta operación.';
  if (status === 404) return 'Ya no está disponible.';
  if (status === 413) return 'El archivo supera el tamaño permitido.';
  if (status >= 400 && status < 500)
    return 'Revisa los datos e inténtalo de nuevo.';
  return 'No pudimos conectar con el servidor. Inténtalo de nuevo.';
}

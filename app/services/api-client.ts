import type { SessionService } from '../features/access/types/access';
import type { AppLanguage } from '../composables/useAppLocale';
import { isRecord } from '../utils/guards';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method?: HttpMethod;
  body?: Record<string, unknown> | FormData;
  query?: Record<string, string | number>;
  /**
   * Cabeceras extra, como `If-Match` (guardar un borrador) o `Idempotency-Key`
   * (aplicarlo). `Authorization` y `Accept` las pone siempre el cliente.
   */
  headers?: Record<string, string>;
  /** `blob` para archivos (por ejemplo `errores.csv`): un enlace no enviaría el token. */
  responseType?: 'json' | 'blob';
  /**
   * Cancela la petición cuando otra la sustituye, por ejemplo la `signal` que
   * `useAsyncData` da al cambiar la búsqueda (ficha ui 05, F7).
   */
  signal?: AbortSignal;
}

/** El cuerpo y su versión: el `ETag` que el siguiente guardado manda en `If-Match`. */
export interface VersionedResponse {
  body: unknown;
  /** Tal cual llega (`"3"`), porque `If-Match` lo espera igual; `null` si no hay. */
  etag: string | null;
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
  /** Como `request`, y además devuelve el `ETag` de la respuesta. */
  requestWithETag(
    path: string,
    request?: ApiRequest,
  ): Promise<VersionedResponse>;
}

const REQUEST_TIMEOUT_MS = 30_000;

export function createApiClient(
  baseUrl: string,
  session?: SessionService,
  language: () => AppLanguage = () => 'es',
): ApiClient {
  function request(path: string, apiRequest: ApiRequest = {}) {
    return sendWithSession(apiRequest, (token) =>
      $fetch<unknown>(baseUrl + path, fetchOptions(apiRequest, token)),
    );
  }

  async function requestWithETag(path: string, apiRequest: ApiRequest = {}) {
    // `raw` devuelve la respuesta entera: el cuerpo ya leído y las cabeceras.
    const response = await sendWithSession(apiRequest, (token) =>
      $fetch.raw<unknown>(baseUrl + path, fetchOptions(apiRequest, token)),
    );
    return { body: response._data, etag: response.headers.get('etag') };
  }

  /** Pone el token de la sesión y traduce los fallos a `ApiFailure`. */
  async function sendWithSession<T>(
    { signal }: ApiRequest,
    send: (token: string) => Promise<T>,
  ): Promise<T> {
    if (!session) {
      throw new ApiFailure(
        401,
        language() === 'en'
          ? 'Sign in to continue.'
          : 'Inicia sesión para continuar.',
      );
    }
    // Un 401 puede ser un token caducado: se renueva y se intenta una vez más.
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await session.token(attempt === 1);
      try {
        return await send(token);
      } catch (error) {
        // Cancelada a propósito: no es un fallo que mostrar ni que reintentar.
        if (signal?.aborted) throw error;
        const failure = toApiFailure(error, language());
        if (failure.status === 401 && attempt === 0) continue;
        throw failure;
      }
    }
    throw new ApiFailure(401, fallbackMessage(401, language()));
  }

  return { request, requestWithETag };
}

function fetchOptions(
  {
    method = 'GET',
    body,
    query,
    headers = {},
    responseType = 'json',
    signal,
  }: ApiRequest,
  token: string,
) {
  return {
    method,
    body,
    query,
    responseType,
    signal,
    headers: {
      ...headers,
      // Después de las extra: el formato y la sesión no se pueden pisar.
      Accept: responseType === 'blob' ? '*/*' : 'application/json',
      Authorization: `Bearer ${token}`,
    },
    // El ETag del borrador versiona operaciones. Aprobar cambia el estado sin cambiar ese ETag.
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    retry: 0,
    timeout: REQUEST_TIMEOUT_MS,
  } as const;
}

function toApiFailure(error: unknown, language: AppLanguage): ApiFailure {
  const status = responseStatus(error);
  const body = isRecord(error) ? error.data : undefined;

  if (!isRecord(body))
    return new ApiFailure(status, fallbackMessage(status, language));
  const code = typeof body.code === 'string' ? body.code : null;
  const message = localizedMessage(body.message, language);
  return new ApiFailure(
    status,
    message ?? fallbackMessage(status, language),
    code,
    readIssues(body.issues, language),
  );
}

function responseStatus(error: unknown): number {
  if (isRecord(error) && typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  return 0;
}

function localizedMessage(value: unknown, language: AppLanguage) {
  if (!isRecord(value)) return;
  const preferred = value[language];
  if (typeof preferred === 'string') return preferred;
  if (typeof value.es === 'string') return value.es;
}

function readIssues(value: unknown, language: AppLanguage): FieldIssue[] {
  if (!Array.isArray(value)) return [];
  const issues: FieldIssue[] = [];
  for (const issue of value) {
    if (!isRecord(issue) || typeof issue.field !== 'string') continue;
    const message = localizedMessage(issue.message, language);
    if (message) issues.push({ field: issue.field, message });
  }
  return issues;
}

function fallbackMessage(status: number, language: AppLanguage): string {
  if (language === 'en') {
    if (status === 401) return 'Your session ended. Sign in again.';
    if (status === 403) return 'You do not have permission for this action.';
    if (status === 404) return 'This is no longer available.';
    if (status === 413) return 'The file exceeds the size limit.';
    if (status >= 400 && status < 500)
      return 'Check the information and try again.';
    return 'We could not connect to the server. Try again.';
  }
  if (status === 401) return 'Tu sesión terminó. Vuelve a entrar.';
  if (status === 403) return 'No tienes permiso para esta operación.';
  if (status === 404) return 'Ya no está disponible.';
  if (status === 413) return 'El archivo supera el tamaño permitido.';
  if (status >= 400 && status < 500)
    return 'Revisa los datos e inténtalo de nuevo.';
  return 'No pudimos conectar con el servidor. Inténtalo de nuevo.';
}

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiFailure, createApiClient } from '../../../app/services/api-client';
import type { SessionService } from '../../../app/features/access/types/access';

const BASE_URL = 'http://127.0.0.1:8080/api/v1';

/** Sesión de prueba: el primer token caduca; el renovado (`forceRefresh`) vale. */
function fakeSession(): SessionService & { tokens: boolean[] } {
  const tokens: boolean[] = [];
  return {
    tokens,
    restore: async () => true,
    signOut: async () => {},
    token: async (forceRefresh = false) => {
      tokens.push(forceRefresh);
      return forceRefresh ? 'token-renovado' : 'token-inicial';
    },
  };
}

/** Lo que lanza ofetch cuando Nest responde con un error. */
function httpError(statusCode: number, data?: unknown) {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode, data });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('$fetch', fetchMock);
});

describe('createApiClient · request', () => {
  it('pide JSON a la API con el token de la sesión y sin reintentos propios', async () => {
    fetchMock.mockResolvedValueOnce({ project: { id: 'p1' } });
    const api = createApiClient(BASE_URL, fakeSession());

    const body = await api.request('/projects/p1', { query: { limit: 20 } });

    expect(body).toEqual({ project: { id: 'p1' } });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE_URL}/projects/p1`);
    expect(options).toMatchObject({
      method: 'GET',
      query: { limit: 20 },
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      retry: 0,
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer token-inicial',
      },
    });
  });

  it('pide un archivo aceptando cualquier tipo', async () => {
    fetchMock.mockResolvedValueOnce(new Blob(['a,b']));
    const api = createApiClient(BASE_URL, fakeSession());

    await api.request('/evaluations/e1/errors.csv', { responseType: 'blob' });

    expect(fetchMock.mock.calls[0]![1]).toMatchObject({
      responseType: 'blob',
      headers: { Accept: '*/*' },
    });
  });

  it('ante un 401 renueva el token y lo intenta una sola vez más', async () => {
    fetchMock
      .mockRejectedValueOnce(httpError(401))
      .mockResolvedValueOnce({ ok: true });
    const session = fakeSession();
    const api = createApiClient(BASE_URL, session);

    await expect(api.request('/projects')).resolves.toEqual({ ok: true });

    expect(session.tokens).toEqual([false, true]);
    expect(fetchMock.mock.calls[1]![1].headers.Authorization).toBe(
      'Bearer token-renovado',
    );
  });

  it('si el token renovado tampoco vale, termina con un 401', async () => {
    fetchMock.mockRejectedValue(httpError(401));
    const api = createApiClient(BASE_URL, fakeSession());

    await expect(api.request('/projects')).rejects.toMatchObject({
      status: 401,
      message: 'Tu sesión terminó. Vuelve a entrar.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('traduce el error público de Nest con su mensaje, código y campos', async () => {
    fetchMock.mockRejectedValueOnce(
      httpError(400, {
        code: 'VALIDATION_FAILED',
        message: { es: 'Revisa los datos.', en: 'Check the data.' },
        issues: [
          { field: 'name', message: { es: 'Falta el nombre.', en: 'Name.' } },
          { field: 'raro', message: 'sin idiomas' },
        ],
      }),
    );
    const api = createApiClient(BASE_URL, fakeSession());

    const failure = await api.request('/projects').catch((error) => error);

    expect(failure).toBeInstanceOf(ApiFailure);
    expect(failure).toMatchObject({
      status: 400,
      message: 'Revisa los datos.',
      code: 'VALIDATION_FAILED',
      issues: [{ field: 'name', message: 'Falta el nombre.' }],
    });
  });

  it.each([
    [403, 'No tienes permiso para esta operación.'],
    [404, 'Ya no está disponible.'],
    [413, 'El archivo supera el tamaño permitido.'],
    [422, 'Revisa los datos e inténtalo de nuevo.'],
    [503, 'No pudimos conectar con el servidor. Inténtalo de nuevo.'],
  ])(
    'sin mensaje en español, un %i usa su texto de respaldo',
    async (status, message) => {
      fetchMock.mockRejectedValueOnce(httpError(status, 'texto plano'));
      const api = createApiClient(BASE_URL, fakeSession());

      await expect(api.request('/x')).rejects.toMatchObject({
        status,
        message,
        code: null,
      });
    },
  );

  it('envía las cabeceras extra, pero no deja pisar la sesión ni el formato', async () => {
    fetchMock.mockResolvedValueOnce({});
    const api = createApiClient(BASE_URL, fakeSession());

    await api.request('/changesets/c1/apply', {
      method: 'POST',
      headers: {
        'Idempotency-Key': 'clave-1',
        Authorization: 'Bearer robado',
        Accept: 'text/html',
      },
    });

    expect(fetchMock.mock.calls[0]![1].headers).toEqual({
      'Idempotency-Key': 'clave-1',
      Accept: 'application/json',
      Authorization: 'Bearer token-inicial',
    });
  });

  it('pasa la señal de cancelación a la petición', async () => {
    fetchMock.mockResolvedValueOnce({});
    const controller = new AbortController();
    const api = createApiClient(BASE_URL, fakeSession());

    await api.request('/x', { signal: controller.signal });

    expect(fetchMock.mock.calls[0]![1].signal).toBe(controller.signal);
  });

  it('una petición cancelada falla con su error original, sin traducirlo ni reintentar', async () => {
    const controller = new AbortController();
    const aborted = Object.assign(new Error('This operation was aborted'), {
      name: 'AbortError',
      // Aunque llegara como 401, cancelada no se reintenta.
      statusCode: 401,
    });
    fetchMock.mockImplementationOnce(async () => {
      controller.abort();
      throw aborted;
    });
    const api = createApiClient(BASE_URL, fakeSession());

    const error = await api
      .request('/x', { signal: controller.signal })
      .catch((reason: unknown) => reason);

    expect(error).toBe(aborted);
    expect(error).not.toBeInstanceOf(ApiFailure);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('sin sesión no llama a la API', async () => {
    const api = createApiClient(BASE_URL);

    await expect(api.request('/projects')).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/** Lo que devuelve `$fetch.raw`: el cuerpo ya leído y las cabeceras. */
function rawResponse(body: unknown, headers: Record<string, string> = {}) {
  return { _data: body, headers: new Headers(headers) };
}

describe('createApiClient · requestWithETag', () => {
  const rawMock = vi.fn();

  beforeEach(() => {
    rawMock.mockReset();
    Object.assign(fetchMock, { raw: rawMock });
  });

  it('devuelve el cuerpo y el ETag tal cual, para mandarlo en If-Match', async () => {
    rawMock.mockResolvedValueOnce(
      rawResponse({ changeset: { id: 'c1' } }, { ETag: '"3"' }),
    );
    const api = createApiClient(BASE_URL, fakeSession());

    const response = await api.requestWithETag('/changesets/c1/operations', {
      method: 'PUT',
      headers: { 'If-Match': '"2"' },
      body: { operations: [] },
    });

    expect(response).toEqual({
      body: { changeset: { id: 'c1' } },
      etag: '"3"',
    });
    expect(fetchMock).not.toHaveBeenCalled();
    const [url, options] = rawMock.mock.calls[0]!;
    expect(url).toBe(`${BASE_URL}/changesets/c1/operations`);
    expect(options).toMatchObject({
      method: 'PUT',
      body: { operations: [] },
      headers: {
        'If-Match': '"2"',
        Accept: 'application/json',
        Authorization: 'Bearer token-inicial',
      },
    });
  });

  it('sin ETag en la respuesta devuelve null', async () => {
    rawMock.mockResolvedValueOnce(rawResponse({ ok: true }));
    const api = createApiClient(BASE_URL, fakeSession());

    await expect(api.requestWithETag('/x')).resolves.toEqual({
      body: { ok: true },
      etag: null,
    });
  });

  it('también renueva el token ante un 401', async () => {
    rawMock
      .mockRejectedValueOnce(httpError(401))
      .mockResolvedValueOnce(rawResponse({}, { ETag: '"1"' }));
    const session = fakeSession();
    const api = createApiClient(BASE_URL, session);

    await expect(api.requestWithETag('/x')).resolves.toMatchObject({
      etag: '"1"',
    });
    expect(session.tokens).toEqual([false, true]);
  });

  it('traduce un 412 de Nest como cualquier otro error', async () => {
    rawMock.mockRejectedValueOnce(
      httpError(412, {
        code: 'CHANGESET_VERSION_MISMATCH',
        message: {
          es: 'El borrador cambió desde que lo abriste. Vuelve a cargarlo antes de guardar.',
          en: 'The draft changed since you opened it. Reload it before saving.',
        },
      }),
    );
    const api = createApiClient(BASE_URL, fakeSession());

    await expect(api.requestWithETag('/x')).rejects.toMatchObject({
      status: 412,
      code: 'CHANGESET_VERSION_MISMATCH',
      message:
        'El borrador cambió desde que lo abriste. Vuelve a cargarlo antes de guardar.',
    });
  });
});

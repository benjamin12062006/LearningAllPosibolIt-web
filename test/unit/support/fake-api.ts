import { vi } from 'vitest';
import type { ApiClient } from '../../../app/services/api-client';

/** Un cliente que responde lo que se le dé y anota lo que se le pidió. */
export function fakeApi(response: unknown, etag: string | null = null) {
  const request = vi.fn(async () => response);
  const requestWithETag = vi.fn(async () => ({ body: response, etag }));
  const api: ApiClient = { request, requestWithETag };
  return { api, request, requestWithETag };
}

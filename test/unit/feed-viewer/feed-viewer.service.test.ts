import { describe, expect, it } from 'vitest';
import { ApiFailure } from '../../../app/services/api-client';
import { createFeedViewerService } from '../../../app/features/feed-viewer/services/feed-viewer';
import { fakeApi } from '../support/fake-api';

const PAGE = { limit: 50, offset: 0, hasMore: false };
const PRODUCTS = {
  columns: ['id', 'title'],
  products: [{ line: 2, values: { id: 'A/1', title: 'Silla' } }],
  page: PAGE,
  rowCount: 1,
};
const EXPORT = {
  id: 'e1',
  evaluationId: 'ev1',
  acceptedInvalidCount: 0,
  acceptedExcludedCount: 0,
  rowCount: 1,
  byteSize: 10,
  tsvChecksum: 'abc',
  createdAt: '2026-11-14T10:00:00.000Z',
};
const VERSION = {
  id: 'v1',
  exportId: 'e1',
  evaluationId: null,
  rowCount: 1,
  byteSize: 10,
  tsvChecksum: 'abc',
  publishedBy: 'operator',
  publishedAt: '2026-11-14T10:00:00.000Z',
};
const PROBLEM = {
  attribute: 'price',
  code: 'REQUIRED',
  problem: { es: 'Falta el precio', en: 'Price is missing' },
  suggestion: { es: 'Añade el precio', en: 'Add the price' },
};
const COUNTS = { total: 3, valid: 1, invalid: 1, excluded: 1 };

describe('createFeedViewerService · productos', () => {
  it('lee los productos de una exportación', async () => {
    const { api, request } = fakeApi(PRODUCTS);

    const page = await createFeedViewerService(api).products(
      'p1',
      { kind: 'export', exportId: 'e/1' },
      { limit: 50, offset: 100, search: '' },
    );

    expect(request).toHaveBeenCalledWith(
      '/projects/p1/exports/e%2F1/products',
      {
        query: { limit: 50, offset: 100 },
        signal: undefined,
      },
    );
    expect(page.rowCount).toBe(1);
  });

  it('lee los productos de una versión del feed, con la búsqueda y la señal', async () => {
    const { api, request } = fakeApi(PRODUCTS);
    const { signal } = new AbortController();

    await createFeedViewerService(api).products(
      'p1',
      { kind: 'feed_version', feedId: 'f1', versionId: 'v1' },
      { limit: 50, offset: 0, search: 'silla', signal },
    );

    expect(request).toHaveBeenCalledWith(
      '/projects/p1/feeds/f1/versions/v1/products',
      { query: { limit: 50, offset: 0, search: 'silla' }, signal },
    );
  });

  it('pide la ficha con el id en la consulta, porque un SKU puede llevar barras', async () => {
    const { api, request } = fakeApi({
      columns: ['id'],
      product: { line: 2, values: { id: 'A/1' } },
      source: { kind: 'export', export: EXPORT },
    });

    const detail = await createFeedViewerService(api).product(
      'p1',
      { kind: 'export', exportId: 'e1' },
      'A/1',
    );

    expect(request).toHaveBeenCalledWith('/projects/p1/exports/e1/product', {
      query: { id: 'A/1' },
    });
    expect(detail.source.kind).toBe('export');
  });

  it('acepta la procedencia de una versión sin evaluación de origen', async () => {
    const { api } = fakeApi({
      columns: ['id'],
      product: { line: 2, values: { id: 'A1' } },
      source: {
        kind: 'feed_version',
        feedId: 'f1',
        version: { ...VERSION, current: true, fileRetained: true },
      },
    });

    const detail = await createFeedViewerService(api).product(
      'p1',
      { kind: 'feed_version', feedId: 'f1', versionId: 'v1' },
      'A1',
    );

    expect(detail.source.kind).toBe('feed_version');
  });

  it.each([
    ['sin total del archivo', { ...PRODUCTS, rowCount: undefined }],
    [
      'con un valor que no es texto',
      { ...PRODUCTS, products: [{ line: 2, values: { id: 7 } }] },
    ],
    ['sin página', { ...PRODUCTS, page: null }],
  ])('rechaza una página %s', async (_case, response) => {
    const { api } = fakeApi(response);

    await expect(
      createFeedViewerService(api).products(
        'p1',
        { kind: 'export', exportId: 'e1' },
        { limit: 50, offset: 0, search: '' },
      ),
    ).rejects.toBeInstanceOf(ApiFailure);
  });
});

describe('createFeedViewerService · diagnóstico', () => {
  it('lee el estado de la entrega con su motivo', async () => {
    const { api, request } = fakeApi({
      delivery: {
        delivering: false,
        reason: 'delivery_disabled',
        deliveryEnabled: false,
        publishedVersion: VERSION,
      },
    });

    const delivery = await createFeedViewerService(api).delivery('p1', 'f1');

    expect(request).toHaveBeenCalledWith('/projects/p1/feeds/f1/delivery');
    expect(delivery.reason).toBe('delivery_disabled');
  });

  it('rechaza un motivo de entrega desconocido', async () => {
    const { api } = fakeApi({
      delivery: {
        delivering: false,
        reason: 'por_que_si',
        deliveryEnabled: true,
        publishedVersion: null,
      },
    });

    await expect(
      createFeedViewerService(api).delivery('p1', 'f1'),
    ).rejects.toBeInstanceOf(ApiFailure);
  });

  it('lee «Requiere atención» con sus grupos', async () => {
    const { api, request } = fakeApi({
      attention: {
        evaluationId: 'ev1',
        affectedProducts: 1,
        problemGroups: [{ ...PROBLEM, productCount: 1 }],
        excludedProducts: 1,
        exclusionGroups: [{ rulePosition: 2, rule: {}, productCount: 1 }],
      },
    });

    const attention = await createFeedViewerService(api).attention('p1', 'ev1');

    expect(request).toHaveBeenCalledWith(
      '/projects/p1/evaluations/ev1/attention',
    );
    expect(attention.problemGroups).toHaveLength(1);
  });

  it('abre un grupo de problema con atributo y código juntos', async () => {
    const { api, request } = fakeApi({ rows: [], page: PAGE });

    await createFeedViewerService(api).attentionRows(
      'p1',
      'ev1',
      { kind: 'problem', attribute: 'price', code: 'REQUIRED' },
      { limit: 20, offset: 0 },
    );

    expect(request).toHaveBeenCalledWith('/projects/p1/evaluations/ev1/rows', {
      query: { limit: 20, offset: 0, attribute: 'price', code: 'REQUIRED' },
    });
  });

  it('abre un grupo de exclusión con la posición de la regla', async () => {
    const { api, request } = fakeApi({ rows: [], page: PAGE });

    await createFeedViewerService(api).attentionRows(
      'p1',
      'ev1',
      { kind: 'exclusion', rulePosition: 2 },
      { limit: 20, offset: 20 },
    );

    expect(request).toHaveBeenCalledWith('/projects/p1/evaluations/ev1/rows', {
      query: { limit: 20, offset: 20, rule: 2 },
    });
  });

  it('compara una exportación con lo publicado, con o sin tipo de cambio', async () => {
    const comparison = {
      candidate: EXPORT,
      published: VERSION,
      counts: { added: 1, removed: 0, modified: 1, unchanged: 5 },
      changedFields: [{ field: 'price', productCount: 1 }],
      changes: [
        {
          id: 'A1',
          change: 'modified',
          fields: [{ field: 'price', before: '10 EUR', after: '12 EUR' }],
        },
      ],
      page: PAGE,
    };
    const { api, request } = fakeApi({ comparison });
    const service = createFeedViewerService(api);

    await service.comparison('p1', 'f1', {
      exportId: 'e1',
      change: null,
      limit: 20,
      offset: 0,
    });
    await service.comparison('p1', 'f1', {
      exportId: 'e1',
      change: 'modified',
      limit: 20,
      offset: 0,
    });

    expect(request).toHaveBeenNthCalledWith(
      1,
      '/projects/p1/feeds/f1/comparison',
      { query: { exportId: 'e1', limit: 20, offset: 0 } },
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/projects/p1/feeds/f1/comparison',
      { query: { exportId: 'e1', limit: 20, offset: 0, change: 'modified' } },
    );
  });

  it('prueba unas reglas mandando el catálogo y sin guardar nada', async () => {
    const outcome = {
      outcome: 'invalid',
      problems: [PROBLEM],
      excludedByRule: null,
    };
    const preview = {
      snapshotId: 's1',
      baseRevision: 3,
      counts: { current: COUNTS, proposed: COUNTS },
      problems: {
        appeared: [{ ...PROBLEM, productCount: 1 }],
        resolved: [],
        persisting: [],
      },
      outcomeChanges: [{ from: 'valid', to: 'invalid', productCount: 1 }],
      changedValues: [{ attribute: 'title', productCount: 1 }],
      changedProducts: 1,
      products: [
        {
          sourceRow: 1,
          externalId: 'A1',
          current: { ...outcome, outcome: 'valid', problems: [] },
          proposed: outcome,
          values: [{ attribute: 'title', before: 'Silla', after: null }],
        },
      ],
      page: PAGE,
    };
    const { api, request } = fakeApi({ preview });

    const result = await createFeedViewerService(api).previewRules(
      'p1',
      { mapping: [], rules: [], snapshotId: 's1' },
      { limit: 20, offset: 0 },
    );

    expect(request).toHaveBeenCalledWith('/projects/p1/evaluations/preview', {
      method: 'POST',
      body: { mapping: [], rules: [], snapshotId: 's1' },
      query: { limit: 20, offset: 0 },
    });
    expect(result.changedProducts).toBe(1);
  });
});

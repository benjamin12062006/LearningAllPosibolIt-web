import { describe, expect, it } from 'vitest';
import { ApiFailure } from '../../../app/services/api-client';
import {
  isLinkColumn,
  mainColumnsOf,
  safeHttpUrl,
} from '../../../app/features/feed-viewer/utils/product-columns';
import {
  productSourceKey,
  productSourceQuery,
  readProductSource,
} from '../../../app/features/feed-viewer/utils/product-source';
import { describeViewerFailure } from '../../../app/features/feed-viewer/utils/viewer-failure';

describe('el archivo que se mira, en la URL', () => {
  it('lee una exportación', () => {
    expect(readProductSource({ exportacion: 'e1' })).toEqual({
      kind: 'export',
      exportId: 'e1',
    });
  });

  it('lee una versión solo con feed y versión juntos', () => {
    expect(readProductSource({ feed: 'f1', version: 'v1' })).toEqual({
      kind: 'feed_version',
      feedId: 'f1',
      versionId: 'v1',
    });
    expect(readProductSource({ feed: 'f1' })).toBeNull();
    expect(readProductSource({ version: 'v1' })).toBeNull();
  });

  it('sin origen, o con la clave repetida, no elige ninguno', () => {
    expect(readProductSource({})).toBeNull();
    expect(readProductSource({ exportacion: ['e1', 'e2'] })).toBeNull();
  });

  it('la consulta de un origen se vuelve a leer como el mismo origen', () => {
    const version = {
      kind: 'feed_version',
      feedId: 'f1',
      versionId: 'v1',
    } as const;
    const exported = { kind: 'export', exportId: 'e1' } as const;

    expect(readProductSource(productSourceQuery(version) as never)).toEqual(
      version,
    );
    expect(readProductSource(productSourceQuery(exported) as never)).toEqual(
      exported,
    );
    expect(productSourceKey(version)).not.toBe(productSourceKey(exported));
  });
});

describe('las columnas del TSV', () => {
  it('enseña las principales que existan, en el orden de la tabla', () => {
    expect(mainColumnsOf(['price', 'brand', 'id', 'title'])).toEqual([
      'id',
      'title',
      'price',
    ]);
    expect(mainColumnsOf(['sku'])).toEqual([]);
  });

  it('solo deja pasar direcciones http y https', () => {
    expect(safeHttpUrl('https://tienda.example/p/1')).toBe(
      'https://tienda.example/p/1',
    );
    expect(safeHttpUrl('http://tienda.example/')).toBe(
      'http://tienda.example/',
    );
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,<script>1</script>')).toBeNull();
    expect(safeHttpUrl('tienda.example/p/1')).toBeNull();
    expect(safeHttpUrl('')).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
  });

  it('trata como enlace las columnas de dirección', () => {
    expect(isLinkColumn('link')).toBe(true);
    expect(isLinkColumn('image_link')).toBe(true);
    expect(isLinkColumn('title')).toBe(false);
  });
});

describe('los fallos del visor, explicados', () => {
  it.each([
    ['FEED_VERSION_FILE_RETIRED', 410, 'feed'],
    ['EXPORT_FILE_UNAVAILABLE', 503, 'retry'],
    ['FEED_FILE_UNAVAILABLE', 503, 'retry'],
    ['FEED_NOT_PUBLISHED', 409, 'feed'],
    ['EVALUATION_RESULTS_UNAVAILABLE', 409, 'evaluations'],
    ['PRODUCT_NOT_FOUND', 404, 'feed'],
  ])('%s ofrece la salida «%s»', (code, status, action) => {
    const view = describeViewerFailure(
      new ApiFailure(status, 'Texto de Nest', code),
    );

    expect(view.action).toBe(action);
    expect(view.description).toBe('Texto de Nest');
  });

  it('un fallo desconocido se puede reintentar', () => {
    expect(describeViewerFailure(new Error('red')).action).toBe('retry');
    expect(describeViewerFailure(new ApiFailure(500, 'Fallo')).action).toBe(
      'retry',
    );
  });
});

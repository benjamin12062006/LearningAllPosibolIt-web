import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { ProductSourceRef } from '../types/feed-viewer';

/**
 * El archivo que se mira vive en la URL (plan del visor, VW3):
 * `?exportacion=<id>` o `?feed=<feedId>&version=<versionId>`. Así la misma
 * página sirve para los dos orígenes y se puede enlazar.
 */
export function readProductSource(
  query: LocationQuery,
): ProductSourceRef | null {
  const { exportacion, feed, version } = query;
  if (isId(exportacion)) return { kind: 'export', exportId: exportacion };
  if (isId(feed) && isId(version)) {
    return { kind: 'feed_version', feedId: feed, versionId: version };
  }
  return null;
}

/** La consulta que abre ese archivo, para los enlaces «Ver productos». */
export function productSourceQuery(source: ProductSourceRef): LocationQueryRaw {
  if (source.kind === 'export') return { exportacion: source.exportId };
  return { feed: source.feedId, version: source.versionId };
}

/** Texto estable para la clave de caché y para comparar dos orígenes. */
export function productSourceKey(source: ProductSourceRef): string {
  if (source.kind === 'export') return `export:${source.exportId}`;
  return `version:${source.feedId}:${source.versionId}`;
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

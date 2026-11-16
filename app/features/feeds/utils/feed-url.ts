/**
 * URL completa del feed: el origen de la API con la ruta pública
 * (`/feeds/<token>.tsv`), que la API sirve fuera de `/api/v1`.
 */
export function publicFeedUrl(deliveryUrl: string, apiBaseUrl: string) {
  return new URL(deliveryUrl, apiBaseUrl).toString();
}

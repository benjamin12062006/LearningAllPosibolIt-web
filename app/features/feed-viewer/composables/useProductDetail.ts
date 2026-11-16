import type { ProductSourceRef } from '../types/feed-viewer';
import { productSourceKey } from '../utils/product-source';

/**
 * La ficha de un producto, abierta con `?producto=<id>` (plan del visor, VW7).
 * Cerrarla quita el parámetro y conserva la búsqueda y la página.
 */
export function useProductDetail(
  projectId: MaybeRefOrGetter<string>,
  source: MaybeRefOrGetter<ProductSourceRef | null>,
) {
  const { $feedViewer } = useNuxtApp();
  const route = useRoute();
  const router = useRouter();

  const productId = computed(() => {
    const value = route.query.producto;
    return typeof value === 'string' && value !== '' ? value : null;
  });

  const { data, status, error, refresh } = useAsyncData(
    () => {
      const current = toValue(source);
      const sourceKey = current ? productSourceKey(current) : 'sin-origen';
      return `product:${sourceKey}:${productId.value ?? 'ninguno'}`;
    },
    () => {
      const current = toValue(source);
      if (!current || productId.value === null) return Promise.resolve(null);
      return $feedViewer.product(toValue(projectId), current, productId.value);
    },
    { server: false, deep: false },
  );

  function open(id: string) {
    return router.push({ query: { ...route.query, producto: id } });
  }

  function close() {
    return router.push({ query: { ...route.query, producto: undefined } });
  }

  return { productId, detail: data, status, error, refresh, open, close };
}

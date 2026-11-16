import { mountSuspended } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { usePageInUrl } from '../../../app/composables/usePageInUrl';

// Sin Descope configurado, la guardia de acceso deja la app en `/session`. Las
// pruebas montan el composable en esa ruta, con su consulta: `mountSuspended`
// navega a la ruta que se le da antes de montar (opción `route`).
const TEST_PATH = '/session';

beforeEach(async () => {
  await vi.waitFor(() => expect(useRoute().path).toBe(TEST_PATH));
});

/** Monta el composable dentro de la app de Nuxt, con su router real. */
async function mountPageInUrl(query: Record<string, string>) {
  let state!: ReturnType<typeof usePageInUrl>;
  await mountSuspended(
    defineComponent({
      setup() {
        state = usePageInUrl();
        return () => null;
      },
    }),
    { route: { path: TEST_PATH, query } },
  );
  return state;
}

describe('usePageInUrl', () => {
  it('lee la página y la búsqueda de la URL', async () => {
    const { page, search } = await mountPageInUrl({
      pagina: '3',
      buscar: ' sku ',
    });

    expect(page.value).toBe(3);
    expect(search.value).toBe('sku');
  });

  it('una página no válida en la URL es la primera', async () => {
    const { page } = await mountPageInUrl({ pagina: 'abc' });

    expect(page.value).toBe(1);
  });

  it('cambiar de página conserva la búsqueda y el resto de la consulta', async () => {
    const { page, setPage } = await mountPageInUrl({
      buscar: 'sku',
      producto: 'A-1',
    });

    await setPage(2);

    expect(useRoute().query).toEqual({
      buscar: 'sku',
      producto: 'A-1',
      pagina: '2',
    });
    expect(page.value).toBe(2);
  });

  it('buscar vuelve a la primera página', async () => {
    const { page, search, setSearch } = await mountPageInUrl({ pagina: '4' });

    await setSearch('zapatilla');

    expect(useRoute().query).toEqual({ buscar: 'zapatilla' });
    expect(page.value).toBe(1);
    expect(search.value).toBe('zapatilla');
  });

  it('buscar conserva lo que dice qué archivo se mira', async () => {
    const { setSearch } = await mountPageInUrl({
      feed: 'f1',
      version: 'v1',
      pagina: '4',
    });

    await setSearch('sku');

    expect(useRoute().query).toEqual({
      feed: 'f1',
      version: 'v1',
      buscar: 'sku',
    });
  });

  it('da la dirección de cada página para usarla como enlace', async () => {
    const { pageHref } = await mountPageInUrl({ buscar: 'sku' });

    expect(pageHref(3)).toContain('buscar=sku');
    expect(pageHref(3)).toContain('pagina=3');
    expect(pageHref(1)).not.toContain('pagina=');
  });
});

import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import UiPagination from '../../../../app/components/ui/Pagination.vue';

const pageHref = (page: number) => `/productos?pagina=${page}`;

function mountPagination(page: number, count = 95) {
  return mountSuspended(UiPagination, {
    props: { page, count, pageSize: 20, pageHref },
    // La ruta en la que se queda la app sin Descope (ver usePageInUrl.test.ts).
    route: '/session',
  });
}

describe('UiPagination', () => {
  it('cada página lleva a su dirección y usa inglés por defecto', async () => {
    const wrapper = await mountPagination(2);

    const pages = wrapper.findAll('[data-part="item"]');
    expect(pages.map((link) => link.text())).toEqual(['1', '2', '3', '4', '5']);
    expect(pages.map((link) => link.attributes('href'))).toEqual(
      [1, 2, 3, 4, 5].map(pageHref),
    );
    expect(pages[2]!.attributes('aria-label')).toBe('Page 3');
    expect(pages[4]!.attributes('aria-label')).toBe('Last page, 5');
    expect(wrapper.find('[data-part="root"]').attributes('aria-label')).toBe(
      'Pagination',
    );
  });

  it('marca la página actual', async () => {
    const wrapper = await mountPagination(2);

    const current = wrapper.find('[aria-current="page"]');
    expect(current.text()).toBe('2');
    expect(current.attributes('data-selected')).toBeDefined();
    // La marca visual: el tema pinta la seleccionada con el color principal.
    expect(current.classes()).toContain('data-[selected]:bg-primary');
  });

  it('anterior y siguiente llevan a las páginas vecinas', async () => {
    const wrapper = await mountPagination(2);

    expect(wrapper.find('[data-part="prev-trigger"]').attributes('href')).toBe(
      pageHref(1),
    );
    expect(wrapper.find('[data-part="next-trigger"]').attributes('href')).toBe(
      pageHref(3),
    );
  });

  it('en los extremos, el control que no lleva a ningún sitio no es un enlace', async () => {
    const first = await mountPagination(1);
    const previous = first.find('[data-part="prev-trigger"]');
    expect(previous.element.tagName).toBe('SPAN');
    expect(previous.attributes('href')).toBeUndefined();
    expect(previous.attributes('aria-disabled')).toBe('true');

    const last = await mountPagination(5);
    const next = last.find('[data-part="next-trigger"]');
    expect(next.element.tagName).toBe('SPAN');
    expect(next.attributes('aria-disabled')).toBe('true');
  });

  it('con muchas páginas resume las del medio', async () => {
    const wrapper = await mountPagination(10, 20 * 20);

    expect(wrapper.findAll('[data-part="ellipsis"]')).toHaveLength(2);
    expect(wrapper.find('[aria-current="page"]').text()).toBe('10');
  });
});

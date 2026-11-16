import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import CopyButton from '../../../../app/components/ui/CopyButton.vue';

const text = '[mcp_servers.ktsu]\ncommand = "/ruta/local"';

it('copia el texto completo y confirma después de escribirlo', async () => {
  let finish: () => void = () => {};
  const write = vi
    .spyOn(window.navigator.clipboard, 'writeText')
    .mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
  const wrapper = await mountSuspended(CopyButton, {
    props: { text },
    route: '/session',
  });
  await wrapper.get('button').trigger('click');
  expect(write).toHaveBeenCalledWith(text);
  expect(wrapper.emitted('copied')).toBeUndefined();
  finish();
  await flushPromises();
  expect(wrapper.get('button').text()).toBe('Copied');
  expect(wrapper.emitted('copied')).toHaveLength(1);
  wrapper.unmount();
});

it('avisa si el navegador bloquea la copia', async () => {
  vi.spyOn(window.navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('denied'),
  );
  const wrapper = await mountSuspended(CopyButton, {
    props: { text },
    route: '/session',
  });
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(wrapper.get('[role="status"]').text()).toContain('Copy failed');
  expect(wrapper.emitted('copied')).toBeUndefined();
  wrapper.unmount();
});

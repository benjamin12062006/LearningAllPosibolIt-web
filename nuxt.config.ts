const featureComponents = [
  { path: '~/features/access/components' },
  { path: '~/features/organizations/components' },
  { path: '~/features/projects/components' },
  { path: '~/features/catalog/components' },
  { path: '~/features/evaluations/components' },
  { path: '~/features/rulesets/components' },
  { path: '~/features/exports/components' },
  { path: '~/features/feeds/components' },
  { path: '~/features/feed-viewer/components', prefix: 'FeedViewer' },
  { path: '~/features/worksheets/components', prefix: 'Worksheets' },
  { path: '~/features/assistant/components', prefix: 'Assistant' },
  { path: '~/features/integrations/components', prefix: 'Integrations' },
];

export default defineNuxtConfig({
  compatibilityDate: '2026-10-19',
  devtools: { enabled: false },
  // Nuxt UI registra Tailwind, iconos y modo de color por su cuenta.
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  typescript: { strict: true },
  components: [{ path: '~/components' }, ...featureComponents],
  imports: { dirs: ['composables/**', 'features/*/composables/**'] },
  // Fundido corto entre páginas; el navegador lo omite con menos movimiento.
  experimental: { viewTransition: true },
  ui: {
    // Fuente del sistema, como la referencia macOS; sin descargas en build.
    fonts: false,
  },
  // Claro por defecto (plan ui 05, U3); el menú de la cuenta lo cambia.
  colorMode: { preference: 'light', fallback: 'light' },
  icon: {
    // Lucide viene de @iconify-json/lucide: los iconos usados van en el bundle.
    clientBundle: { scan: true },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://127.0.0.1:8080/api/v1',
      descopeProjectId: '',
      descopeFlowId: 'sign-up-or-in',
      descopeBaseUrl: '',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Statistics',
      meta: [
        {
          name: 'description',
          content: 'Tus proyectos y catálogos, en un mismo lugar.',
        },
        { name: 'theme-color', content: '#362e38' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
});

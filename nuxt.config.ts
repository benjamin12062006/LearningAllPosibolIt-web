export default defineNuxtConfig({
  compatibilityDate: '2026-10-19',
  devtools: { enabled: false },
  // Nuxt UI registra Tailwind, iconos y modo de color por su cuenta.
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  typescript: { strict: true },
  ui: {
    // Fuente del sistema, como la referencia macOS; sin descargas en build.
    fonts: false,
  },
  colorMode: { preference: 'dark', fallback: 'dark' },
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
      htmlAttrs: { lang: 'es' },
      title: 'Estadística',
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

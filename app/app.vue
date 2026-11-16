<!-- UApp aporta el proveedor que necesitan toasts, tooltips y modales de Nuxt UI. -->
<script setup lang="ts">
import { en, es } from '@nuxt/ui/locale';

usePreferencesSetup();
const { language, t } = useAppLocaleSetup();
useHead({ htmlAttrs: { lang: language }, title: () => t('Estadística') });
</script>

<template>
  <UApp
    :locale="language === 'es' ? es : en"
    :toaster="{ position: 'bottom-right' }"
  >
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

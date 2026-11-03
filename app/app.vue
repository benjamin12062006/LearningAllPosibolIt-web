<!-- UApp aporta el proveedor que necesitan toasts, tooltips y modales de Nuxt UI. -->
<template>
  <UApp :toaster="{ position: 'bottom-right' }">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

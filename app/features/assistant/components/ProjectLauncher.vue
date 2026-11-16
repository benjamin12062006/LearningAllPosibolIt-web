<script setup lang="ts">
import { useAssistantWorkspace } from '../composables/useAssistantWorkspace';

const { open, busy, workbookId, hasProject } = useAssistantWorkspace();

function toggle() {
  if (!hasProject.value) return navigateTo('/chats');
  workbookId.value = '';
  open.value = !open.value;
}
</script>

<template>
  <UButton
    :aria-label="open ? $t('Cerrar asistente') : $t('Abrir asistente')"
    :aria-pressed="open"
    color="neutral"
    variant="soft"
    class="touch-target size-9 justify-center rounded-lg border border-default bg-elevated shadow-sm hover:bg-accented lg:size-11 lg:rounded-xl"
    :ui="{ leadingIcon: 'size-5 lg:size-6' }"
    @click="toggle"
  >
    <AssistantMascotIcon
      :state="busy ? 'thinking' : 'idle'"
      :frame="0"
      class="size-7"
    />
  </UButton>
</template>

<script setup lang="ts">
import { useAccess } from '../composables/useAccess';
import { Descope } from '@descope/vue-sdk';

const props = defineProps<{ attempt: number }>();
const { actions } = useAccess();
const { language } = useAppLocale();
const config = useRuntimeConfig().public;
const ready = ref(false);
const redirectUrl = `${window.location.origin}/auth`;
let timeout: ReturnType<typeof setTimeout> | undefined;

function onReady() {
  ready.value = true;
  clearTimeout(timeout);
}

function onSuccess() {
  clearTimeout(timeout);
  void actions.completeSignIn(props.attempt);
}

function onError() {
  clearTimeout(timeout);
  actions.failSignIn(props.attempt);
}

onMounted(() => {
  timeout = setTimeout(onError, 30_000);
});
onBeforeUnmount(() => clearTimeout(timeout));
</script>

<template>
  <div class="mt-7 min-h-[390px]">
    <p v-if="!ready" role="status" class="mb-4 text-sm text-muted">
      {{ $t('Preparando tu acceso…') }}
    </p>
    <Descope
      :flow-id="config.descopeFlowId"
      :redirect-url="redirectUrl"
      theme="light"
      :locale="language"
      :auto-focus="true"
      @ready="onReady"
      @success="onSuccess"
      @error="onError"
    />
  </div>
</template>

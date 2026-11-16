<script setup lang="ts">
import { useAccess } from '../features/access/composables/useAccess';
import { MASCOT_LABELS, MOTION_LABELS } from '../utils/preferences';

definePageMeta({ layout: 'workspace', alias: ['/account'] });

const { state, actions } = useAccess();
const { language, t } = useAppLocale();
const colorMode = useColorMode();
const user = computed(() =>
  state.value.status === 'ready' ? state.value.user : null,
);
const memberSince = computed(() =>
  user.value
    ? new Intl.DateTimeFormat(language.value, { dateStyle: 'medium' }).format(
        new Date(user.value.createdAt),
      )
    : '',
);
useHead({ title: () => t('Configuración') });

const languageOptions = { en: 'English', es: 'Español' };
const themes = computed(() => ({
  light: t('Claro'),
  dark: t('Oscuro'),
  system: t('Sistema'),
}));
const theme = computed({
  get: () =>
    colorMode.preference === 'light' || colorMode.preference === 'dark'
      ? colorMode.preference
      : 'system',
  set: (value: 'light' | 'dark' | 'system') => {
    colorMode.preference = value;
  },
});
const { preferences, setMotion, setMascot } = usePreferences();
const motion = computed({
  get: () => preferences.value.motion,
  set: setMotion,
});
const mascot = computed({
  get: () => preferences.value.mascot,
  set: setMascot,
});
const motionOptions = computed(() => ({
  full: t(MOTION_LABELS.full),
  reduced: t(MOTION_LABELS.reduced),
}));
const mascotOptions = computed(() => ({
  animated: t(MASCOT_LABELS.animated),
  still: t(MASCOT_LABELS.still),
  hidden: t(MASCOT_LABELS.hidden),
}));
</script>

<template>
  <WorkspacePage id="settings" :title="t('Configuración')" compact-cover>
    <section
      aria-labelledby="preferences-title"
      class="rounded-xl border border-default bg-muted/35 px-4 sm:px-5"
    >
      <h2
        id="preferences-title"
        class="border-b border-default py-3 text-sm font-semibold"
      >
        {{ t('Preferencias') }}
      </h2>
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-default py-2.5"
      >
        <div>
          <p class="text-sm">{{ t('Idioma') }}</p>
          <p class="text-xs text-muted">
            {{ t('Idioma de la interfaz y del asistente.') }}
          </p>
        </div>
        <UiSegmentChoice
          v-model="language"
          :label="t('Idioma')"
          :options="languageOptions"
        />
      </div>
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-default py-2.5"
      >
        <p class="text-sm">{{ t('Tema') }}</p>
        <UiSegmentChoice v-model="theme" :label="t('Tema')" :options="themes" />
      </div>
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-default py-2.5"
      >
        <p class="text-sm">{{ t('Movimiento') }}</p>
        <UiSegmentChoice
          v-model="motion"
          :label="t('Movimiento')"
          :options="motionOptions"
        />
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 py-2.5">
        <p class="text-sm">{{ t('Mascota del asistente') }}</p>
        <UiSegmentChoice
          v-model="mascot"
          :label="t('Mascota del asistente')"
          :options="mascotOptions"
        />
      </div>
    </section>
    <section
      v-if="user"
      aria-labelledby="account-title"
      class="mt-5 rounded-xl border border-default bg-muted/35 px-4 sm:px-5"
    >
      <div
        class="flex items-center justify-between gap-3 border-b border-default py-2.5"
      >
        <h2 id="account-title" class="text-sm font-semibold">
          {{ t('Cuenta') }}
        </h2>
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-log-out"
          @click="actions.signOut"
        >
          {{ t('Cerrar sesión') }}
        </UButton>
      </div>
      <dl class="text-sm">
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-b border-default py-2.5"
        >
          <dt class="text-muted">{{ t('Correo') }}</dt>
          <dd class="wrap-anywhere select-text">
            {{ user.email ?? t('Sin correo disponible') }}
          </dd>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <dt class="text-muted">{{ t('Miembro desde') }}</dt>
          <dd>
            <time :datetime="user.createdAt">{{ memberSince }}</time>
          </dd>
        </div>
      </dl>
    </section>
  </WorkspacePage>
</template>

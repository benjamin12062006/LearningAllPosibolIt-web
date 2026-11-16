<script setup lang="ts">
import { MASCOT_FRAMES, MASCOT_INTERVAL } from '../utils/mascot-frames';
import type { RouteLocationRaw } from 'vue-router';
import type { LiveRun } from '../utils/run-state';

const props = withDefaults(
  defineProps<{
    live: LiveRun;
    visible?: boolean;
    destination?: RouteLocationRaw;
  }>(),
  { visible: true, destination: undefined },
);
const emit = defineEmits<{ locate: [columnId?: string] }>();
const { mascot } = usePreferences();
const dock = useTemplateRef('dock');
const traveler = useTemplateRef('traveler');
const router = useRouter();
const hiddenTab = ref(false);
const frame = ref(0);
const displayState = computed(() =>
  hiddenTab.value ? 'asleep' : currentState.value,
);
const currentState = ref<LiveRun['state']>('idle');
const travelPosition = shallowRef<{ x: number; y: number } | null>(null);
const outside = ref(false);
let animation: Animation | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

function updateVisibility() {
  hiddenTab.value = document.hidden;
}

onMounted(() => {
  updateVisibility();
  document.addEventListener('visibilitychange', updateVisibility);
  window.addEventListener('resize', clearTravel);
  document.addEventListener('scroll', clearTravel, {
    capture: true,
    passive: true,
  });
});
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', updateVisibility);
  document.removeEventListener('scroll', clearTravel, true);
  window.removeEventListener('resize', clearTravel);
  clearTravel();
  clearTimeout(timer);
});

watch(
  [() => props.live.state, mascot, hiddenTab, () => props.visible],
  ([state]) => {
    clearTimeout(timer);
    frame.value = 0;
    currentState.value = state;
    if (props.visible && mascot.value === 'animated' && !hiddenTab.value)
      scheduleFrame(state);
  },
  { immediate: true },
);

watch(
  [
    () => props.live.target,
    () => props.destination,
    () => props.visible,
    mascot,
    hiddenTab,
  ],
  () => void travel(),
  {
    flush: 'post',
  },
);

function scheduleFrame(state: LiveRun['state']) {
  const delay = MASCOT_INTERVAL[state];
  if (!delay) return;
  timer = setTimeout(() => {
    if (state === 'done') {
      currentState.value = 'idle';
      scheduleFrame('idle');
      return;
    }
    frame.value = (frame.value + 1) % MASCOT_FRAMES[state].length;
    if (state === 'idle' && frame.value === 1) {
      timer = setTimeout(() => {
        frame.value = 0;
        scheduleFrame('idle');
      }, 140);
      return;
    }
    scheduleFrame(state);
  }, delay);
}

function clearTravel() {
  animation?.cancel();
  travelPosition.value = null;
  outside.value = false;
}

async function travel() {
  clearTravel();
  if (
    !props.visible ||
    mascot.value !== 'animated' ||
    hiddenTab.value ||
    !dock.value
  )
    return;
  const target = props.live.target;
  const sheet = [
    ...document.querySelectorAll<HTMLElement>('[data-assistant-sheet]'),
  ].find((element) => element.dataset.assistantSheet === target?.worksheetId);
  const id = target?.columnIds[0];
  const anchor =
    sheet && id
      ? sheet.querySelector<HTMLElement>(`[data-ai-anchor="${CSS.escape(id)}"]`)
      : (sheet ?? pageAnchor());
  const position = anchor?.getBoundingClientRect();
  const viewport = sheet?.getBoundingClientRect();
  if (
    viewport &&
    (!position ||
      position.right > Math.min(viewport.right, innerWidth) ||
      position.x < Math.max(0, viewport.left))
  ) {
    outside.value = true;
    return;
  }
  if (!position || position.width === 0) return;
  const focus = document.activeElement?.getBoundingClientRect();
  const x = Math.min(position.right, innerWidth - 48);
  const y = Math.max(0, position.top - 48);
  const coversFocus =
    focus &&
    x < focus.right &&
    x + 48 > focus.left &&
    y < focus.bottom &&
    y + 48 > focus.top;
  if (coversFocus || position.top >= innerHeight) return;
  const start = dock.value.getBoundingClientRect();
  if (start.width === 0) return;
  travelPosition.value = { x, y };
  await nextTick();
  if (!traveler.value || !travelPosition.value) return;
  animation = traveler.value.animate(
    [
      { transform: `translate(${start.x - x}px,${start.y - y}px)` },
      { transform: 'translate(0,0)' },
    ],
    { duration: 450, easing: 'ease-in-out' },
  );
  if (!sheet) {
    const currentAnimation = animation;
    currentAnimation.finished
      .then(() => {
        if (animation === currentAnimation)
          setTimeout(() => {
            if (animation === currentAnimation) clearTravel();
          }, 1200);
      })
      .catch(() => undefined);
  }
}

function pageAnchor() {
  if (!props.destination) return;
  const route = router.resolve(props.destination);
  if (route.path !== router.currentRoute.value.path) return;
  const specific = route.hash && document.getElementById(route.hash.slice(1));
  if (specific) return specific;
  return [
    ...document.querySelectorAll<HTMLElement>('[data-assistant-route-anchor]'),
  ].find((element) => element.getClientRects().length > 0);
}
</script>

<template>
  <div v-if="mascot !== 'hidden'" class="flex items-center gap-2">
    <div ref="dock" class="size-12 pointer-events-none" aria-hidden="true">
      <AssistantMascotIcon
        v-if="!travelPosition"
        :state="displayState"
        :frame="frame"
      />
    </div>
    <UButton
      v-if="outside"
      size="xs"
      variant="ghost"
      icon="i-lucide-arrow-up-right"
      @click="emit('locate', live.target?.columnIds[0])"
      >{{ $t('Ir a la columna') }}</UButton
    >
    <Teleport to="body">
      <div
        v-if="travelPosition"
        ref="traveler"
        class="pointer-events-none fixed z-(--layer-bar)"
        aria-hidden="true"
        :style="{ left: `${travelPosition.x}px`, top: `${travelPosition.y}px` }"
      >
        <AssistantMascotIcon :state="displayState" :frame="frame" />
      </div>
    </Teleport>
  </div>
</template>

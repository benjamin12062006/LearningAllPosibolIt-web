<script setup lang="ts">
import {
  MASCOT_BODY,
  MASCOT_SCREEN,
  MASCOT_FRAMES,
} from '../utils/mascot-frames';

defineProps<{ frame: number; state: keyof typeof MASCOT_FRAMES }>();
</script>

<template>
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    shape-rendering="crispEdges"
    aria-hidden="true"
    class="pointer-events-none"
  >
    <path :d="MASCOT_BODY" fill="var(--app-ai)" />
    <path d="M12 3h1v4h4v2h3v2h1v7h-2v2H5v-2H3v-7h2V9h2V7h5z" fill="#7dd3fc" />
    <path d="M7 8h5v1H7zM4 11h1v5H4z" fill="#e0f2fe" />
    <path :d="MASCOT_SCREEN" fill="#18181b" />
    <rect
      v-for="([x, y, width = 1, height = 1], index) in MASCOT_FRAMES[state][
        frame
      ] ?? MASCOT_FRAMES[state][0]"
      :key="index"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      fill="#bae6fd"
    />
  </svg>
</template>

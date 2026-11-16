<script setup lang="ts">
import { renderAssistantMarkdown } from '../utils/markdown';

const props = defineProps<{ content: string }>();
const html = computed(() => renderAssistantMarkdown(props.content));
</script>

<template>
  <!-- Marked escapes HTML and emits only links with an allowed scheme. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="assistant-answer" v-html="html" />
</template>

<style scoped>
.assistant-answer {
  min-width: 0;
  overflow-wrap: anywhere;
  line-height: 1.65;
}
.assistant-answer :deep(> * + *) {
  margin-block-start: 0.75rem;
}
.assistant-answer :deep(h1),
.assistant-answer :deep(h2),
.assistant-answer :deep(h3),
.assistant-answer :deep(h4) {
  font-weight: 650;
  color: var(--ui-text-highlighted);
  line-height: 1.35;
}
.assistant-answer :deep(h1) {
  font-size: 1.125rem;
}
.assistant-answer :deep(h2) {
  font-size: 1rem;
}
.assistant-answer :deep(ul),
.assistant-answer :deep(ol) {
  padding-inline-start: 1.3rem;
}
.assistant-answer :deep(ul) {
  list-style-type: disc;
}
.assistant-answer :deep(ol) {
  list-style-type: decimal;
}
.assistant-answer :deep(li + li) {
  margin-block-start: 0.25rem;
}
.assistant-answer :deep(a) {
  color: var(--app-ai);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.assistant-answer :deep(code) {
  background: var(--ui-bg-elevated);
  border-radius: 0.25rem;
  padding: 0.1rem 0.25rem;
}
.assistant-answer :deep(pre) {
  overflow-x: auto;
  white-space: pre;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: var(--ui-bg-elevated);
}
.assistant-answer :deep(pre code) {
  padding: 0;
}
.assistant-answer :deep(blockquote) {
  border-inline-start: 2px solid var(--ui-border-accented);
  padding-inline-start: 0.75rem;
  color: var(--ui-text-muted);
}
.assistant-answer :deep(table) {
  display: block;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
}
.assistant-answer :deep(th),
.assistant-answer :deep(td) {
  min-width: 5rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--ui-border);
}
.assistant-answer :deep(th) {
  background: var(--ui-bg-elevated);
}
.assistant-answer :deep(hr) {
  border-color: var(--ui-border);
}
</style>

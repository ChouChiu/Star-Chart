<script setup lang="ts">
import { computed } from "vue";
import type { ChartType, RepoData } from "../types";

const props = defineProps<{
  repos: RepoData[];
  chartType: ChartType;
  svg: string;
}>();

const emit = defineEmits<{
  remove: [fullName: string];
  "update:chartType": [value: ChartType];
}>();

const showToggle = computed(() => props.repos.length >= 2);
const anyLoading = computed(() => props.repos.some((r) => r.loading));
const anyTokenRequired = computed(() =>
  props.repos.some((r) => r.error?.startsWith("[token-required]")),
);
function tokenMessage(error: string): string {
  return error.replace("[token-required] ", "");
}
</script>

<template>
  <var-space direction="column" size="12">
    <!-- Repo chips -->
    <var-space v-if="repos.length > 0" :size="[8, 8]" wrap>
      <var-chip
        v-for="repo in repos"
        :key="repo.fullName"
        size="small"
        closeable
        @close="emit('remove', repo.fullName)"
      >
        <var-space size="6" inline>
          <code class="repo-name">{{ repo.fullName }}</code>
          <span
            v-if="repo.error?.startsWith('[token-required]')"
            class="chip-status token-required"
            :title="tokenMessage(repo.error)"
          >
            🔑
          </span>
          <span v-else-if="repo.error" class="chip-status error" :title="repo.error">!</span>
          <span v-else-if="repo.loading" class="chip-spinner" />
          <span v-else class="chip-status ok">
            {{ repo.stars.length > 0 ? repo.stars[repo.stars.length - 1]!.count : 0 }} ★
          </span>
        </var-space>
      </var-chip>
    </var-space>

    <!-- Token prompt -->
    <var-paper v-if="anyTokenRequired" :elevation="0" class="token-prompt">
      <var-space size="4" inline>
        <span>⚠️</span>
        <span>
          GitHub API rate limit reached. Add a
          <var-link
            type="primary"
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            personal access token
          </var-link>
          (no scopes needed for public repos).
        </span>
      </var-space>
    </var-paper>

    <!-- Chart type toggle -->
    <div v-if="showToggle" class="chart-controls">
      <var-space size="8" inline>
        <var-switch
          :model-value="chartType === 'bar'"
          size="20"
          @update:model-value="
            emit('update:chartType', $event ? 'bar' : 'line')
          "
        />
        <span class="toggle-label">Bar chart</span>
      </var-space>
    </div>

    <!-- SVG chart -->
    <div class="chart-container" :class="{ loading: anyLoading }">
      <var-loading
        v-if="anyLoading"
        type="circle"
        description="Loading star history…"
        class="chart-loading-overlay"
      />
      <div v-html="svg" class="chart-svg"></div>
    </div>
  </var-space>
</template>

<style scoped>
.repo-name {
  font-family: monospace;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}
.chip-status {
  font-size: var(--font-size-xs);
}
.chip-status.error {
  color: var(--color-danger);
  cursor: help;
  font-weight: 700;
}
.chip-status.token-required {
  color: var(--color-warning);
  cursor: help;
}
.chip-status.ok {
  color: var(--color-success);
  font-weight: 600;
}
.chip-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-surface-container-high);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.token-prompt {
  padding: 10px 14px;
  background: var(--color-warning-container);
  color: var(--color-on-warning-container);
  border-radius: 8px;
  font-size: var(--font-size-sm);
}
.chart-controls {
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
}
.toggle-label {
  user-select: none;
}
.chart-container {
  border: 1px solid var(--color-outline);
  border-radius: 12px;
  background: var(--color-surface-container);
  overflow: hidden;
  position: relative;
}
.chart-container.loading .chart-svg {
  opacity: 0.3;
}
.chart-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chart-svg :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>

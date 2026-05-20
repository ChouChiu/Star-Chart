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
  <div class="star-chart">
    <!-- Repo list -->
    <div v-if="repos.length > 0" class="repo-list">
      <div v-for="repo in repos" :key="repo.fullName" class="repo-tag">
        <span class="repo-name">{{ repo.fullName }}</span>
        <span v-if="repo.error?.startsWith('[token-required]')" class="repo-status token-required" :title="tokenMessage(repo.error)">🔑 token</span>
        <span v-else-if="repo.error" class="repo-status error" :title="repo.error">error</span>
        <span v-else-if="repo.loading" class="repo-status loading" />
        <span v-else class="repo-status ok">{{ repo.stars.length > 0 ? repo.stars[repo.stars.length - 1]!.count : 0 }} ★</span>
        <button class="repo-remove" @click="emit('remove', repo.fullName)" title="Remove">✕</button>
      </div>
    </div>

    <!-- Token prompt -->
    <div v-if="anyTokenRequired" class="token-prompt">
      ⚠️ GitHub API rate limit reached. Add a
      <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">personal access token</a>
      (no scopes needed for public repos).
    </div>

    <!-- Chart type toggle -->
    <div v-if="showToggle" class="chart-controls">
      <label class="toggle-label">
        <input
          type="checkbox"
          :checked="chartType === 'bar'"
          @change="emit('update:chartType', chartType === 'bar' ? 'line' : 'bar')"
        />
        Bar chart
      </label>
    </div>

    <!-- SVG chart -->
    <div class="chart-container" :class="{ loading: anyLoading }">
      <div v-if="anyLoading" class="chart-loading-overlay">
        <span class="chart-loading-spinner" />
        <span class="chart-loading-text">Loading star history…</span>
      </div>
      <div v-html="svg"></div>
    </div>
  </div>
</template>

<style scoped>
.star-chart {
  margin-top: 16px;
}
.repo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.repo-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 13px;
}
.repo-name {
  font-family: monospace;
  color: #333;
}
.repo-status {
  font-size: 11px;
}
.repo-status.loading {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #d0d0d0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}
.repo-status.error {
  color: #dc2626;
  cursor: help;
}
.repo-status.token-required {
  color: #ea580c;
  cursor: help;
  font-weight: 600;
}
.repo-status.ok {
  color: #16a34a;
  font-weight: 600;
}
.repo-remove {
  border: none;
  background: none;
  cursor: pointer;
  color: #999;
  font-size: 13px;
  padding: 0 2px;
  line-height: 1;
}
.repo-remove:hover {
  color: #dc2626;
}
.token-prompt {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 6px;
  font-size: 13px;
  color: #9a3412;
}
.token-prompt a {
  color: #2563eb;
  text-decoration: underline;
}
.chart-controls {
  margin-bottom: 12px;
  font-size: 13px;
}
.toggle-label {
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.chart-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  position: relative;
}
.chart-container.loading :deep(svg) {
  opacity: 0.3;
}
.chart-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 1;
}
.chart-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.chart-loading-text {
  font-size: 14px;
  color: #666;
  font-family: sans-serif;
}
.chart-container :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>

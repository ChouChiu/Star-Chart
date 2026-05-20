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
</script>

<template>
  <div class="star-chart">
    <!-- Repo list -->
    <div v-if="repos.length > 0" class="repo-list">
      <div v-for="repo in repos" :key="repo.fullName" class="repo-tag">
        <span class="repo-name">{{ repo.fullName }}</span>
        <span v-if="repo.loading" class="repo-status loading">loading…</span>
        <span v-else-if="repo.error" class="repo-status error" :title="repo.error">error</span>
        <span v-else class="repo-status ok">{{ repo.stars.length > 0 ? repo.stars[repo.stars.length - 1]!.count : 0 }} ★</span>
        <button class="repo-remove" @click="emit('remove', repo.fullName)" title="Remove">✕</button>
      </div>
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
    <div class="chart-container" v-html="svg"></div>
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
  color: #999;
}
.repo-status.error {
  color: #dc2626;
  cursor: help;
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
}
.chart-container :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>

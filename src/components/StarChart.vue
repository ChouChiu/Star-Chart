<script setup lang="ts">
import { computed, ref } from "vue";
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

const showEmbed = ref(false);
const copiedRepo = ref<string | null>(null);

const hasData = computed(() =>
  props.repos.some((r) => r.stars.length > 0 && !r.loading && !r.error),
);

function tokenMessage(error: string): string {
  return error.replace("[token-required] ", "");
}

function apiBase(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

function chartUrl(repo: RepoData): string {
  const parts = repo.fullName.split("/");
  return `${apiBase()}/api/chart?owner=${encodeURIComponent(parts[0] ?? "")}&repo=${encodeURIComponent(parts[1] ?? "")}&type=${props.chartType}`;
}

function downloadUrl(repo: RepoData): string {
  return `${chartUrl(repo)}&download=1`;
}

function embedCode(repo: RepoData): string {
  const light = chartUrl(repo);
  const dark = `${chartUrl(repo)}&theme=dark`;
  return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${dark}" />
  <source media="(prefers-color-scheme: light)" srcset="${light}" />
  <img alt="Star History Chart" src="${light}" />
</picture>`;
}

function downloadSvg() {
  const blob = new Blob([props.svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `star-chart-${props.chartType}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copyEmbed(repo: RepoData) {
  try {
    await navigator.clipboard.writeText(embedCode(repo));
    copiedRepo.value = repo.fullName;
    setTimeout(() => {
      if (copiedRepo.value === repo.fullName) copiedRepo.value = null;
    }, 2000);
  } catch {
    copiedRepo.value = null;
  }
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
      <!-- Floating actions -->
      <div v-if="hasData" class="chart-actions">
        <var-space size="6">
          <var-button size="small" @click="downloadSvg">
            ⬇ Download SVG
          </var-button>
          <var-button size="small" :type="showEmbed ? 'primary' : 'default'" @click="showEmbed = !showEmbed">
            &lt;/&gt; Embed Code
          </var-button>
        </var-space>
      </div>
    </div>

    <!-- Embed code panel -->
    <var-paper v-if="showEmbed && hasData" :elevation="1" class="embed-panel">
      <var-space direction="column" size="12">
        <div class="embed-header">
          <span class="embed-title">Embed Code</span>
          <span class="embed-hint">
            Paste this HTML into your README or website. Updates every 3 days.
          </span>
        </div>
        <div
          v-for="repo in repos.filter((r) => r.stars.length > 0 && !r.error)"
          :key="repo.fullName"
          class="embed-repo"
        >
          <div class="embed-repo-name">{{ repo.fullName }}</div>
          <pre class="embed-code"><code>{{ embedCode(repo) }}</code></pre>
          <var-space size="8" class="embed-actions">
            <var-button size="small" @click="copyEmbed(repo)">
              {{ copiedRepo === repo.fullName ? "✓ Copied!" : "📋 Copy" }}
            </var-button>
            <var-button size="small" text @click="() => window.open(downloadUrl(repo), '_blank')">
              🔗 Open URL
            </var-button>
          </var-space>
        </div>
      </var-space>
    </var-paper>
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

/* Chart actions — overlay at bottom-right */
.chart-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s;
}
.chart-container:hover .chart-actions,
.chart-container:focus-within .chart-actions {
  opacity: 1;
}

/* Embed panel */
.embed-panel {
  padding: 16px;
  background: var(--color-surface-container-high);
  border-radius: 10px;
}
.embed-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.embed-title {
  font-weight: 600;
  font-size: var(--font-size-md);
  color: var(--color-text);
}
.embed-hint {
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
}
.embed-repo {
  border-top: 1px solid var(--color-outline);
  padding-top: 12px;
}
.embed-repo-name {
  font-family: monospace;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  margin-bottom: 6px;
}
.embed-code {
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-outline);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: var(--font-size-xs);
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}
.embed-code code {
  font-family: monospace;
  color: var(--color-on-surface);
}
.embed-actions {
  margin-top: 6px;
}
</style>

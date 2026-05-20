<script setup lang="ts">
import { ref } from "vue";
import RepoInput from "./components/RepoInput.vue";
import StarChart from "./components/StarChart.vue";
import TokenInput from "./components/TokenInput.vue";
import { useStarHistory } from "./composables/useStarHistory";
import { useSvgChart } from "./composables/useSvgChart";
import type { ChartType } from "./types";

const token = ref("");
const chartType = ref<ChartType>("line");
const { repos, addRepo, removeRepo, allDates } = useStarHistory(token);
const { svg } = useSvgChart(repos, chartType, allDates);
</script>

<template>
  <var-space direction="column" size="24" class="app">
    <var-space direction="column" size="4">
      <h1 class="title">Star Chart Generator</h1>
      <p class="subtitle">Generate clean SVG star-history charts for any GitHub repository</p>
    </var-space>

    <var-space direction="column" size="16">
      <RepoInput @add="addRepo" />
      <TokenInput v-model="token" />
      <StarChart
        :repos="repos"
        :chart-type="chartType"
        :svg="svg"
        @remove="removeRepo"
        @update:chart-type="chartType = $event"
      />
    </var-space>
  </var-space>
</template>

<style scoped>
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}
.title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}
.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  margin: 0;
}
</style>

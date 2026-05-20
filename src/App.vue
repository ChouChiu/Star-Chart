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
  <div class="app">
    <header class="header">
      <h1 class="title">Star Chart Generator</h1>
      <p class="subtitle">Generate clean SVG star-history charts for any GitHub repository</p>
    </header>

    <main class="main">
      <RepoInput @add="addRepo" />
      <TokenInput v-model="token" />

      <StarChart
        :repos="repos"
        :chart-type="chartType"
        :svg="svg"
        @remove="removeRepo"
        @update:chart-type="chartType = $event"
      />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}
.header {
  margin-bottom: 24px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}
.subtitle {
  font-size: 14px;
  color: #888;
}
.main {
  display: flex;
  flex-direction: column;
}
</style>

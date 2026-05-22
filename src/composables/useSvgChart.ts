import { computed, type Ref } from "vue";
import { generateChartSvg } from "../../shared/chart-svg";
import type { ChartType, RepoData } from "../types";

export function useSvgChart(
  repos: Ref<RepoData[]>,
  chartType: Ref<ChartType>,
  allDates: Ref<string[]>,
) {
  const svg = computed(() =>
    generateChartSvg(
      repos.value.map((r) => ({ fullName: r.fullName, stars: r.stars })),
      chartType.value,
      allDates.value,
    ),
  );

  return { svg };
}

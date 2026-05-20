import { computed, type Ref } from "vue";
import type { ChartType, RepoData } from "../types";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];

const MARGIN = { top: 40, right: 60, bottom: 70, left: 70 };
const W = 900;
const H = 500;
const CHART_W = W - MARGIN.left - MARGIN.right;
const CHART_H = H - MARGIN.top - MARGIN.bottom;

function formatNumber(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  }
  return String(n);
}

function formatDate(d: string): string {
  // d is YYYY-MM-DD
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[1]}/${parts[2]}`; // MM/DD
}

function buildScales(repos: RepoData[], allDates: string[]) {
  const maxStars =
    repos.length > 0
      ? Math.max(...repos.map((r) => (r.stars.length > 0 ? r.stars[r.stars.length - 1]!.count : 0)))
      : 0;

  const paddedMax = maxStars === 0 ? 10 : Math.ceil(maxStars * 1.1);

  const xScale = (dateIndex: number): number => {
    if (allDates.length <= 1) return MARGIN.left + CHART_W / 2;
    return MARGIN.left + (dateIndex / (allDates.length - 1)) * CHART_W;
  };

  const yScale = (count: number): number => {
    return MARGIN.top + CHART_H - (count / paddedMax) * CHART_H;
  };

  return { maxStars: paddedMax, xScale, yScale, dateCount: allDates.length };
}

function yAxisTicks(maxStars: number): number[] {
  if (maxStars <= 0) return [0];
  const step = niceStep(maxStars, 5);
  const ticks: number[] = [];
  for (let i = 0; i <= maxStars; i += step) {
    ticks.push(i);
  }
  if (ticks[ticks.length - 1]! < maxStars) {
    ticks.push(maxStars);
  }
  return ticks;
}

function niceStep(max: number, targetTicks: number): number {
  const rough = max / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  let nice: number;
  if (residual <= 1.5) nice = 1;
  else if (residual <= 3) nice = 2;
  else if (residual <= 7) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

export function useSvgChart(
  repos: Ref<RepoData[]>,
  chartType: Ref<ChartType>,
  allDates: Ref<string[]>,
) {
  const svg = computed(() => {
    if (repos.value.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%">
        <rect width="${W}" height="${H}" fill="#fafafa" rx="8"/>
        <text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#999" font-family="monospace" font-size="16">
          Enter a GitHub repo to get started
        </text>
      </svg>`;
    }

    const dates = allDates.value;
    const { maxStars, xScale, yScale } = buildScales(repos.value, dates);
    const ticks = yAxisTicks(maxStars);

    let svgContent = "";

    // Background
    svgContent += `<rect width="${W}" height="${H}" fill="#fff" rx="4"/>`;

    // Y-axis grid lines + labels
    for (const tick of ticks) {
      const y = yScale(tick);
      svgContent += `<line x1="${MARGIN.left}" y1="${y}" x2="${W - MARGIN.right}" y2="${y}" stroke="#e8e8e8" stroke-width="1"/>`;
      svgContent += `<text x="${MARGIN.left - 8}" y="${y + 4}" text-anchor="end" fill="#666" font-family="monospace" font-size="11">${formatNumber(tick)}</text>`;
    }

    // X-axis labels (dates) — at most ~8 ticks
    const dateStep = Math.max(1, Math.floor(dates.length / 8));
    const labelDates = new Set<string>();
    for (let i = 0; i < dates.length; i += dateStep) {
      const date = dates[i]!;
      labelDates.add(date);
      const x = xScale(i);
      svgContent += `<text x="${x}" y="${MARGIN.top + CHART_H + 16}" text-anchor="start" fill="#666" font-family="monospace" font-size="10" transform="rotate(-45, ${x}, ${MARGIN.top + CHART_H + 16})">${formatDate(date)}</text>`;
    }

    // Axes
    svgContent += `<line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${MARGIN.top + CHART_H}" stroke="#333" stroke-width="1.5"/>`;
    svgContent += `<line x1="${MARGIN.left}" y1="${MARGIN.top + CHART_H}" x2="${W - MARGIN.right}" y2="${MARGIN.top + CHART_H}" stroke="#333" stroke-width="1.5"/>`;

    // Data series
    if (chartType.value === "bar") {
      const repoCount = repos.value.length;
      const barGroupWidth = dates.length > 1 ? CHART_W / (dates.length - 1) : CHART_W;
      const barWidth = Math.max(3, (barGroupWidth * 0.7) / repoCount);
      const gap = 2;

      for (let ri = 0; ri < repoCount; ri++) {
        const repo = repos.value[ri]!;
        const color = COLORS[ri % COLORS.length]!;
        const dateIndexMap = new Map<string, number>();
        for (let i = 0; i < dates.length; i++) {
          dateIndexMap.set(dates[i]!, i);
        }

        const lastIdx = repo.stars.length - 1;
        for (let si = 0; si < repo.stars.length; si++) {
          const point = repo.stars[si]!;
          const di = dateIndexMap.get(point.date);
          if (di === undefined) continue;
          const x = xScale(di);
          const barX = x - barGroupWidth * 0.35 + ri * (barWidth + gap);
          const barY = yScale(point.count);
          const barH = MARGIN.top + CHART_H - barY;

          svgContent += `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" fill="${color}" rx="1"/>`;

          const isLabeled = labelDates.has(point.date) || si === 0 || si === lastIdx;
          if (isLabeled) {
            svgContent += `<text x="${barX + barWidth / 2}" y="${barY - 4}" text-anchor="middle" fill="#333" font-family="monospace" font-size="9">${point.count}</text>`;
          }
        }
      }
    } else {
      // Line chart
      for (let ri = 0; ri < repos.value.length; ri++) {
        const repo = repos.value[ri]!;
        const color = COLORS[ri % COLORS.length]!;
        if (repo.stars.length === 0) continue;

        const dateIndexMap = new Map<string, number>();
        for (let i = 0; i < dates.length; i++) {
          dateIndexMap.set(dates[i]!, i);
        }

        // Polyline
        const points = repo.stars
          .map((p) => {
            const di = dateIndexMap.get(p.date);
            if (di === undefined) return null;
            return `${xScale(di)},${yScale(p.count)}`;
          })
          .filter(Boolean)
          .join(" ");

        if (points) {
          svgContent += `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
        }

        // Data points + labels (labels only at tick dates + first/last)
        const lastIdx = repo.stars.length - 1;
        for (let si = 0; si < repo.stars.length; si++) {
          const point = repo.stars[si]!;
          const di = dateIndexMap.get(point.date);
          if (di === undefined) continue;
          const cx = xScale(di);
          const cy = yScale(point.count);

          svgContent += `<rect x="${cx - 3}" y="${cy - 3}" width="6" height="6" fill="${color}" rx="0"/>`;

          const isLabeled = labelDates.has(point.date) || si === 0 || si === lastIdx;
          if (isLabeled) {
            svgContent += `<text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="#333" font-family="monospace" font-size="9">${point.count}</text>`;
          }
        }
      }
    }

    // Legend
    let legendX = MARGIN.left;
    for (let ri = 0; ri < repos.value.length; ri++) {
      const repo = repos.value[ri]!;
      const color = COLORS[ri % COLORS.length]!;
      svgContent += `<rect x="${legendX}" y="10" width="12" height="12" fill="${color}" rx="1"/>`;
      svgContent += `<text x="${legendX + 16}" y="21" fill="#333" font-family="sans-serif" font-size="12">${repo.fullName}</text>`;
      legendX += repo.fullName.length * 7 + 48;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%">${svgContent}</svg>`;
  });

  return { svg };
}

import { computed, type Ref } from "vue";
import type { ChartType, RepoData } from "../types";

// -- style constants (clean, rectilinear — no xkcd) --

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];
const MARGIN = { top: 50, right: 30, bottom: 50, left: 70 };
const W = 900;
const H = 600; // 3:2 ratio like star-history
const CHART_W = W - MARGIN.left - MARGIN.right;
const CHART_H = H - MARGIN.top - MARGIN.bottom;

// -- formatters --

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDate(d: string): string {
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]?.slice(2)}`; // dd/mm/yy
}

// -- scales --

function xTickDates(dates: string[]): string[] {
  // Produce ~5 nice date ticks across the range
  if (dates.length === 0) return [];
  const firstDate = dates[0];
  const endDate = dates[dates.length - 1];
  if (!firstDate || !endDate) return [];
  const first = new Date(firstDate).getTime();
  const last = new Date(endDate).getTime();
  const span = last - first;
  if (span <= 0) return [firstDate];

  // pick a nice step: 1mo, 3mo, 6mo, 1yr, 2yr
  const DAY = 86_400_000;
  const steps = [30 * DAY, 90 * DAY, 180 * DAY, 365 * DAY, 730 * DAY];
  const step0 = steps[0];
  if (step0 === undefined) return [];
  let step = step0;
  for (const s of steps) {
    step = s;
    if (span / s <= 8) break;
  }

  const ticks: string[] = [];
  const startDate = dates[0];
  if (!startDate) return [];
  let cursor = new Date(startDate).getTime();
  while (cursor <= last) {
    // find the closest actual date
    let best = startDate;
    for (const d of dates) {
      const t = new Date(d).getTime();
      if (Math.abs(t - cursor) < Math.abs(new Date(best).getTime() - cursor)) best = d;
    }
    if (!ticks.includes(best)) ticks.push(best);
    cursor += step;
  }
  // only add last date if far enough from previous tick
  const lastDate = dates[dates.length - 1];
  if (!lastDate) return ticks;
  const prevTick = ticks.at(-1);
  if (!prevTick) {
    ticks.push(lastDate);
  } else if (prevTick !== lastDate) {
    const prevMs = new Date(prevTick).getTime();
    const lastMs = new Date(lastDate).getTime();
    if (lastMs - prevMs >= step * 0.4) ticks.push(lastDate);
  }
  return ticks;
}

function yTicks(maxStars: number): number[] {
  if (maxStars <= 0) return [0];
  const step = niceStep(maxStars, 5);
  const ticks: number[] = [];
  for (let i = 0; i <= maxStars; i += step) ticks.push(i);
  const last = ticks.at(-1);
  if (last === undefined) return ticks;
  // only add maxStars if there's enough gap from the last nice tick
  if (maxStars - last >= step * 0.4) ticks.push(maxStars);
  return ticks;
}

function niceStep(max: number, targetTicks: number): number {
  const rough = max / targetTicks;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const r = rough / mag;
  const nice = r <= 1.5 ? 1 : r <= 3 ? 2 : r <= 7 ? 5 : 10;
  return nice * mag;
}

// -- main composable --

export function useSvgChart(
  repos: Ref<RepoData[]>,
  chartType: Ref<ChartType>,
  allDates: Ref<string[]>,
) {
  const svg = computed(() => {
    if (repos.value.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%">
        <text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="rgba(255,255,255,0.38)" font-family="sans-serif" font-size="16">
          Enter a GitHub repo to get started
        </text>
      </svg>`;
    }

    const dates = allDates.value;

    // --- compute scales from real timestamps ---
    const firstDate = dates[0];
    const lastDate = dates.at(-1);
    const firstTs = firstDate ? new Date(firstDate).getTime() : 0;
    const lastTs = lastDate ? new Date(lastDate).getTime() : 1;
    const tsSpan = lastTs - firstTs || 1;

    const xForDate = (d: string): number => {
      const t = new Date(d).getTime();
      return MARGIN.left + ((t - firstTs) / tsSpan) * CHART_W;
    };

    const maxStars =
      repos.value.length > 0
        ? Math.max(
            ...repos.value.map((r) => (r.stars.length > 0 ? (r.stars.at(-1)?.count ?? 0) : 0)),
          )
        : 0;
    const paddedMax = maxStars === 0 ? 10 : Math.ceil(maxStars * 1.1);

    const yForCount = (c: number): number => MARGIN.top + CHART_H - (c / paddedMax) * CHART_H;

    const yTickValues = yTicks(paddedMax);
    const xTicks = xTickDates(dates);

    let svgContent = "";

    // Y-axis horizontal grid lines + labels
    for (const tick of yTickValues) {
      const y = yForCount(tick);
      svgContent += `<line x1="${MARGIN.left}" y1="${y}" x2="${W - MARGIN.right}" y2="${y}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
      svgContent += `<text x="${MARGIN.left - 8}" y="${y + 4}" text-anchor="end" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="11">${formatNumber(tick)}</text>`;
    }

    // X-axis labels (dates) — skip if too close to previous
    const labelY = MARGIN.top + CHART_H + 20;
    const MIN_LABEL_GAP = 40; // "15/01/24" ≈ 48px at 11px font
    let prevX = -Infinity;
    const lastTick = xTicks[xTicks.length - 1];
    for (const date of xTicks) {
      const x = xForDate(date);
      // always render the last tick, otherwise enforce min gap
      if (date !== lastTick && x - prevX < MIN_LABEL_GAP) continue;
      svgContent += `<text x="${x}" y="${labelY}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="11">${formatDate(date)}</text>`;
      prevX = x;
    }

    // Axes
    svgContent += `<line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${MARGIN.top + CHART_H}" stroke="rgba(255,255,255,0.38)" stroke-width="1.5"/>`;
    svgContent += `<line x1="${MARGIN.left}" y1="${MARGIN.top + CHART_H}" x2="${W - MARGIN.right}" y2="${MARGIN.top + CHART_H}" stroke="rgba(255,255,255,0.38)" stroke-width="1.5"/>`;

    // --- data series ---
    if (chartType.value === "bar") {
      // bar chart — compute bar positions from time scale + 14-day thinning
      const repoCount = repos.value.length;
      const barW = Math.max(4, CHART_W / dates.length / (repoCount + 1));
      const gap = 2;

      for (let ri = 0; ri < repoCount; ri++) {
        const repo = repos.value[ri];
        if (!repo) continue;
        const color = COLORS[ri % COLORS.length];
        if (!color) continue;
        // thin to ~14-day intervals
        let cursor = firstTs;
        const DAY14 = 14 * 86_400_000;
        const lastIdx = repo.stars.length - 1;
        for (let si = 0; si < repo.stars.length; si++) {
          const point = repo.stars[si];
          if (!point) continue;
          const t = new Date(point.date).getTime();
          if (t < cursor && si !== 0 && si !== lastIdx) continue;
          cursor = t + DAY14;

          const cx = xForDate(point.date);
          const barX = cx - ((barW + gap) * repoCount) / 2 + ri * (barW + gap);
          const barY = yForCount(point.count);
          const barH = MARGIN.top + CHART_H - barY;
          svgContent += `<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" fill="${color}" rx="1"/>`;
        }
      }
    } else {
      // line chart — polyline through all points, no dots, no per-point labels
      for (let ri = 0; ri < repos.value.length; ri++) {
        const repo = repos.value[ri];
        if (!repo) continue;
        const color = COLORS[ri % COLORS.length];
        if (!color) continue;
        if (repo.stars.length === 0) continue;

        const pts = repo.stars.map((p) => `${xForDate(p.date)},${yForCount(p.count)}`).join(" ");
        svgContent += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      }
    }

    // --- legend (top-left) ---
    let legendX = MARGIN.left;
    for (let ri = 0; ri < repos.value.length; ri++) {
      const repo = repos.value[ri];
      if (!repo) continue;
      const color = COLORS[ri % COLORS.length];
      if (!color) continue;
      svgContent += `<line x1="${legendX}" y1="18" x2="${legendX + 20}" y2="18" stroke="${color}" stroke-width="2.5"/>`;
      svgContent += `<text x="${legendX + 26}" y="22" fill="rgba(255,255,255,0.87)" font-family="sans-serif" font-size="12">${repo.fullName}</text>`;
      legendX += repo.fullName.length * 7 + 60;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%">${svgContent}</svg>`;
  });

  return { svg };
}

// GET /api/chart?owner=X&repo=Y[&type=bar][&theme=dark][&download=1]
// Returns SVG chart image. Caches in R2 for 3 days, auto-refreshes on expiry.

import { type ChartType, generateChartSvg } from "../shared/chart-svg";
import { fetchSvg, getSvgAgeHours, uploadSvg } from "./r2";
import { fetchStarHistory } from "./stars";

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml;charset=utf-8",
  "Cache-Control": "public, s-maxage=259200, max-age=259200",
} as const;

const MAX_CACHE_HOURS = 72; // 3 days

function r2Key(owner: string, repo: string, chartType: ChartType): string {
  return `star-charts/${owner}/${repo}/${chartType}.svg`;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner")?.trim();
  const repo = url.searchParams.get("repo")?.trim();
  const typeParam = url.searchParams.get("type")?.trim();
  const download = url.searchParams.has("download");

  if (!owner || !repo) {
    return new Response("Missing owner or repo parameter", { status: 400 });
  }

  const chartType: ChartType = typeParam === "bar" ? "bar" : "line";
  const key = r2Key(owner, repo, chartType);

  // Check R2 cache
  try {
    const ageHours = await getSvgAgeHours(key);
    if (ageHours !== null && ageHours < MAX_CACHE_HOURS) {
      const cached = await fetchSvg(key);
      if (cached) {
        return svgResponse(cached, download, `${owner}-${repo}-${chartType}.svg`);
      }
    }
  } catch {
    // R2 not configured or unavailable — fall through to live generation
  }

  // Fetch star data from GitHub
  let stars: { date: string; count: number }[];
  try {
    const data = await fetchStarHistory(owner, repo, null);
    stars = data.stars;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Failed to fetch star data: ${message}`, { status: 502 });
  }

  if (stars.length === 0) {
    return new Response("No star data found for this repo", { status: 404 });
  }

  // Generate SVG
  const allDates = stars.map((p) => p.date);
  const svg = generateChartSvg([{ fullName: `${owner}/${repo}`, stars }], chartType, allDates);

  // Upload to R2 (best-effort — don't fail the request if upload fails)
  try {
    await uploadSvg(key, svg);
  } catch {
    // R2 upload failed, but we still return the generated SVG
  }

  return svgResponse(svg, download, `${owner}-${repo}-${chartType}.svg`);
}

function svgResponse(svg: string, download: boolean, filename: string): Response {
  const headers = new Headers(SVG_HEADERS);
  if (download) {
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  }
  return new Response(svg, { headers });
}

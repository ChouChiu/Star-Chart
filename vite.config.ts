import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { extractGitHubStatus, fetchStarHistory } from "./api/stars";
import { generateChartSvg, type ChartType } from "./shared/chart-svg";

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml;charset=utf-8",
  "Cache-Control": "public, s-maxage=259200, max-age=259200",
};

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "api-routes",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith("/api/") || !req.method) return next();

          const url = new URL(req.url, "http://localhost");
          const pathname = url.pathname;

          // /api/chart — SVG image endpoint
          if (pathname === "/api/chart" && req.method === "GET") {
            try {
              const owner = url.searchParams.get("owner")?.trim();
              const repo = url.searchParams.get("repo")?.trim();
              const typeParam = url.searchParams.get("type")?.trim();
              const download = url.searchParams.has("download");

              if (!owner || !repo) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "text/plain");
                res.end("Missing owner or repo parameter");
                return;
              }

              const chartType: ChartType = typeParam === "bar" ? "bar" : "line";

              // In dev, always fetch fresh (no R2 caching)
              const data = await fetchStarHistory(owner, repo, null);

              if (data.stars.length === 0) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "text/plain");
                res.end("No star data found");
                return;
              }

              const allDates = data.stars.map((p) => p.date);
              const svg = generateChartSvg(
                [{ fullName: `${owner}/${repo}`, stars: data.stars }],
                chartType,
                allDates,
              );

              res.statusCode = 200;
              for (const [k, v] of Object.entries(SVG_HEADERS)) {
                res.setHeader(k, v);
              }
              if (download) {
                res.setHeader(
                  "Content-Disposition",
                  `attachment; filename="${owner}-${repo}-${chartType}.svg"`,
                );
              }
              res.end(svg);
            } catch (err) {
              const status = extractGitHubStatus(err);
              const message = err instanceof Error ? err.message : "Unknown error";
              console.error("[api-routes] /api/chart error:", err);
              res.statusCode = status;
              res.setHeader("Content-Type", "text/plain");
              res.end(message);
            }
            return;
          }

          // /api/stars — star data endpoint (default for all other /api/* GET)
          try {
            const owner = url.searchParams.get("owner");
            const repo = url.searchParams.get("repo");
            const token = url.searchParams.get("token");

            if (!owner || !repo) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Missing owner or repo parameter" }));
              return;
            }

            const tokenStr = token && token.length > 0 ? token : null;
            const data = await fetchStarHistory(owner, repo, tokenStr);

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          } catch (err) {
            const status = extractGitHubStatus(err);
            const message = err instanceof Error ? err.message : "Unknown error";

            if (status === 403) {
              console.warn("[api-routes] GitHub API rate limited — add a token to increase the limit.");
            } else {
              console.error("[api-routes] error:", err);
            }

            res.statusCode = status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: message }));
          }
        });
      },
    },
  ],
});

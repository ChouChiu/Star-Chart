import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { extractGitHubStatus, fetchStarHistory } from "./api/stars";

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "api-routes",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith("/api/") || !req.method) return next();

          try {
            const url = new URL(req.url, "http://localhost");
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

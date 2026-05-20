import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fetchStarHistory } from "./api/stars";

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
            console.error("[api-routes] error:", err);
            const message = err instanceof Error ? err.message : "Unknown error";
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: message }));
          }
        });
      },
    },
  ],
});

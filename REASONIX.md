# REASONIX.md — star-chart

## Stack
- **Vue 3.5** — single-page app, Composition API (`.vue` SFCs, `<script setup>`)
- **Vite 8** — dev server + bundler (`@vitejs/plugin-vue`)
- **TypeScript 6** — `strict`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`
- **Biome 2** — lint + format (recommended rules, git-aware)
- **Bun** — runtime for Vercel serverless (`vercel.json` + `bun.lock`)
- **GitHub API** — star history via `/stargazers` (star+json media type)

## Layout
```
api/stars.ts       GitHub API client + Vercel serverless GET handler (copied types)
src/App.vue         Root SFC — orchestrates inputs + chart
src/components/     RepoInput, TokenInput, StarChart (Vue SFCs)
src/composables/    useStarHistory (fetch + state), useSvgChart (SVG rendering)
src/types.ts        Frontend type definitions
src/main.ts         App bootstrap (createApp + mount)
src/env.d.ts        Vue SFC type declaration shim
public/             Static assets (favicon.svg)
index.html          Vite entry HTML shell
vite.config.ts      Vite config + API dev-server middleware
vercel.json         SPA rewrite rule + Bun runtime for api/*.ts
```

## Commands
```sh
bun run dev        # Vite dev server (API served via middleware in vite.config.ts)
bun run build      # Production build (vite build → dist/)
bun run preview    # Preview production build locally
bun run lint       # biome check src/ api/
bun run format     # biome check --write src/ api/
```

## Conventions
- 2-space indent, 100 char line width (Biome)
- `verbatimModuleSyntax` — use `import type` for type-only imports
- Named exports only (no default exports outside `.vue` SFCs)
- Composables pattern: stateful logic in `src/composables/` (Vue `ref`/`reactive`)
- Git-aware Biome (`useIgnoreFile: true`)

## Watch out for
- **Duplicated types** — `StarDataPoint` and the response interface are defined in both
  `api/stars.ts` and `src/types.ts`. The API copy is the source of truth; the frontend
  copy (`StarsApiResponse`) has a slightly different name. Keep them in sync.
- **API runs two paths** — in dev, a Vite plugin in `vite.config.ts` calls
  `fetchStarHistory` directly. In prod, Vercel routes `/api/*` to the `GET` export in
  `api/stars.ts`. Both hit the same core function.
- **No tests** — the project has zero test files and no test runner configured.
- **Bun lockfile** — dependencies are locked with `bun.lock`, not `package-lock.json` or
  `yarn.lock`. Use `bun install`.

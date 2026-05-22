import { computed, type Ref, ref } from "vue";
import type { RepoData, StarsApiResponse } from "../types";

function parseRepo(fullName: string): { owner: string; repo: string } | null {
  const trimmed = fullName.trim();
  const match = trimmed.match(/^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2];
  if (!owner || !repo) return null;
  return { owner, repo };
}

export function useStarHistory(token: Ref<string>) {
  const repos = ref<RepoData[]>([]);

  async function addRepo(fullName: string): Promise<boolean> {
    const parsed = parseRepo(fullName);
    if (!parsed) return false;

    const normalized = `${parsed.owner}/${parsed.repo}`;
    if (repos.value.some((r) => r.fullName === normalized)) return false;

    const entry: RepoData = {
      fullName: normalized,
      stars: [],
      loading: true,
      error: null,
      partial: false,
    };
    repos.value = [...repos.value, entry];

    try {
      const params = new URLSearchParams({ owner: parsed.owner, repo: parsed.repo });
      if (token.value) params.set("token", token.value);

      const res = await fetch(`/api/stars?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Request failed" }));
        const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
        if (res.status === 403) {
          const hint = token.value
            ? "Your token may have insufficient permissions."
            : "Add a personal access token to increase the limit.";
          throw new Error(`[token-required] GitHub API rate limited. ${hint}`);
        }
        throw new Error(msg);
      }

      const data = (await res.json()) as StarsApiResponse;
      const idx = repos.value.findIndex((r) => r.fullName === normalized);
      if (idx === -1) return false;

      const updated = [...repos.value];
      const existing = updated[idx];
      if (!existing) return false;
      updated[idx] = {
        ...existing,
        stars: data.stars,
        loading: false,
        partial: data.partial,
      };
      repos.value = updated;
      return true;
    } catch (err) {
      const idx = repos.value.findIndex((r) => r.fullName === normalized);
      if (idx === -1) return false;

      const updated = [...repos.value];
      const existing = updated[idx];
      if (!existing) return false;
      updated[idx] = {
        ...existing,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
      repos.value = updated;
      return false;
    }
  }

  function removeRepo(fullName: string): void {
    repos.value = repos.value.filter((r) => r.fullName !== fullName);
  }

  const allDates = computed(() => {
    const dateSet = new Set<string>();
    for (const repo of repos.value) {
      for (const point of repo.stars) {
        dateSet.add(point.date);
      }
    }
    return [...dateSet].sort();
  });

  return { repos, addRepo, removeRepo, allDates };
}

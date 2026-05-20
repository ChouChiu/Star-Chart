export interface StarDataPoint {
  date: string;
  count: number;
}

export interface StarsResponse {
  repo: string;
  stars: StarDataPoint[];
  totalPages: number;
  fetchedPages: number;
  partial: boolean;
}

export function extractGitHubStatus(err: unknown): number {
  const message = err instanceof Error ? err.message : String(err);
  const match = message.match(/^GitHub API (\d{3}):/);
  return match ? Number.parseInt(match[1]!, 10) : 500;
}

async function fetchPage(
  owner: string,
  repo: string,
  page: number,
  token: string | null,
): Promise<{ data: { starred_at: string }[]; linkHeader: string | null }> {
  const url = `https://api.github.com/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.star+json",
    "User-Agent": "star-chart-generator",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "unreadable body");
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { starred_at: string }[];
  const linkHeader = res.headers.get("link");
  return { data, linkHeader };
}

function getLastPage(linkHeader: string | null): number | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
  return match ? Number.parseInt(match[1]!, 10) : null;
}

function aggregateByDate(entries: { starred_at: string }[]): StarDataPoint[] {
  const dayMap = new Map<string, number>();
  for (const entry of entries) {
    const date = entry.starred_at.slice(0, 10);
    dayMap.set(date, (dayMap.get(date) ?? 0) + 1);
  }
  const sorted = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const result: StarDataPoint[] = [];
  let cum = 0;
  for (const [date, count] of sorted) {
    cum += count;
    result.push({ date, count: cum });
  }
  return result;
}

export async function fetchStarHistory(
  owner: string,
  repo: string,
  token: string | null,
): Promise<StarsResponse> {
  const allEntries: { starred_at: string }[] = [];
  let page = 1;
  let lastPage: number | null = null;
  const MAX_PAGES = 200;

  const first = await fetchPage(owner, repo, page, token);
  allEntries.push(...first.data);
  lastPage = getLastPage(first.linkHeader);
  page++;

  const effectiveLast = lastPage ? Math.min(lastPage, MAX_PAGES) : 1;
  while (page <= effectiveLast) {
    const result = await fetchPage(owner, repo, page, token);
    allEntries.push(...result.data);
    page++;
  }

  const stars = aggregateByDate(allEntries);

  return {
    repo: `${owner}/${repo}`,
    stars,
    totalPages: lastPage ?? 1,
    fetchedPages: page - 1,
    partial: lastPage !== null && lastPage > MAX_PAGES,
  };
}

// Vercel serverless handler
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");
  const token = url.searchParams.get("token");

  if (!owner || !repo) {
    return Response.json({ error: "Missing owner or repo parameter" }, { status: 400 });
  }

  const tokenStr = token && token.length > 0 ? token : null;

  try {
    const data = await fetchStarHistory(owner, repo, tokenStr);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = extractGitHubStatus(err);
    return Response.json({ error: message }, { status });
  }
}

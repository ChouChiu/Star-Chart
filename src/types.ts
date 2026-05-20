export interface StarDataPoint {
  date: string;
  count: number;
}

export interface StarsApiResponse {
  repo: string;
  stars: StarDataPoint[];
  totalPages: number;
  fetchedPages: number;
  partial: boolean;
}

export interface RepoData {
  fullName: string;
  stars: StarDataPoint[];
  loading: boolean;
  error: string | null;
  partial: boolean;
}

export type ChartType = "line" | "bar";

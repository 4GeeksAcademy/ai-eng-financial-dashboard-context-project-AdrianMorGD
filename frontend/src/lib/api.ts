import type {
  DateRangeFilter,
  FacetsResponse,
  FinancialMovement,
} from "./financial-types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function toQueryString(params: DateRangeFilter): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`Request to ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchFacets(signal?: AbortSignal): Promise<FacetsResponse> {
  return getJson<FacetsResponse>("/api/metrics/facets", signal);
}

export function fetchMovements(
  filter: DateRangeFilter,
  signal?: AbortSignal,
): Promise<FinancialMovement[]> {
  return getJson<FinancialMovement[]>(
    `/api/metrics${toQueryString(filter)}`,
    signal,
  );
}

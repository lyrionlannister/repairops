export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ServerListFilters = Record<string, string | null | undefined>;

export interface ServerListOptions {
  search?: string;
  filters?: ServerListFilters;
  errorText: string;
  enabled?: boolean;
  initialPageSize?: number;
}

export interface AsyncSearchOptions {
  enabled?: boolean;
  limit?: number;
}

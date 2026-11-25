import type { ServerListFilters } from "../types/server-list";

export interface AsyncSearchSelectProps<T> {
  path: string;
  filters?: ServerListFilters;
  value: string;
  onSelect: (item: T | null) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  isDisabled?: (item: T) => boolean;
  resolvePath?: (id: string) => string;
  selectedLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

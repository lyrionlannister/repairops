import type { ReactNode } from "react";
import type { DataTablePagination } from "../types/data-table";
import type { EmptyStateProps } from "./empty-state-props";
import type { ScrollTableProps } from "./scroll-table-props";

export interface DataTableProps extends ScrollTableProps {
  loading?: boolean;
  loadingText?: string;
  error?: string | null;
  onRetry?: () => void;
  isEmpty: boolean;
  empty: EmptyStateProps;
  pagination?: DataTablePagination;
  containerClassName?: string;
  toolbar?: ReactNode;
}

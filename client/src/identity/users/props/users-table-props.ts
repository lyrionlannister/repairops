import type { UserRecord } from "../types/users";

export interface UsersTableProps {
  loading: boolean;
  error: string | null;
  pageItems: UserRecord[];
  togglingId: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onRetry: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

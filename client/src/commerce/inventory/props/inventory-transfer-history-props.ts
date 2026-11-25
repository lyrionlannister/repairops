import type { DataTablePagination } from "@common/types/data-table";
import type { InventoryTransfer, InventoryTransferItemRef } from "../types/inventory-transfers";

export interface InventoryTransferHistoryProps {
  transfers: InventoryTransfer[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  pagination: DataTablePagination;
  refLabel: (ref: InventoryTransferItemRef | null | undefined) => string;
}

import type { InventoryItem } from "../types/inventory";

export interface InventoryTableProps {
  error?: string | null;
  onRetry?: () => void;
  loading: boolean;
  hasFilters: boolean;
  pageItems: InventoryItem[];
  supplierName: (supplierId: string | null) => string;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOpenMovement: (item: InventoryItem) => void;
  onRequestDelete: (id: string) => void;
  // Sin inventory.read (el técnico): la API no manda costo ni proveedor.
  showCosts: boolean;
  canManage: boolean;
  canAdjust: boolean;
}

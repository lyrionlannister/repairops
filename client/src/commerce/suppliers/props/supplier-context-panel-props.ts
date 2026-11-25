import type { SupplierCriticalItem } from "../types/supplier-context";

export interface SupplierContextPanelProps {
  skuCount: number;
  stockValueAtCost: number;
  criticalItems: SupplierCriticalItem[];
  criticalCount: number;
}

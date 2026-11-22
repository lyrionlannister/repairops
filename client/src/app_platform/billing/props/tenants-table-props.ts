import type { TenantPlan } from "../types/platform-tenants";

export interface TenantsTableProps {
  tenants: TenantPlan[];
  onEdit: (tenantId: string) => void;
}

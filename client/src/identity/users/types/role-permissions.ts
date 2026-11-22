import type { LucideIcon } from "lucide-react";
import type { Permission, UserRole } from "@common/types/auth/permission";

export type TenantPermission = Exclude<Permission, `platform.${string}`>;

export interface RoleCatalogEntry {
  role: UserRole;
  permissions: TenantPermission[];
}

export interface PermissionGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  permissions: readonly TenantPermission[];
}

export interface GrantedPermission {
  permission: TenantPermission;
  label: string;
  limited: boolean;
}

export interface GrantedPermissionGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  items: GrantedPermission[];
}

export interface PermissionSummary {
  granted: GrantedPermissionGroup[];
  missing: Pick<PermissionGroup, "key" | "label">[];
  hasLimited: boolean;
}

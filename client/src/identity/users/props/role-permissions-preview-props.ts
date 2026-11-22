import type { PermissionSummary } from "../types/role-permissions";

export interface RolePermissionsPreviewProps {
  summary: PermissionSummary;
  loading: boolean;
  hasRoles: boolean;
  fullAccess: boolean;
}

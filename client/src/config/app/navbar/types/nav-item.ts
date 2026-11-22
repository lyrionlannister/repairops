import type { Permission } from "@common/types/auth/permission";

export interface NavItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  group?: string;
  new?: boolean;
  // Basta con uno: la entrada se muestra si el usuario tiene alguno.
  permissions?: Permission[];
  subItems?: { name: string; path: string; new?: boolean; permissions?: Permission[] }[];
}

import { USER_ROLES, type UserRole } from "../auth/entities/user.entity.js";

export const TENANT_PERMISSIONS = [
  "users.read",
  "users.manage",
  "staff.list",
  "branches.read",
  "branches.manage",
  "local.manage",
  "settings.manage",
  "imports.run",
  "customers.read",
  "customers.read.own",
  "customers.write",
  "customers.delete",
  "customer-payments.register",
  "repair-notes.read",
  "repair-notes.read.own",
  "repair-notes.create",
  "repair-notes.create.own",
  "repair-notes.write",
  "repair-notes.write.own",
  "repair-notes.deliver",
  "repair-notes.deliver.own",
  "repair-notes.delete",
  "quotes.read",
  "quotes.read.own",
  "quotes.write",
  "quotes.write.own",
  "quotes.delete",
  "sales.read",
  "sales.create",
  "returns.create",
  "layaways.read",
  "layaways.write",
  "cash.read",
  "cash.operate",
  "cash.authorize-variance",
  "inventory.read",
  "inventory.lookup",
  "inventory.manage",
  "inventory.adjust",
  "inventory.count",
  "inventory.transfer",
  "suppliers.read",
  "suppliers.manage",
  "chats.read",
  "chats.read.own",
  "chats.reply",
  "chats.reply.own",
  "message-templates.read",
  "message-templates.manage",
  "notifications.own",
  "whatsapp.read",
  "whatsapp.manage",
  "dashboard.read",
  "dashboard.money",
  "reports.read",
  "billing.read",
  "billing.manage",
] as const;

export const PLATFORM_PERMISSIONS = [
  "platform.templates.manage",
  "platform.integrations.manage",
  "platform.tenants.read",
  "platform.tenants.manage",
  "platform.plans.manage",
  "platform.subscriptions.manage",
] as const;

export type TenantPermission = (typeof TENANT_PERMISSIONS)[number];
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];
export type Permission = TenantPermission | PlatformPermission;

const FRONT_DESK = [
  "staff.list",
  "branches.read",
  "customers.read",
  "customers.write",
  "repair-notes.read",
  "repair-notes.create",
  "quotes.read",
  "quotes.write",
  "inventory.read",
  "suppliers.read",
  "chats.read",
  "chats.reply",
  "message-templates.read",
  "notifications.own",
  "dashboard.read",
] as const satisfies readonly TenantPermission[];

// Mapa en código y no en base: cuatro roles fijos, versionado y probado junto con las
// rutas. Si algún día hay roles por taller se mueve a tabla sin tocar las rutas.
export const ROLE_PERMISSIONS: Record<UserRole, readonly TenantPermission[]> = {
  owner: TENANT_PERMISSIONS,
  cashier: [
    ...FRONT_DESK,
    "customer-payments.register",
    "repair-notes.deliver",
    "sales.read",
    "sales.create",
    "returns.create",
    "layaways.read",
    "layaways.write",
    "cash.read",
    "cash.operate",
  ],
  technician: [
    "branches.read",
    "customers.read.own",
    "repair-notes.read.own",
    "repair-notes.create.own",
    "repair-notes.write.own",
    "repair-notes.deliver.own",
    "quotes.read.own",
    "quotes.write.own",
    "inventory.lookup",
    "chats.read.own",
    "chats.reply.own",
    "message-templates.read",
    "notifications.own",
  ],
  employee: FRONT_DESK,
};

// Los roles solo suman. El flag de plataforma es ortogonal: agrega platform.* y nada más.
export function effectivePermissions(
  roles: readonly UserRole[],
  isPlatformAdmin: boolean,
): Set<Permission> {
  const permissions = new Set<Permission>(roles.flatMap((role) => ROLE_PERMISSIONS[role]));
  if (isPlatformAdmin) PLATFORM_PERMISSIONS.forEach((permission) => permissions.add(permission));
  return permissions;
}

export interface RoleCatalogEntry {
  role: UserRole;
  permissions: readonly TenantPermission[];
}

export function roleCatalog(): RoleCatalogEntry[] {
  return USER_ROLES.map((role) => ({ role, permissions: ROLE_PERMISSIONS[role] }));
}

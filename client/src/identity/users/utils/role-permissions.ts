import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  MessageCircle,
  ShoppingCart,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import type { UserRole } from "@common/types/auth/permission";
import type {
  GrantedPermission,
  PermissionGroup,
  PermissionSummary,
  RoleCatalogEntry,
  TenantPermission,
} from "../types/role-permissions";

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: "Acceso total al taller",
  cashier: "Cobra, vende y opera la caja",
  technician: "Trabaja solo las notas asignadas",
  employee: "Atiende clientes y recibe equipos",
};

const PERMISSION_LABELS: Record<TenantPermission, string> = {
  "users.read": "Ver usuarios",
  "users.manage": "Crear y editar usuarios",
  "staff.list": "Ver la lista de personal",
  "branches.read": "Ver sucursales",
  "branches.manage": "Administrar sucursales",
  "local.manage": "Configurar Mi Local",
  "settings.manage": "Cambiar ajustes generales",
  "imports.run": "Importar datos",
  "billing.read": "Ver el plan contratado",
  "customers.read": "Ver todos los clientes",
  "customers.read.own": "Ver clientes de sus notas",
  "customers.write": "Crear y editar clientes",
  "customers.delete": "Eliminar clientes",
  "customer-payments.register": "Registrar pagos de clientes",
  "repair-notes.read": "Ver todas las notas",
  "repair-notes.read.own": "Ver sus notas asignadas",
  "repair-notes.create": "Crear notas",
  "repair-notes.create.own": "Crear notas a su nombre",
  "repair-notes.write": "Editar notas",
  "repair-notes.write.own": "Editar sus notas",
  "repair-notes.deliver": "Entregar equipos",
  "repair-notes.deliver.own": "Entregar sus equipos",
  "repair-notes.delete": "Cancelar y eliminar notas",
  "quotes.read": "Ver cotizaciones",
  "quotes.read.own": "Ver cotizaciones de sus notas",
  "quotes.write": "Crear y editar cotizaciones",
  "quotes.write.own": "Cotizar sus notas",
  "quotes.delete": "Eliminar cotizaciones",
  "sales.read": "Ver ventas",
  "sales.create": "Vender",
  "returns.create": "Hacer devoluciones",
  "layaways.read": "Ver apartados",
  "layaways.write": "Crear y abonar apartados",
  "cash.read": "Ver la caja",
  "cash.operate": "Abrir, mover y cerrar caja",
  "cash.authorize-variance": "Autorizar diferencias de caja",
  "inventory.read": "Ver el catálogo completo",
  "inventory.lookup": "Consultar piezas y precios",
  "inventory.manage": "Administrar productos",
  "inventory.adjust": "Ajustar existencias",
  "inventory.count": "Hacer conteos de inventario",
  "inventory.transfer": "Transferir entre sucursales",
  "suppliers.read": "Ver proveedores",
  "suppliers.manage": "Administrar proveedores",
  "chats.read": "Ver todos los chats",
  "chats.read.own": "Ver chats de sus notas",
  "chats.reply": "Responder chats",
  "chats.reply.own": "Responder chats de sus notas",
  "message-templates.read": "Ver plantillas de mensajes",
  "message-templates.manage": "Administrar plantillas",
  "notifications.own": "Recibir sus notificaciones",
  "whatsapp.read": "Ver la conexión de WhatsApp",
  "whatsapp.manage": "Conectar WhatsApp",
  "dashboard.read": "Ver el dashboard",
  "dashboard.money": "Ver montos en el dashboard",
  "reports.read": "Ver reportes",
};

const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    key: "repairs",
    label: "Reparaciones",
    icon: ClipboardList,
    permissions: [
      "repair-notes.read",
      "repair-notes.read.own",
      "repair-notes.create",
      "repair-notes.create.own",
      "repair-notes.write",
      "repair-notes.write.own",
      "repair-notes.deliver",
      "repair-notes.deliver.own",
      "repair-notes.delete",
    ],
  },
  {
    key: "quotes",
    label: "Cotizaciones",
    icon: FileText,
    permissions: [
      "quotes.read",
      "quotes.read.own",
      "quotes.write",
      "quotes.write.own",
      "quotes.delete",
    ],
  },
  {
    key: "customers",
    label: "Clientes",
    icon: Users,
    permissions: [
      "customers.read",
      "customers.read.own",
      "customers.write",
      "customers.delete",
      "customer-payments.register",
    ],
  },
  {
    key: "sales",
    label: "Ventas",
    icon: ShoppingCart,
    permissions: [
      "sales.read",
      "sales.create",
      "returns.create",
      "layaways.read",
      "layaways.write",
    ],
  },
  {
    key: "cash",
    label: "Caja",
    icon: Wallet,
    permissions: ["cash.read", "cash.operate", "cash.authorize-variance"],
  },
  {
    key: "inventory",
    label: "Inventario",
    icon: Boxes,
    permissions: [
      "inventory.read",
      "inventory.lookup",
      "inventory.manage",
      "inventory.adjust",
      "inventory.count",
      "inventory.transfer",
      "suppliers.read",
      "suppliers.manage",
    ],
  },
  {
    key: "messaging",
    label: "Mensajería",
    icon: MessageCircle,
    permissions: [
      "chats.read",
      "chats.read.own",
      "chats.reply",
      "chats.reply.own",
      "message-templates.read",
      "message-templates.manage",
      "notifications.own",
      "whatsapp.read",
      "whatsapp.manage",
    ],
  },
  {
    key: "reports",
    label: "Dashboard y reportes",
    icon: BarChart3,
    permissions: ["dashboard.read", "dashboard.money", "reports.read"],
  },
  {
    key: "team",
    label: "Equipo",
    icon: UserCog,
    permissions: ["staff.list", "users.read", "users.manage"],
  },
  {
    key: "business",
    label: "Taller",
    icon: Building2,
    permissions: [
      "branches.read",
      "branches.manage",
      "local.manage",
      "settings.manage",
      "imports.run",
      "billing.read",
    ],
  },
];

const OWN_SUFFIX = ".own";

const broaderOf = (permission: TenantPermission): TenantPermission | null => {
  if (!permission.endsWith(OWN_SUFFIX)) return null;
  const broader = permission.slice(0, -OWN_SUFFIX.length);
  return broader in PERMISSION_LABELS ? (broader as TenantPermission) : null;
};

// Un ".own" sin versión amplia (notifications.own) no restringe nada, no se marca como limitado.
const isLimited = (permission: TenantPermission): boolean => broaderOf(permission) !== null;

const coveredByBroader = (
  permission: TenantPermission,
  granted: ReadonlySet<TenantPermission>,
): boolean => {
  const broader = broaderOf(permission);
  return broader !== null && granted.has(broader);
};

export const grantedPermissions = (
  roles: readonly UserRole[],
  catalog: readonly RoleCatalogEntry[],
): Set<TenantPermission> =>
  new Set(
    catalog.filter((entry) => roles.includes(entry.role)).flatMap((entry) => entry.permissions),
  );

export const summarizePermissions = (granted: ReadonlySet<TenantPermission>): PermissionSummary => {
  const summary: PermissionSummary = { granted: [], missing: [], hasLimited: false };
  for (const group of PERMISSION_GROUPS) {
    const items: GrantedPermission[] = group.permissions
      .filter((permission) => granted.has(permission) && !coveredByBroader(permission, granted))
      .map((permission) => ({
        permission,
        label: PERMISSION_LABELS[permission],
        limited: isLimited(permission),
      }));
    if (items.some((item) => item.limited)) summary.hasLimited = true;
    if (items.length > 0)
      summary.granted.push({ key: group.key, label: group.label, icon: group.icon, items });
    else summary.missing.push({ key: group.key, label: group.label });
  }
  return summary;
};

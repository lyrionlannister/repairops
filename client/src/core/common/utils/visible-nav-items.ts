import type { NavItem } from "../../../config/app/navbar/types/nav-item";
import type { Permission } from "../types/auth/permission";

// Una entrada sin permissions es visible para todos. Un grupo con subItems queda solo con
// los que el usuario puede abrir, y desaparece si no le queda ninguno.
export const visibleNavItems = (items: NavItem[], canAny: (...permissions: Permission[]) => boolean): NavItem[] =>
  items.flatMap((item) => {
    if (item.permissions && !canAny(...item.permissions)) return [];
    if (!item.subItems) return [item];
    const subItems = item.subItems.filter((sub) => !sub.permissions || canAny(...sub.permissions));
    return subItems.length > 0 ? [{ ...item, subItems }] : [];
  });

export const firstNavPath = (items: NavItem[]): string | null => {
  for (const item of items) {
    const path = item.path ?? item.subItems?.[0]?.path;
    if (path) return path;
  }
  return null;
};

// Permisos que pide la entrada de menú más específica que cubre la ruta: así
// una URL escrita a mano no abre una pantalla que la API va a rechazar.
export const requiredPermissionsFor = (pathname: string, items: NavItem[]): Permission[] | null => {
  const entries = items.flatMap((item) => [
    ...(item.path ? [{ path: item.path, permissions: item.permissions }] : []),
    ...(item.subItems ?? []).map((sub) => ({
      path: sub.path,
      permissions: sub.permissions ?? item.permissions,
    })),
  ]);
  const match = entries
    .filter((entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.permissions ?? null;
};

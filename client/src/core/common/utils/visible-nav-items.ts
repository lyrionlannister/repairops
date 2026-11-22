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

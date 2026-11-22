import { usePermissions } from "@common/hooks/use-permissions";
import { firstNavPath, visibleNavItems } from "@common/utils/visible-nav-items";
import { signInNavbarItems } from "../../config/app/navbar/sign-in-navbar-items";

// Quien no ve el dashboard (el técnico) entra a lo primero que su menú le deja abrir.
// undefined = sí ve el dashboard; null = no tiene ningún módulo.
export const useHomeRedirect = (): string | null | undefined => {
  const { can, canAny } = usePermissions();
  if (can("dashboard.read")) return undefined;
  return firstNavPath(visibleNavItems(signInNavbarItems, canAny));
};

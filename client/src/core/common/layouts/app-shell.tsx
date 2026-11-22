import { Outlet } from "react-router";

import { useSidebar } from "../hooks/use-sidebar";
import { useAuthGuard } from "../hooks/use-auth-guard";
import { AsideMenu } from "../components/menu/aside-menu";
import { NavbarMenu } from "../components/menu/navbar-menu";
import { SidebarProvider } from "../contexts/providers/sidebar-provider";
import { BranchProvider } from "../contexts/providers/branch-provider";
import { signInNavbarItems } from "../../../config/app/navbar/sign-in-navbar-items";
import { Backdrop } from "../components/menu/backdrop";
import { usePermissions } from "../hooks/use-permissions";
import { visibleNavItems } from "../utils/visible-nav-items";

const LayoutContent: React.FC = () => {
  useAuthGuard("/identity/sign-in");
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { canAny } = usePermissions();
  const navItems = visibleNavItems(signInNavbarItems, canAny);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div>
        <AsideMenu navItems={navItems} />
        <Backdrop />
      </div>
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-72.5" : "lg:ml-22.5"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <NavbarMenu />
        <div className="custom-scrollbar flex w-full flex-1 flex-col overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

// Shell autenticado de la app completa (sidebar + navbar + outlet) -- lo
// monta toda ruta protegida (/<modulo>/<ruta>), no solo las de rol
// admin/owner.
export const AppShell: React.FC = () => {
  return (
    <SidebarProvider>
      <BranchProvider>
        <LayoutContent />
      </BranchProvider>
    </SidebarProvider>
  );
};

import { Outlet } from "react-router";

import { useSidebar } from "../hooks/use-sidebar";
// import { useAuthGuard } from "../hooks/use-auth-guard";
import { AsideMenu } from "../components/menu/aside-menu";
import { NavbarMenu } from "../components/menu/navbar-menu";
import { SidebarProvider } from "../contexts/providers/sidebar-provider";
import { BranchProvider } from "../contexts/providers/branch-provider";
import {
  signInNavbarItems,
  otherSignInItems,
} from "../../../config/app/navbar/sign-in-navbar-items";
import { Backdrop } from "../components/menu/backdrop";
import { useCurrentUser } from "../hooks/use-current-user";

// Un técnico no opera caja -- ocultar el ítem de menú es el lado de
// pantalla de la Regla de permisos por módulo; la API (requireRole en
// cash.routes.ts) es la que de verdad lo bloquea aunque alguien edite el DOM.
const hiddenPathsByRole: Partial<Record<string, string[]>> = {
  technician: ["/app/cash"],
};

const LayoutContent: React.FC = () => {
  //   useAuthGuard("/app/sign-in");
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const currentUser = useCurrentUser();
  const hiddenPaths = (currentUser && hiddenPathsByRole[currentUser.role]) ?? [];
  const visibleNavItems = signInNavbarItems.filter((item) => !item.path || !hiddenPaths.includes(item.path));

  return (
    <div className="h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 xl:flex">
      <div>
        <AsideMenu
          navItems={visibleNavItems}
          othersItems={otherSignInItems}
        />
        <Backdrop />
      </div>
      <div
        className={`flex min-h-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
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
// monta toda ruta bajo /app, no solo las de rol admin/owner (antes se
// llamaba SignInLayout y vivia bajo /admin, lo que sugeria erroneamente
// que ese prefijo era solo para administradores).
export const AppShell: React.FC = () => {
  return (
    <SidebarProvider>
      <BranchProvider>
        <LayoutContent />
      </BranchProvider>
    </SidebarProvider>
  );
};

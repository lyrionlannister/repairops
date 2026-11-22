import { useCallback, useMemo } from "react";
import { useCurrentUser } from "./use-current-user";
import type { Permission } from "../types/auth/permission";

// Ocultar un botón no protege nada: cada permiso se hace cumplir en la API, esto solo
// evita mostrar lo que la API va a rechazar.
export const usePermissions = () => {
  const currentUser = useCurrentUser();
  const granted = useMemo(
    () => new Set(currentUser?.permissions ?? []),
    [currentUser?.permissions],
  );

  const can = useCallback((permission: Permission) => granted.has(permission), [granted]);
  const canAny = useCallback(
    (...permissions: Permission[]) => permissions.some((p) => granted.has(p)),
    [granted],
  );

  return {
    can,
    canAny,
    roles: currentUser?.roles ?? [],
    isOwner: currentUser?.roles.includes("owner") ?? false,
  };
};

import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/middlewares/auth.middleware.js";
import type { Permission, PlatformPermission, TenantPermission } from "./permissions.js";

export type PermissionGuard = ((
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => void) & {
  permissions: readonly Permission[];
};

function guard(permissions: readonly Permission[]): PermissionGuard {
  const middleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const granted = req.user?.permissions;
    if (!granted || !permissions.some((permission) => granted.has(permission))) {
      res.status(403).json({ error: "No tienes permiso para hacer esto." });
      return;
    }
    next();
  };
  // El test de cobertura de rutas lee esta marca para saber que la ruta declaró permiso.
  return Object.assign(middleware, { permissions });
}

// Basta con uno de los permisos (p.ej. "repair-notes.deliver" o su variante .own): el
// service decide después sobre el registro ya cargado. Lee los permisos que dejó
// tenantMiddleware desde la base, nunca el JWT.
export const requirePermission = (
  ...permissions: [TenantPermission, ...TenantPermission[]]
): PermissionGuard => guard(permissions);

export const requirePlatformPermission = (
  ...permissions: [PlatformPermission, ...PlatformPermission[]]
): PermissionGuard => guard(permissions);

// Para lo que es del propio usuario sin importar su rol (su perfil): deja explícito,
// también para el test de cobertura, que la ruta no exige permiso a propósito.
export const authenticatedOnly: PermissionGuard = Object.assign(
  (_req: AuthenticatedRequest, _res: Response, next: NextFunction): void => next(),
  { permissions: [] as readonly Permission[] },
);

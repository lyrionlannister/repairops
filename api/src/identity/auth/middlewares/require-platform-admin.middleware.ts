import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";

// Ortogonal a requireRole: isPlatformAdmin no es un UserRole, es un flag
// cross-tenant propio (ver User.isPlatformAdmin, plan Fase 4 Checkpoint 7).
// Gatea configuracion de la plataforma misma, nunca datos de un tenant.
export const requirePlatformAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user?.isPlatformAdmin) {
    res.status(403).json({ error: "No autorizado" });
    return;
  }
  next();
};

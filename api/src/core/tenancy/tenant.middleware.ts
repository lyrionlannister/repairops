import { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../identity/auth/middlewares/auth.middleware.js";
import { runWithTenant, type BranchScope } from "./tenant-context.js";
import AppDataSource from "../config/data-source.js";

// Sucursales del personal (no owner): se leen de la base en cada petición porque las
// asignaciones cambian en caliente y el JWT no las lleva. Solo cuentan las activas.
async function loadBranchScope(tenantId: string, userId: string): Promise<BranchScope> {
  const rows: Array<{ branchId: string; isPrimary: boolean }> = await AppDataSource.query(
    `SELECT ub.branch_id::text AS "branchId", ub.is_primary AS "isPrimary"
     FROM user_branches ub JOIN branches b ON b.id = ub.branch_id AND b.tenant_id = ub.tenant_id
     WHERE ub.tenant_id = $1 AND ub.user_id = $2 AND b.activa = true`,
    [tenantId, userId],
  );
  const primaryId = rows.find((row) => row.isPrimary)?.branchId ?? null;
  return { readIds: primaryId ? [primaryId] : [], writeIds: rows.map((row) => row.branchId), primaryId };
}

// Va siempre despues de authMiddleware: ese ya puso req.user.tenantId desde
// el JWT. Este middleware propaga ese tenant (y, si el usuario no es owner, su alcance
// de sucursales) al AsyncLocalStorage para que los TenantScopedDao de todo el resto de
// la cadena lo vean. El owner accede a todas las sucursales y no lleva alcance.
export const tenantMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = req.user;
  const tenantId = user?.tenantId;

  if (!user || !tenantId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    const branch = user.role === "owner" ? null : await loadBranchScope(tenantId, user.id);
    runWithTenant(tenantId, () => next(), branch);
  } catch (error) {
    next(error);
  }
};

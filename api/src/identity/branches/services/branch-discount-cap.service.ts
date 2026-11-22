import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import { BranchDiscountCapDao } from "../daos/branch-discount-cap.dao.js";
import { BranchDao } from "../daos/branch.dao.js";
import { USER_ROLES, type UserRole } from "../../auth/entities/user.entity.js";

export class DiscountCapError extends Error {}

export interface DiscountCapInput {
  role: UserRole;
  maxDiscountPercent: number | string;
}

export interface DiscountCapRow {
  role: UserRole;
  maxDiscountPercent: string;
}

@singleton()
export class BranchDiscountCapService {
  constructor(
    private capDao: BranchDiscountCapDao,
    private branchDao: BranchDao,
  ) {}

  async getForBranch(branchId: string): Promise<DiscountCapRow[] | null> {
    if (!(await this.branchDao.findById(branchId))) return null;
    return (await this.capDao.findForBranch(branchId)).map(({ role, maxDiscountPercent }) => ({
      role,
      maxDiscountPercent: new Decimal(maxDiscountPercent).toFixed(2),
    }));
  }

  async replaceForBranch(
    branchId: string,
    caps: readonly DiscountCapInput[],
  ): Promise<DiscountCapRow[] | null> {
    if (!(await this.branchDao.findById(branchId))) return null;
    const seen = new Set<UserRole>();
    const rows = caps.map(({ role, maxDiscountPercent }) => {
      if (!USER_ROLES.includes(role) || role === "owner")
        throw new DiscountCapError("Rol inválido para un tope de descuento");
      if (seen.has(role)) throw new DiscountCapError("Rol repetido en los topes de descuento");
      seen.add(role);
      const percent = new Decimal(maxDiscountPercent);
      if (percent.isNaN() || percent.lessThan(0) || percent.greaterThan(100)) {
        throw new DiscountCapError("El tope de descuento debe estar entre 0 y 100");
      }
      return { role, maxDiscountPercent: percent.toFixed(2) };
    });
    await this.capDao.replaceForBranch(branchId, rows);
    return rows;
  }

  // El dueño no tiene tope (null). Con varios roles vale el mayor; sin fila para ninguno
  // de sus roles en esa sucursal, el tope es 0: nadie da descuento si el dueño no lo fijó.
  async maxDiscountFor(branchId: string, roles: readonly UserRole[]): Promise<Decimal | null> {
    if (roles.includes("owner")) return null;
    const caps = await this.capDao.findForBranchAndRoles(branchId, roles);
    return caps.reduce(
      (max, cap) => Decimal.max(max, new Decimal(cap.maxDiscountPercent)),
      new Decimal(0),
    );
  }
}

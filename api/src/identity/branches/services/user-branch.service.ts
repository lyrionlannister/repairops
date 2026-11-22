import { singleton } from "tsyringe";
import { UserBranchDao } from "../daos/user-branch.dao.js";
import { BranchDao } from "../daos/branch.dao.js";
import type { UserRole } from "../../auth/entities/user.entity.js";

export class BranchAssignmentError extends Error {}

export interface BranchAssignment {
  branchIds: string[];
  primaryBranchId: string | null;
}

// Sucursales de los usuarios del tenant. Solo el owner las define (al crear o editar a un
// usuario). El owner no tiene filas: accede a todas por rol.
@singleton()
export class UserBranchService {
  constructor(
    private userBranchDao: UserBranchDao,
    private branchDao: BranchDao,
  ) {}

  // Todo usuario que no es owner necesita al menos una sucursal, todas del tenant, y una
  // principal entre ellas (si no se indica, la primera). Devuelve la asignación ya normalizada.
  async normalize(
    roles: readonly UserRole[],
    branchIds: string[] | undefined,
    primaryBranchId: string | undefined,
  ): Promise<BranchAssignment> {
    if (roles.includes("owner")) return { branchIds: [], primaryBranchId: null };

    const unique = [...new Set((branchIds ?? []).map(String))];
    if (unique.length === 0) throw new BranchAssignmentError("Elige al menos una sucursal para el usuario");

    const tenantBranches = new Set((await this.branchDao.findAll()).map((branch) => String(branch.id)));
    const foreign = unique.filter((id) => !tenantBranches.has(id));
    if (foreign.length > 0) throw new BranchAssignmentError("Alguna sucursal no existe en este negocio");

    const primary = primaryBranchId ? String(primaryBranchId) : (unique[0] as string);
    if (!unique.includes(primary)) throw new BranchAssignmentError("La sucursal principal debe estar entre las asignadas");
    return { branchIds: unique, primaryBranchId: primary };
  }

  async assign(userId: string, assignment: BranchAssignment): Promise<void> {
    await this.userBranchDao.replaceForUser(userId, assignment.branchIds, assignment.primaryBranchId);
  }

  async getAssignments(): Promise<Map<string, BranchAssignment>> {
    const result = new Map<string, BranchAssignment>();
    for (const row of await this.userBranchDao.findAllOfTenant()) {
      const entry = result.get(String(row.userId)) ?? { branchIds: [], primaryBranchId: null };
      entry.branchIds.push(String(row.branchId));
      if (row.isPrimary) entry.primaryBranchId = String(row.branchId);
      result.set(String(row.userId), entry);
    }
    return result;
  }
}

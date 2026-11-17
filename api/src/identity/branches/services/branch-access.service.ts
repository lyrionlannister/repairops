import { singleton } from "tsyringe";
import { BranchDao } from "../daos/branch.dao.js";
import { BranchAccessError, getBranchScope } from "../../../core/tenancy/tenant-context.js";

export const ALL_BRANCHES = "all";

// Unico lugar que decide a qué sucursal se refiere una petición y si el usuario puede
// usarla. El cliente puede mandar cualquier id: aquí se valida contra el tenant y contra
// el alcance del usuario (el owner ve todas; el personal solo las suyas).
@singleton()
export class BranchAccessService {
  constructor(private branchDao: BranchDao) {}

  // Sucursal para LEER. null = todas, y solo el owner puede pedirlo. El personal siempre
  // recibe su sucursal principal (o una de las suyas si la pide explícitamente).
  async resolveReadBranch(requested?: string | null): Promise<string | null> {
    const scope = getBranchScope();
    const wanted = requested && requested !== ALL_BRANCHES ? String(requested) : null;

    if (!scope) {
      if (!wanted) return null;
      await this.assertTenantBranch(wanted);
      return wanted;
    }
    if (requested === ALL_BRANCHES) throw new BranchAccessError("Solo el owner puede ver todas las sucursales");
    const branch = wanted ?? scope.primaryId;
    if (!branch || !scope.readIds.includes(branch)) throw new BranchAccessError("No tienes acceso a esa sucursal");
    return branch;
  }

  // Sucursal para ESCRIBIR: siempre una concreta, activa y permitida.
  async resolveWriteBranch(requested?: string | null): Promise<string> {
    const scope = getBranchScope();
    const wanted = requested && requested !== ALL_BRANCHES ? String(requested) : null;

    if (scope) {
      const branch = wanted ?? scope.primaryId;
      if (!branch || !scope.writeIds.includes(branch)) throw new BranchAccessError("No tienes acceso a esa sucursal");
      return branch;
    }
    if (!wanted) throw new BranchAccessError("Elige la sucursal");
    const found = await this.assertTenantBranch(wanted);
    if (!found.isActive) throw new BranchAccessError("La sucursal está desactivada");
    return wanted;
  }

  private async assertTenantBranch(id: string) {
    const branch = /^\d{1,18}$/.test(id) ? await this.branchDao.findById(id) : null;
    if (!branch) throw new BranchAccessError("La sucursal no existe");
    return branch;
  }
}

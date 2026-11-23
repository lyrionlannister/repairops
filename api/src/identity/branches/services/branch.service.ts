import { singleton } from "tsyringe";
import { BranchDao } from "../daos/branch.dao.js";
import { Branch } from "../entities/branch.entity.js";
import { getBranchScope } from "../../../core/tenancy/tenant-context.js";
import { PlanLimitService } from "../../../app_platform/billing/services/plan-limit.service.js";
import { BusinessError } from "../../../core/http/business-error.js";

type CreatePayload = Pick<Branch, "name" | "address" | "phone">;
type UpdatePayload = Partial<CreatePayload>;

@singleton()
export class BranchService {
  constructor(
    private dao: BranchDao,
    private planLimitService: PlanLimitService,
  ) {}

  // Owner: todas las del tenant. Personal: solo las suyas, con la principal marcada.
  async getAll(): Promise<Array<Branch & { isPrimary?: boolean }>> {
    const all = await this.dao.findAll();
    const scope = getBranchScope();
    if (!scope) return all;
    return all
      .filter((branch) => scope.writeIds.includes(String(branch.id)))
      .map((branch) => Object.assign(branch, { isPrimary: String(branch.id) === scope.primaryId }));
  }

  async getById(id: string): Promise<Branch | null> {
    const branch = await this.dao.findById(id);
    const scope = getBranchScope();
    return branch && scope && !scope.writeIds.includes(String(branch.id)) ? null : branch;
  }

  async create(data: CreatePayload): Promise<Branch> {
    const name = data.name?.trim();
    if (!name) {
      throw new BusinessError("El nombre de la sucursal es obligatorio");
    }

    return this.planLimitService.withCapacity("branches", () =>
      this.dao.create({
        name,
        address: data.address?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        isActive: true,
      }),
    );
  }

  async update(id: string, data: UpdatePayload): Promise<Branch | null> {
    const payload: Partial<Branch> = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new BusinessError("El nombre de la sucursal es obligatorio");
      }
      payload.name = name;
    }
    if (data.address !== undefined) payload.address = data.address.trim() || undefined;
    if (data.phone !== undefined) payload.phone = data.phone.trim() || undefined;

    return this.dao.update(id, payload);
  }

  // Soft: nunca se borra una sucursal, solo se desactiva -- es reversible y
  // no requiere revisar relaciones (notas/ventas/caja no se pierden).
  async setActive(id: string, isActive: boolean): Promise<Branch | null> {
    const current = await this.dao.findById(id);
    if (!current) return null;
    if (!isActive || current.isActive) return this.dao.update(id, { isActive });
    return this.planLimitService.withCapacity("branches", () => this.dao.update(id, { isActive }));
  }

  // Idempotente: solo siembra "Sucursal principal" si el tenant aun no tiene
  // ninguna sucursal -- se corre una vez al pasar de singleton Local a Branch.
  async seed(defaults: { name?: string; address?: string; phone?: string }): Promise<void> {
    const count = await this.dao.count();
    if (count > 0) return;

    await this.dao.create({
      name: defaults.name?.trim() || "Sucursal principal",
      address: defaults.address?.trim() || undefined,
      phone: defaults.phone?.trim() || undefined,
      isActive: true,
    });
    console.log("Sucursal sembrada: Sucursal principal");
  }
}

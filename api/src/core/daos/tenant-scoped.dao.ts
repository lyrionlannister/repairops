import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { BaseDao } from "./base.dao.js";
import { BranchAccessError, getBranchScope, getCurrentTenantId } from "../tenancy/tenant-context.js";

type TenantOwned = { tenantId: string };

const idText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" || typeof value === "bigint" ? String(value) : "";

// Unico lugar donde un repository concreto construye una query sobre un
// modelo con tenant: todo metodo propio de un Dao hijo debe partir de
// `this.scoped()`, nunca de `this.repository.find()`/`createQueryBuilder()`
// directo, asi el filtro de tenant no depende de que cada autor se acuerde
// de ponerlo. Los metodos heredados de BaseDao ya quedan cubiertos aqui.
//
// Las entidades con sucursal (columna `localId`) ademas se acotan a las sucursales del
// usuario cuando el contexto trae un alcance (personal que no es owner): lecturas a su
// sucursal principal, escrituras a las suyas. El owner no tiene alcance y ve todas.
export abstract class TenantScopedDao<
  T extends ObjectLiteral & TenantOwned,
> extends BaseDao<T> {
  private readonly hasBranch: boolean;

  constructor(repository: Repository<T>) {
    super(repository);
    this.hasBranch = repository.metadata.hasColumnWithPropertyPath("localId");
  }

  protected scoped(alias = "entity"): SelectQueryBuilder<T> {
    const tenantId = getCurrentTenantId();
    const query = this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.tenantId = :tenantId`, { tenantId });
    const branch = this.hasBranch ? getBranchScope() : null;
    if (branch) {
      if (branch.readIds.length === 0) query.andWhere("1 = 0");
      else query.andWhere(`${alias}.localId IN (:...readBranchIds)`, { readBranchIds: branch.readIds });
    }
    return query;
  }

  protected currentTenantId(): string {
    return getCurrentTenantId();
  }

  private canRead(entity: T): boolean {
    const branch = this.hasBranch ? getBranchScope() : null;
    return !branch || branch.readIds.includes(idText((entity as { localId?: unknown }).localId));
  }

  override async create(data: Partial<T>): Promise<T> {
    const tenantId = getCurrentTenantId();
    const branch = this.hasBranch ? getBranchScope() : null;
    if (branch) {
      const localId = idText((data as { localId?: unknown }).localId ?? branch.primaryId);
      if (!branch.writeIds.includes(localId)) {
        throw new BranchAccessError("No tienes acceso a esa sucursal");
      }
      return super.create({ ...data, localId, tenantId });
    }
    return super.create({ ...data, tenantId });
  }

  override async findById(id: string | number): Promise<T | null> {
    const tenantId = getCurrentTenantId();
    const entity = await super.findById(id);
    if (!entity || entity.tenantId !== tenantId || !this.canRead(entity)) return null;
    return entity;
  }

  override async findOne(where: Partial<T>): Promise<T | null> {
    const tenantId = getCurrentTenantId();
    const entity = await super.findOne({ ...where, tenantId });
    return entity && this.canRead(entity) ? entity : null;
  }

  override async findAll(): Promise<T[]> {
    if (this.hasBranch) return this.scoped().getMany();
    const tenantId = getCurrentTenantId();
    return this.repository.find({ where: this.where({ tenantId }) });
  }

  override async update(id: string | number, data: Partial<T>): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const branch = this.hasBranch ? getBranchScope() : null;
    const newLocal = (data as { localId?: unknown }).localId;
    if (branch && newLocal !== undefined && !branch.writeIds.includes(idText(newLocal))) {
      throw new BranchAccessError("No tienes acceso a esa sucursal");
    }
    return super.update(id, data);
  }

  override async delete(id: string | number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    return super.delete(id);
  }
}

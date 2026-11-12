import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Supplier } from "../entities/supplier.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class SupplierDao extends TenantScopedDao<Supplier> {
  constructor(@inject(repositoryToken(Supplier)) repository: Repository<Supplier>) {
    super(repository);
  }

  override async findAll(): Promise<Supplier[]> {
    return this.scoped().orderBy("entity.name", "ASC").getMany();
  }

  async count(): Promise<number> {
    return this.scoped().getCount();
  }
}

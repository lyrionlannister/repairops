import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Branch } from "../entities/branch.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class BranchDao extends TenantScopedDao<Branch> {
  constructor(@inject(repositoryToken(Branch)) repository: Repository<Branch>) {
    super(repository);
  }

  override async findAll(): Promise<Branch[]> {
    return this.scoped().orderBy("entity.name", "ASC").getMany();
  }

  async count(): Promise<number> {
    return this.scoped().getCount();
  }
}

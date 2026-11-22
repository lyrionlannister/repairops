import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { BaseDao } from "../../../core/daos/base.dao.js";
import { Plan, type PlanKey } from "../entities/plan.entity.js";

// BaseDao y no TenantScopedDao: el catálogo de planes es de la plataforma, sin tenant_id.
@singleton()
export class PlanDao extends BaseDao<Plan> {
  constructor(@inject(repositoryToken(Plan)) repository: Repository<Plan>) {
    super(repository);
  }

  async findByKey(key: PlanKey): Promise<Plan | null> {
    return this.repository.findOneBy({ key });
  }

  override async findAll(): Promise<Plan[]> {
    return this.repository.find({ order: { id: "ASC" } });
  }
}

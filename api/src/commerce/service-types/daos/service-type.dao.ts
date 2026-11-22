import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { ServiceType } from "../entities/service-type.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class ServiceTypeDao extends TenantScopedDao<ServiceType> {
  constructor(@inject(repositoryToken(ServiceType)) repository: Repository<ServiceType>) {
    super(repository);
  }

  async findAllOrdered(): Promise<ServiceType[]> {
    return this.scoped().orderBy("entity.name", "ASC").getMany();
  }

  async findByName(name: string): Promise<ServiceType | null> {
    return this.findOne({ name });
  }
}

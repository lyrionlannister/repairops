import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Customer } from "../entities/customer.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class CustomerDao extends TenantScopedDao<Customer> {
  constructor(@inject(repositoryToken(Customer)) repository: Repository<Customer>) {
    super(repository);
  }

  override async findAll(): Promise<Customer[]> {
    return this.scoped().orderBy("entity.name", "ASC").getMany();
  }
}

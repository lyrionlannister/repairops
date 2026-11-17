import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { CustomerPayment } from "../entities/customer-payment.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class CustomerPaymentDao extends TenantScopedDao<CustomerPayment> {
  constructor(@inject(repositoryToken(CustomerPayment)) repository: Repository<CustomerPayment>) {
    super(repository);
  }

  async findByCustomerId(customerId: string): Promise<CustomerPayment[]> {
    return this.scoped().andWhere("entity.customerId = :customerId", { customerId }).orderBy("entity.createdAt", "DESC").getMany();
  }
}

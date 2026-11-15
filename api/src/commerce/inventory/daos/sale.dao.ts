import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Sale } from "../entities/sale.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class SaleDao extends TenantScopedDao<Sale> {
  constructor(@inject(repositoryToken(Sale)) repository: Repository<Sale>) {
    super(repository);
  }

  async findAllOrdered(): Promise<Sale[]> {
    return this.scoped().orderBy("entity.createdAt", "DESC").getMany();
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Sale | null> {
    return this.scoped().andWhere("entity.idempotencyKey = :idempotencyKey", { idempotencyKey }).getOne();
  }
}

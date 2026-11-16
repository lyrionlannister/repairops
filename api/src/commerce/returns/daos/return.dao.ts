import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Return } from "../entities/return.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class ReturnDao extends TenantScopedDao<Return> {
  constructor(@inject(repositoryToken(Return)) repository: Repository<Return>) {
    super(repository);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Return | null> {
    return this.scoped().andWhere("entity.idempotencyKey = :idempotencyKey", { idempotencyKey }).getOne();
  }

  async findBySaleId(saleId: string): Promise<Return[]> {
    return this.scoped().andWhere("entity.saleId = :saleId", { saleId }).orderBy("entity.createdAt", "DESC").getMany();
  }
}

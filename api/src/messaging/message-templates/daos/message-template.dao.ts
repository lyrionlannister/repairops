import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { MessageTemplate } from "../entities/message-template.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class MessageTemplateDao extends TenantScopedDao<MessageTemplate> {
  constructor(@inject(repositoryToken(MessageTemplate)) repository: Repository<MessageTemplate>) {
    super(repository);
  }

  async findByKey(key: string): Promise<MessageTemplate | null> {
    return this.findOne({ key });
  }

  async findAllOrdered(): Promise<MessageTemplate[]> {
    return this.scoped().orderBy("entity.key", "ASC").getMany();
  }
}

import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { WhatsappTemplateStatus } from "../entities/whatsapp-template-status.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class WhatsappTemplateStatusDao extends TenantScopedDao<WhatsappTemplateStatus> {
  constructor(@inject(repositoryToken(WhatsappTemplateStatus)) repository: Repository<WhatsappTemplateStatus>) {
    super(repository);
  }

  async findByCatalogKey(catalogKey: string): Promise<WhatsappTemplateStatus | null> {
    return this.findOne({ catalogKey } as Partial<WhatsappTemplateStatus>);
  }

  async findAllForTenant(): Promise<WhatsappTemplateStatus[]> {
    return this.findAll();
  }
}

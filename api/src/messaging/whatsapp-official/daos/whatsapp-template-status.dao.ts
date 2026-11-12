import { Repository } from "typeorm";
import { WhatsappTemplateStatus } from "../entities/whatsapp-template-status.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

export class WhatsappTemplateStatusDao extends TenantScopedDao<WhatsappTemplateStatus> {
  constructor(repository: Repository<WhatsappTemplateStatus>) {
    super(repository);
  }

  async findByCatalogKey(catalogKey: string): Promise<WhatsappTemplateStatus | null> {
    return this.findOne({ catalogKey } as Partial<WhatsappTemplateStatus>);
  }

  async findAllForTenant(): Promise<WhatsappTemplateStatus[]> {
    return this.findAll();
  }
}

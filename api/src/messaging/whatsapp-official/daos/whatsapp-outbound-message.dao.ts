import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { WhatsappOutboundMessage } from "../entities/whatsapp-outbound-message.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class WhatsappOutboundMessageDao extends TenantScopedDao<WhatsappOutboundMessage> {
  constructor(@inject(repositoryToken(WhatsappOutboundMessage)) repository: Repository<WhatsappOutboundMessage>) {
    super(repository);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<WhatsappOutboundMessage | null> {
    return this.scoped().andWhere("entity.idempotencyKey = :idempotencyKey", { idempotencyKey }).getOne();
  }
}

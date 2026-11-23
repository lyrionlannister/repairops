import { singleton, inject } from "tsyringe";
import { Repository } from "typeorm";
import { WhatsappPendingNotification } from "../entities/whatsapp-pending-notification.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { repositoryToken } from "../../../core/di/repository-token.js";

@singleton()
export class WhatsappPendingNotificationDao extends TenantScopedDao<WhatsappPendingNotification> {
  constructor(
    @inject(repositoryToken(WhatsappPendingNotification))
    repository: Repository<WhatsappPendingNotification>,
  ) {
    super(repository);
  }

  async findByRepairNoteId(repairNoteId: string): Promise<WhatsappPendingNotification | null> {
    return this.scoped().andWhere("entity.repairNoteId = :repairNoteId", { repairNoteId }).getOne();
  }

  // Upsert manual (una sola fila por nota, ver entity): el evento mas
  // reciente pisa cualquier aviso anterior sin enviar de esa misma nota.
  async upsertForNote(
    repairNoteId: string,
    contactNumber: string,
    eventKey: string,
    messageText: string,
    expiresAt: Date,
  ): Promise<WhatsappPendingNotification> {
    const existing = await this.findByRepairNoteId(repairNoteId);
    if (existing) {
      return (await this.update(existing.id, {
        contactNumber,
        eventKey,
        messageText,
        expiresAt,
      } as Partial<WhatsappPendingNotification>))!;
    }
    return this.create({
      repairNoteId,
      contactNumber,
      eventKey,
      messageText,
      expiresAt,
    } as Partial<WhatsappPendingNotification>);
  }

  async deleteForNote(repairNoteId: string): Promise<boolean> {
    const existing = await this.findByRepairNoteId(repairNoteId);
    if (!existing) return false;
    return this.delete(existing.id);
  }
}

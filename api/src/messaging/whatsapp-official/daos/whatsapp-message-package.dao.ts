import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { QueryFailedError } from "typeorm";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { WhatsappMessagePackage } from "../entities/whatsapp-message-package.entity.js";

@singleton()
export class WhatsappMessagePackageDao extends TenantScopedDao<WhatsappMessagePackage> {
  constructor(
    @inject(repositoryToken(WhatsappMessagePackage)) repository: Repository<WhatsappMessagePackage>,
  ) {
    super(repository);
  }

  // Insert-first por stripe_checkout_session_id: si Stripe reintenta el webhook,
  // el UNIQUE choca y acá se traduce a "ya se acreditó" en vez de duplicar mensajes.
  async claim(data: Partial<WhatsappMessagePackage>): Promise<boolean> {
    try {
      await this.create(data);
      return true;
    } catch (error) {
      if (error instanceof QueryFailedError && (error as { code?: string }).code === "23505") {
        return false;
      }
      throw error;
    }
  }

  async sumGrantedSince(periodStart: Date): Promise<number> {
    const row = await this.scoped()
      .select("COALESCE(SUM(entity.messagesGranted), 0)", "total")
      .andWhere("entity.createdAt >= :periodStart", { periodStart })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }
}

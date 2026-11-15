import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { WhatsappAccount } from "../entities/whatsapp-account.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class WhatsappAccountDao extends TenantScopedDao<WhatsappAccount> {
  constructor(@inject(repositoryToken(WhatsappAccount)) repository: Repository<WhatsappAccount>) {
    super(repository);
  }

  async findByTenant(): Promise<WhatsappAccount | null> {
    return this.findOne({});
  }

  async findByPhoneNumberId(phoneNumberId: string): Promise<WhatsappAccount | null> {
    // Webhook entrante de Meta no trae tenantId -- resuelve por
    // phoneNumberId sin pasar por scoped(), que exige tenant ya conocido
    // (ver plan Fase 4, Checkpoint 4).
    return this.repository.findOneBy({ phoneNumberId });
  }

  async connectOwnAccount(
    credentials: Pick<WhatsappAccount, "wabaId" | "phoneNumberId" | "accessToken">,
  ): Promise<WhatsappAccount> {
    // Reemplaza las credenciales de la fila existente del tenant -- nunca
    // inserta una segunda, tenant_id es unique (ver plan Fase 4, Checkpoint 6).
    const existing = await this.findByTenant();
    if (!existing) {
      throw new Error("No existe cuenta de WhatsApp para este tenant todavía");
    }
    const updated = await this.update(existing.id, {
      ...credentials,
      ownedByPlatform: false,
      status: "connected",
    } as Partial<WhatsappAccount>);
    if (!updated) {
      throw new Error("No se pudo actualizar la cuenta de WhatsApp");
    }
    return updated;
  }

  async getOrCreateForTenant(
    seed: Pick<WhatsappAccount, "wabaId" | "phoneNumberId" | "accessToken" | "ownedByPlatform">,
  ): Promise<WhatsappAccount> {
    const existing = await this.findByTenant();
    if (existing) return existing;
    try {
      return await this.create({ ...seed, status: "connected" });
    } catch {
      // Race: otra llamada concurrente ya insertó para este tenant (tenant_id
      // es unique) -- mismo criterio que LocalDao.findOrCreate.
      const existingAfterRace = await this.findByTenant();
      if (existingAfterRace) return existingAfterRace;
      throw new Error("No se pudo crear ni encontrar WhatsappAccount para el tenant");
    }
  }
}

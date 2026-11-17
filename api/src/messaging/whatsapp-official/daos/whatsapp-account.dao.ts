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

  // La cuenta piloto es compartida: varias filas (una por tenant) con el mismo
  // phone_number_id. El resolvedor decide cual aplica (ver WhatsappTenantResolver).
  async findAllByPhoneNumberId(phoneNumberId: string): Promise<WhatsappAccount[]> {
    return this.repository.findBy({ phoneNumberId });
  }

  async connectOwnAccount(
    credentials: Pick<WhatsappAccount, "wabaId" | "phoneNumberId" | "accessToken" | "displayPhoneNumber">,
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

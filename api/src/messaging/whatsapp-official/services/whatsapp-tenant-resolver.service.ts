import { singleton, inject } from "tsyringe";
import { Repository } from "typeorm";
import { WhatsappAccountDao } from "../daos/whatsapp-account.dao.js";
import { WhatsappAccount } from "../entities/whatsapp-account.entity.js";
import { RepairNote } from "../../../commerce/repair-notes/entities/repair-note.entity.js";
import { extractPublicRef } from "../../../commerce/repair-notes/utils/public-ref.js";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { redisClient } from "../../../core/config/redis-client.js";

const BINDING_TTL_SECONDS = 86400; // igual que la ventana de 24h de WhatsApp

export interface ResolvedWhatsappContext {
  account: WhatsappAccount;
  // Nota del tenant resuelto a la que apunta el ref del mensaje, si lo hay.
  note: RepairNote | null;
}

const maskPhone = (phone: string) => `***${phone.slice(-4)}`;

// Decide a que tenant pertenece un mensaje entrante. Con la cuenta piloto
// compartida varios tenants comparten phone_number_id, asi que el tenant sale
// del ref de la nota (o de la asociacion contacto->tenant ya guardada). Nunca
// se elige un tenant al azar: sin datos suficientes el mensaje se descarta.
@singleton()
export class WhatsappTenantResolver {
  constructor(
    private whatsappAccountDao: WhatsappAccountDao,
    @inject(repositoryToken(RepairNote)) private repairNoteRepository: Repository<RepairNote>,
  ) {}

  async resolve(phoneNumberId: string, from: string, text: string): Promise<ResolvedWhatsappContext | null> {
    const accounts = await this.whatsappAccountDao.findAllByPhoneNumberId(phoneNumberId);
    if (accounts.length === 0) {
      console.warn("Webhook de WhatsApp: phone_number_id sin cuenta asociada", { phoneNumberId });
      return null;
    }

    const ref = extractPublicRef(text);
    // public_ref es unico en toda la tabla: una sola fila, de un solo tenant.
    const refNote = ref ? await this.repairNoteRepository.findOneBy({ publicRef: ref }) : null;

    const ownAccounts = accounts.filter((account) => !account.ownedByPlatform);
    if (accounts.length === 1 && ownAccounts.length === 1) {
      const account = ownAccounts[0]!;
      return { account, note: refNote && refNote.tenantId === account.tenantId ? refNote : null };
    }

    const bindingKey = `wa_binding:${phoneNumberId}:${from}`;
    const refAccount = refNote ? accounts.find((account) => account.tenantId === refNote.tenantId) : undefined;
    if (refAccount) {
      await redisClient.set(bindingKey, refAccount.tenantId, "EX", BINDING_TTL_SECONDS);
      return { account: refAccount, note: refNote };
    }

    const boundTenantId = await redisClient.get(bindingKey);
    const boundAccount = boundTenantId ? accounts.find((account) => account.tenantId === boundTenantId) : undefined;
    if (boundAccount) {
      await redisClient.expire(bindingKey, BINDING_TTL_SECONDS);
      return { account: boundAccount, note: null };
    }

    console.warn("Webhook de WhatsApp: mensaje sin tenant atribuible en cuenta compartida, descartado", {
      phoneNumberId,
      from: maskPhone(from),
    });
    return null;
  }
}

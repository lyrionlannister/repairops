import { singleton, inject } from "tsyringe";
import { WhatsappAccountDao } from "../daos/whatsapp-account.dao.js";
import { WhatsappAccount } from "../entities/whatsapp-account.entity.js";
import { requiredEnv } from "../../../core/config/env.js";
import { getDisplayPhoneNumber, verifyAccountCredentials } from "../clients/whatsapp-graph.client.js";
import type { ConnectWhatsappAccountDto } from "../dtos/connect-whatsapp-account.dto.js";

@singleton()
export class WhatsappAccountService {
  constructor(private whatsappAccountDao: WhatsappAccountDao) {}

  // Etapa 2: valida las credenciales contra Meta ANTES de guardar nada -- si
  // Meta las rechaza, la cuenta piloto sigue intacta (ver plan Fase 4,
  // Checkpoint 6).
  async connectOwnAccount(dto: ConnectWhatsappAccountDto): Promise<WhatsappAccount> {
    await verifyAccountCredentials(dto.wabaId, dto.phoneNumberId, dto.accessToken);
    const displayPhoneNumber = await getDisplayPhoneNumber(dto.phoneNumberId, dto.accessToken).catch(() => null);
    return this.whatsappAccountDao.connectOwnAccount({
      wabaId: dto.wabaId,
      phoneNumberId: dto.phoneNumberId,
      accessToken: dto.accessToken,
      displayPhoneNumber,
    });
  }

  // Numero al que escribe el cliente, para el QR de la nota. Se llena de forma
  // perezosa consultando a Meta la primera vez; sin cuenta o si Meta falla
  // devuelve null y la nota se imprime sin QR (nunca un QR roto).
  async getDisplayPhoneNumber(): Promise<string | null> {
    const account = await this.whatsappAccountDao.findByTenant();
    if (!account) return null;
    if (account.displayPhoneNumber) return account.displayPhoneNumber;
    try {
      const displayPhoneNumber = await getDisplayPhoneNumber(account.phoneNumberId, account.accessToken);
      await this.whatsappAccountDao.update(account.id, { displayPhoneNumber } as Partial<WhatsappAccount>);
      return displayPhoneNumber;
    } catch (error) {
      console.warn("No se pudo obtener el número de WhatsApp de la cuenta", { tenantId: account.tenantId });
      return null;
    }
  }

  // Etapa 1: toda cuenta nueva apunta a la cuenta piloto compartida de la
  // plataforma. Etapa 2 reemplaza este seed por credenciales propias del
  // taller capturadas a mano en un formulario admin (no Embedded Signup --
  // eso exige ser Meta Tech Provider, que aun no se tiene).
  async getOrCreateForTenant(): Promise<WhatsappAccount> {
    return this.whatsappAccountDao.getOrCreateForTenant({
      wabaId: requiredEnv("WHATSAPP_PILOT_WABA_ID"),
      phoneNumberId: requiredEnv("WHATSAPP_PILOT_PHONE_NUMBER_ID"),
      accessToken: requiredEnv("WHATSAPP_PILOT_ACCESS_TOKEN"),
      ownedByPlatform: true,
    });
  }
}

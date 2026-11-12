import { singleton, inject } from "tsyringe";
import { WhatsappAccountDao } from "../daos/whatsapp-account.dao.js";
import { WhatsappAccount } from "../entities/whatsapp-account.entity.js";
import { requiredEnv } from "../../../core/config/env.js";

@singleton()
export class WhatsappAccountService {
  constructor(private whatsappAccountDao: WhatsappAccountDao) {}

  // Etapa 1: toda cuenta nueva apunta a la cuenta piloto compartida de la
  // plataforma (sin OAuth por tenant todavía). Etapa 2 reemplaza este seed
  // por las credenciales reales que entregue el Embedded Signup.
  async getOrCreateForTenant(): Promise<WhatsappAccount> {
    return this.whatsappAccountDao.getOrCreateForTenant({
      wabaId: requiredEnv("WHATSAPP_PILOT_WABA_ID"),
      phoneNumberId: requiredEnv("WHATSAPP_PILOT_PHONE_NUMBER_ID"),
      accessToken: requiredEnv("WHATSAPP_PILOT_ACCESS_TOKEN"),
      ownedByPlatform: true,
    });
  }
}

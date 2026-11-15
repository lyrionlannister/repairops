import { singleton, inject } from "tsyringe";
import { Repository } from "typeorm";
import { WhatsappAccountDao } from "../daos/whatsapp-account.dao.js";
import { WhatsappSendService } from "./whatsapp-send.service.js";
import { ChatAutomationService } from "../../chats/services/chat-automation.service.js";
import { ExcludedPhone } from "../../whatsapp-admin/entities/excluded-phone.entity.js";
import { WhatsappSettings } from "../../whatsapp-admin/entities/whatsapp-settings.entity.js";
import { ContactName } from "../../chats/entities/contact-name.entity.js";
import { humanModeService } from "../../../app_platform/human-mode/human-mode.service.js";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { runWithTenant } from "../../../core/tenancy/tenant-context.js";

export interface IncomingWhatsappMessage {
  phoneNumberId: string;
  from: string;
  body: string;
  contactName?: string;
}

// Mismo flujo que tenia WhatsappListener.client.on("message") (retirado
// junto con whatsapp-web.js): exclusion, respuestas-IA habilitadas, nombre
// de contacto, modo humano, n8n, y responder -- solo cambia el transporte
// (Graph API en vez de Puppeteer) y como se resuelve el tenant (por
// phoneNumberId del payload de Meta, no "el primer tenant que exista").
@singleton()
export class WhatsappWebhookService {
  constructor(
    private whatsappAccountDao: WhatsappAccountDao,
    private whatsappSendService: WhatsappSendService,
    private chatAutomationService: ChatAutomationService,
    @inject(repositoryToken(ExcludedPhone)) private excludedPhoneRepository: Repository<ExcludedPhone>,
    @inject(repositoryToken(WhatsappSettings)) private whatsappSettingsRepository: Repository<WhatsappSettings>,
    @inject(repositoryToken(ContactName)) private contactNameRepository: Repository<ContactName>,
  ) {}

  async handleIncomingMessage(message: IncomingWhatsappMessage): Promise<void> {
    const account = await this.whatsappAccountDao.findByPhoneNumberId(message.phoneNumberId);
    if (!account) {
      console.warn("Webhook de WhatsApp: phone_number_id sin cuenta asociada", {
        phoneNumberId: message.phoneNumberId,
      });
      return;
    }

    await runWithTenant(account.tenantId, async () => {
      const isExcluded = await this.excludedPhoneRepository.exists({
        where: { tenantId: account.tenantId, phone: message.from },
      });
      if (isExcluded) {
        console.log("Mensaje ignorado por exclusión de teléfono", { from: message.from });
        return;
      }

      const aiRepliesEnabled = await this.getAiRepliesEnabled(account.tenantId);
      if (!aiRepliesEnabled) {
        console.log("Mensaje ignorado: respuestas con IA deshabilitadas", { from: message.from });
        return;
      }

      if (message.contactName) {
        this.contactNameRepository
          .save({ phone: message.from, name: message.contactName })
          .catch((err) => console.warn("Error guardando nombre de contacto:", err));
      }

      const isHumanMode = await humanModeService.isActive(message.from);
      if (isHumanMode) {
        console.log("Conversación en modo humano, omitiendo IA", { from: message.from });
        return;
      }

      const automationResponse = await this.chatAutomationService.send({
        from: message.from,
        body: message.body,
      });

      if (automationResponse?.transferToHuman) {
        await humanModeService.activate(message.from, message.contactName);
        console.log("Conversación transferida a humano:", { from: message.from });
      }

      if (!automationResponse?.reply) return;

      // Responde dentro de la misma llamada que recibio el mensaje -- la
      // ventana de 24h siempre esta abierta (el mensaje acaba de llegar).
      await this.whatsappSendService.sendFreeText(
        account.phoneNumberId,
        account.accessToken,
        message.from,
        automationResponse.reply,
        new Date(),
      );
    });
  }

  private async getAiRepliesEnabled(tenantId: string): Promise<boolean> {
    const settings = await this.whatsappSettingsRepository.findOneBy({ tenantId });
    if (settings) return settings.aiRepliesEnabled;

    const created = this.whatsappSettingsRepository.create({ tenantId, aiRepliesEnabled: true });
    await this.whatsappSettingsRepository.save(created);
    return true;
  }
}

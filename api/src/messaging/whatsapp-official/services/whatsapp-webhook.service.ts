import { singleton, inject } from "tsyringe";
import { Repository } from "typeorm";
import { WhatsappTenantResolver } from "./whatsapp-tenant-resolver.service.js";
import { WhatsappSendService } from "./whatsapp-send.service.js";
import { WhatsappAutomationQueueService } from "./whatsapp-automation-queue.service.js";
import { WhatsappNotificationQueueService } from "./whatsapp-notification-queue.service.js";
import { ChatsService } from "../../chats/services/chats.service.js";
import { ChatMediaService } from "../../chats/services/chat-media.service.js";
import type { ChatMessageType } from "../../chats/entities/chat-message.entity.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { normalizePhone } from "../../chats/helpers/chats.helpers.js";
import { buildNoteStatusReply } from "../utils/note-status-reply.js";
import { ExcludedPhone } from "../../whatsapp-admin/entities/excluded-phone.entity.js";
import { WhatsappSettings } from "../../whatsapp-admin/entities/whatsapp-settings.entity.js";
import { ContactName } from "../../chats/entities/contact-name.entity.js";
import { humanModeService } from "../../../app_platform/human-mode/human-mode.service.js";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { runWithTenant } from "../../../core/tenancy/tenant-context.js";

export interface IncomingWhatsappMessage {
  phoneNumberId: string;
  from: string;
  messageId?: string;
  // Texto, o el pie de foto / nombre del lugar en los demas tipos (puede ir vacio).
  body: string;
  contactName?: string;
  messageType: ChatMessageType;
  media?: { id: string; mimeType?: string; sha256?: string };
  location?: { lat: string; lng: string };
}

// WhatsApp solo atiende: el cliente escribe primero (escaneando el QR de su
// nota) y el API responde con texto libre, siempre dentro de la ventana de 24h.
// Orden: resolver el tenant, exclusion, guardar el mensaje, interruptor de
// respuestas automaticas, modo humano, reenviar el texto a n8n (que acumula
// rafagas y decide si responde) y, si el mensaje trae el ref de una nota,
// responder con su estado.
@singleton()
export class WhatsappWebhookService {
  constructor(
    private tenantResolver: WhatsappTenantResolver,
    private whatsappSendService: WhatsappSendService,
    private chatsService: ChatsService,
    private localService: LocalService,
    private chatMediaService: ChatMediaService,
    @inject(repositoryToken(ExcludedPhone))
    private excludedPhoneRepository: Repository<ExcludedPhone>,
    @inject(repositoryToken(WhatsappSettings))
    private whatsappSettingsRepository: Repository<WhatsappSettings>,
    @inject(repositoryToken(ContactName)) private contactNameRepository: Repository<ContactName>,
    private whatsappAutomationQueueService: WhatsappAutomationQueueService,
    private whatsappNotificationQueueService: WhatsappNotificationQueueService,
  ) {}

  async handleIncomingMessage(message: IncomingWhatsappMessage): Promise<void> {
    const context = await this.tenantResolver.resolve(
      message.phoneNumberId,
      message.from,
      message.body,
    );
    if (!context) return;
    const { account, note } = context;

    await runWithTenant(account.tenantId, async () => {
      const isExcluded = await this.excludedPhoneRepository.exists({
        where: { tenantId: account.tenantId, phone: message.from },
      });
      if (isExcluded) {
        console.log("Mensaje ignorado por exclusión de teléfono");
        return;
      }

      // Se guarda antes de los chequeos de respuesta automatica y modo humano:
      // el inbox debe ver todo lo que escribe el cliente, y la ventana de 24h
      // se calcula sobre este mensaje.
      // Archivos: se bajan de Meta y se guardan antes de registrar el mensaje; una
      // falla deja el mensaje con su tipo y sin archivo, nunca tumba el webhook.
      const stored =
        message.media && message.messageId
          ? await this.chatMediaService.ingest({
              mediaId: message.media.id,
              waMessageId: message.messageId,
              contactPhone: normalizePhone(message.from),
              phoneNumberId: account.phoneNumberId,
              accessToken: account.accessToken,
            })
          : null;

      await this.chatsService.recordMessage({
        contactPhone: message.from,
        direction: "inbound",
        sender: "customer",
        body: message.body,
        waMessageId: message.messageId,
        repairNoteId: note?.id ?? null,
        messageType: message.messageType,
        mediaKey: stored?.mediaKey ?? null,
        mediaMime: stored?.mediaMime ?? null,
        mediaSize: stored?.mediaSize ?? null,
        locationLat: message.location?.lat ?? null,
        locationLng: message.location?.lng ?? null,
      });

      if (message.contactName) {
        this.contactNameRepository
          .save({
            tenantId: account.tenantId,
            phone: normalizePhone(message.from),
            name: message.contactName,
          })
          .catch((err) => console.warn("Error guardando nombre de contacto:", err));
      }

      // Independiente de respuestas automaticas/modo humano: un aviso
      // pendiente (ver WhatsappNotificationQueueService) se manda apenas la
      // ventana se abre, sin esperar a que la IA o un agente responda. Se
      // busca por la nota (el ref ya la resolvio el tenant resolver), nunca
      // por numero_contacto: el cliente puede escribir desde otro telefono.
      if (note) {
        await this.whatsappNotificationQueueService.flushPending(
          note.id,
          message.from,
          account.phoneNumberId,
          account.accessToken,
        );
      }

      if (!(await this.getAiRepliesEnabled(account.tenantId))) {
        console.log("Mensaje sin respuesta automática: deshabilitadas en el tenant");
        return;
      }

      if (await humanModeService.isActive(message.from)) {
        console.log("Conversación en modo humano, sin respuesta automática");
        return;
      }

      // Cola aparte: n8n retiene cada llamada hasta 3 s sin mensajes nuevos
      // del contacto, y esperarla aqui serializaria los mensajes y anularia el buffer.
      if (message.body.trim()) {
        await this.whatsappAutomationQueueService.enqueue({
          tenantId: account.tenantId,
          accountId: account.id,
          from: message.from,
          body: message.body,
          repairNoteId: note?.id ?? null,
          sourceMessageId: message.messageId,
        });
      }

      // Sin ref valido no se responde: un ref inexistente no recibe nada que
      // confirme o niegue que existe.
      if (!note) return;

      const local = await this.localService.getConfig();
      const reply = buildNoteStatusReply(note.controlNumber, local.name, note.status);
      if (!reply) return;

      // Responde dentro de la misma llamada que recibio el mensaje: la ventana
      // de 24h siempre esta abierta.
      const waMessageId = message.messageId
        ? await this.whatsappSendService.sendFreeTextOnce(
            `status:${message.messageId}`,
            account.phoneNumberId,
            account.accessToken,
            message.from,
            reply,
            new Date(),
          )
        : await this.whatsappSendService.sendFreeText(
            account.phoneNumberId,
            account.accessToken,
            message.from,
            reply,
            new Date(),
          );
      await this.chatsService.recordMessage({
        contactPhone: message.from,
        direction: "outbound",
        sender: "ai",
        body: reply,
        waMessageId,
        repairNoteId: note.id,
      });
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

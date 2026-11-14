import { singleton } from "tsyringe";
import { WhatsappOutboundMessageDao } from "../daos/whatsapp-outbound-message.dao.js";
import { WhatsappTemplateStatusDao } from "../daos/whatsapp-template-status.dao.js";
import { WhatsappAccountService } from "./whatsapp-account.service.js";
import { WhatsappOutboundMessage } from "../entities/whatsapp-outbound-message.entity.js";
import { templateCatalog } from "../templates/catalog.js";
import { sendTemplateMessage } from "../clients/whatsapp-graph.client.js";

export interface RepairNoteReadyNotification {
  id: string;
  customerName: string;
  model: string;
  contactNumber?: string | null;
}

@singleton()
export class WhatsappSendService {
  constructor(
    private whatsappOutboundMessageDao: WhatsappOutboundMessageDao,
    private whatsappTemplateStatusDao: WhatsappTemplateStatusDao,
    private whatsappAccountService: WhatsappAccountService,
  ) {}

  // Idempotente por `idempotencyKey`: una causa que dispara el mismo envío
  // dos veces (ej. guardar la nota otra vez) encuentra la fila existente y
  // nunca vuelve a llamar a Meta. Si la plantilla no está APPROVED todavía,
  // la fila queda `blocked_not_approved` en vez de intentar el envío a medias.
  async sendTemplate(
    accountId: string,
    accessToken: string,
    phoneNumberId: string,
    catalogKey: string,
    to: string,
    variables: Record<string, string>,
    idempotencyKey: string,
  ): Promise<WhatsappOutboundMessage> {
    const existing = await this.whatsappOutboundMessageDao.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;

    const entry = templateCatalog.find((candidate) => candidate.key === catalogKey);
    if (!entry) throw new Error(`Plantilla desconocida en el catálogo: ${catalogKey}`);

    const templateStatus = await this.whatsappTemplateStatusDao.findByCatalogKey(catalogKey);
    if (templateStatus?.status !== "APPROVED") {
      return this.whatsappOutboundMessageDao.create({
        accountId,
        catalogKey,
        to,
        variables,
        idempotencyKey,
        status: "blocked_not_approved",
        metaMessageId: null,
        errorMessage: null,
      });
    }

    try {
      const result = await sendTemplateMessage(phoneNumberId, accessToken, to, entry, variables);
      return this.whatsappOutboundMessageDao.create({
        accountId,
        catalogKey,
        to,
        variables,
        idempotencyKey,
        status: "sent",
        metaMessageId: result.messages?.[0]?.id ?? null,
        errorMessage: null,
      });
    } catch (error: any) {
      return this.whatsappOutboundMessageDao.create({
        accountId,
        catalogKey,
        to,
        variables,
        idempotencyKey,
        status: "failed",
        metaMessageId: null,
        errorMessage: error.message ?? "Error desconocido al enviar",
      });
    }
  }

  // Sin número de contacto no hay a quién avisar -- no es un error, la nota
  // se guarda igual (ver RepairNoteService.update).
  async notifyOrderReady(note: RepairNoteReadyNotification): Promise<WhatsappOutboundMessage | null> {
    if (!note.contactNumber) return null;

    const account = await this.whatsappAccountService.getOrCreateForTenant();
    return this.sendTemplate(
      account.id,
      account.accessToken,
      account.phoneNumberId,
      "order_ready",
      note.contactNumber,
      { nombre: note.customerName, modelo: note.model },
      `order-ready:${note.id}`,
    );
  }
}

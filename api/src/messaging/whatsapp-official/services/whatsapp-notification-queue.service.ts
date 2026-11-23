import { singleton } from "tsyringe";
import { WhatsappPendingNotificationDao } from "../daos/whatsapp-pending-notification.dao.js";
import { WhatsappSendService } from "./whatsapp-send.service.js";
import { WhatsappAccountService } from "./whatsapp-account.service.js";
import { ChatsService } from "../../chats/services/chats.service.js";
import { normalizePhone } from "../../chats/helpers/chats.helpers.js";
import { buildPendingNotificationContent } from "../utils/pending-notification-content.js";
import type { RepairNote } from "../../../commerce/repair-notes/entities/repair-note.entity.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Nunca manda una plantilla HSM de pago para avisar un cambio de estado: o se
// manda ya como texto libre (ventana abierta en el instante del evento), o se
// encola y espera a que el cliente vuelva a escribir (ver flushPending), o
// vence a los 30 dias sin avisar nada. El negocio nunca inicia conversacion.
@singleton()
export class WhatsappNotificationQueueService {
  constructor(
    private pendingDao: WhatsappPendingNotificationDao,
    private whatsappSendService: WhatsappSendService,
    private whatsappAccountService: WhatsappAccountService,
    private chatsService: ChatsService,
  ) {}

  // Llamar despues de confirmar el nuevo estado en DB (nunca dentro de la
  // transaccion: esto hace I/O de red hacia Meta).
  async notifyStatusChange(note: RepairNote, previousStatus: string | undefined): Promise<void> {
    if (note.status === "delivered") {
      // Entrega es presencial (cobra el saldo ahi mismo): el cliente ya esta
      // frente al taller, cualquier aviso pendiente de esta nota ya no aplica.
      await this.pendingDao.deleteForNote(note.id);
      return;
    }
    if (previousStatus === note.status || !note.contactNumber) return;

    const content = buildPendingNotificationContent(note.status, note.controlNumber);
    if (!content) return;

    // Ventana por NOTA, no por numero_contacto: a quien le haya escrito de
    // ultimo sobre esta nota (el cliente puede escribir desde otro telefono,
    // el suyo puede estar siendo reparado -- el numero_contacto registrado
    // casi nunca va a tener ventana propia).
    const lastInbound = await this.chatsService.getLastInboundForNote(note.id);
    const windowOpen =
      !!lastInbound && Date.now() - lastInbound.createdAt.getTime() <= TWENTY_FOUR_HOURS_MS;

    if (!windowOpen) {
      await this.pendingDao.upsertForNote(
        note.id,
        normalizePhone(note.contactNumber),
        content.eventKey,
        content.messageText,
        new Date(Date.now() + THIRTY_DAYS_MS),
      );
      return;
    }

    // Ventana abierta ahora mismo (con quien escribio de ultimo sobre la
    // nota): se manda directo, no hace falta encolar. Se limpia cualquier
    // pendiente viejo de esta nota (ej. un evento previo que no alcanzo a
    // mandarse) para no duplicar el aviso en el proximo flush.
    await this.pendingDao.deleteForNote(note.id);
    const account = await this.whatsappAccountService.getOrCreateForTenant();
    const waMessageId = await this.whatsappSendService.sendFreeTextOnce(
      `pending-notify:${note.id}:${content.eventKey}`,
      account.phoneNumberId,
      account.accessToken,
      lastInbound.contactPhone,
      content.messageText,
      lastInbound.createdAt,
    );
    await this.chatsService.recordMessage({
      contactPhone: lastInbound.contactPhone,
      direction: "outbound",
      sender: "ai",
      body: content.messageText,
      waMessageId,
      repairNoteId: note.id,
    });
  }

  // Se llama en cada mensaje entrante CON ref valido (ver
  // WhatsappWebhookService.handleIncomingMessage), justo despues de renovar
  // la ventana -- busca por la nota, no por numero_contacto: el cliente
  // puede estar escribiendo desde otro telefono (el suyo esta en
  // reparacion). La ventana siempre esta abierta en este punto, por eso
  // nunca pasa por sendFreeText (que la rechazaria) sino directo por
  // sendFreeTextOnce. `to` es quien escribio ahora, no el numero_contacto
  // guardado en la nota.
  async flushPending(
    repairNoteId: string,
    to: string,
    phoneNumberId: string,
    accessToken: string,
  ): Promise<void> {
    const pending = await this.pendingDao.findByRepairNoteId(repairNoteId);
    if (!pending) return;

    if (Date.now() > pending.expiresAt.getTime()) {
      await this.pendingDao.delete(pending.id);
      return;
    }

    const waMessageId = await this.whatsappSendService.sendFreeTextOnce(
      `pending-notify:${pending.repairNoteId}:${pending.eventKey}`,
      phoneNumberId,
      accessToken,
      to,
      pending.messageText,
      new Date(),
    );
    await this.chatsService.recordMessage({
      contactPhone: to,
      direction: "outbound",
      sender: "ai",
      body: pending.messageText,
      waMessageId,
      repairNoteId: pending.repairNoteId,
    });
    await this.pendingDao.delete(pending.id);
  }
}

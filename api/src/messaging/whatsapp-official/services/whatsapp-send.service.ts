import { randomUUID } from "node:crypto";
import { singleton } from "tsyringe";
import { WhatsappOutboundMessageDao } from "../daos/whatsapp-outbound-message.dao.js";
import { WhatsappTemplateStatusDao } from "../daos/whatsapp-template-status.dao.js";
import { WhatsappTemplateCatalogEntryDao } from "../daos/whatsapp-template-catalog-entry.dao.js";
import { WhatsappAccountService } from "./whatsapp-account.service.js";
import { WhatsappQuotaService } from "./whatsapp-quota.service.js";
import { WhatsappOutboundMessage } from "../entities/whatsapp-outbound-message.entity.js";
import { sendTemplateMessage, sendTextMessage } from "../clients/whatsapp-graph.client.js";
import { redisClient } from "../../../core/config/redis-client.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SENT_MARKER_TTL_SECONDS = 24 * 60 * 60;

// El texto libre no tiene entrada en el catálogo de plantillas, pero la
// entidad exige `catalogKey` (no nullable, sin migración que lo cambie):
// se registra con este centinela para que la fila exista igual que la de
// una plantilla y `countSentSince` (status='sent') la cuente en la cuota.
// El cuerpo ya queda guardado en `chat_messages`, así que `variables` va vacío.
const FREE_TEXT_CATALOG_KEY = "free_text";

// Distinta de un error de Meta/red (esas quedan en el log de la nota o se
// devuelven como 500) -- el caller HTTP (ChatsController.sendMessage) la
// reconoce para responder 409 en vez de 500: no es una falla, es una regla
// de negocio de la ventana de 24h.
export class WhatsappWindowClosedError extends Error {
  constructor() {
    super("Fuera de la ventana de 24h: no se puede enviar texto libre a este contacto");
  }
}

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
    private whatsappTemplateCatalogEntryDao: WhatsappTemplateCatalogEntryDao,
    private whatsappAccountService: WhatsappAccountService,
    private whatsappQuotaService: WhatsappQuotaService,
  ) {}

  // Idempotente por `idempotencyKey`: una causa que dispara el mismo envío
  // dos veces (ej. guardar la nota otra vez) encuentra la fila existente y
  // nunca vuelve a llamar a Meta. Si la plantilla no está APPROVED todavía,
  // la fila queda `blocked_not_approved`; si el admin borró la entrada del
  // catálogo que un disparador automático (ej. order_ready) intenta usar,
  // queda `blocked_catalog_missing` -- nunca lanza, nunca tumba a quien
  // llamó (ver plan Fase 4, Checkpoint 7).
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

    const entry = await this.whatsappTemplateCatalogEntryDao.findByKeyForTenant(catalogKey);
    if (!entry) {
      return this.whatsappOutboundMessageDao.create({
        accountId,
        catalogKey,
        to,
        variables,
        idempotencyKey,
        status: "blocked_catalog_missing",
        metaMessageId: null,
        errorMessage: null,
      });
    }

    const templateStatus = await this.whatsappTemplateStatusDao.findByCatalogEntryId(entry.id);
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

    await this.whatsappQuotaService.assertCanSend();

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
    } catch (error) {
      return this.whatsappOutboundMessageDao.create({
        accountId,
        catalogKey,
        to,
        variables,
        idempotencyKey,
        status: "failed",
        metaMessageId: null,
        errorMessage: error instanceof Error ? error.message : "Error desconocido al enviar",
      });
    }
  }

  // Gate de ventana de 24h desde el ultimo mensaje entrante del contacto --
  // si ya se cerro, rechaza SIN llamar a Meta (que respondería el mismo
  // error, pero explicito en nuestro log en vez de depender de su respuesta).
  // Solo una plantilla aprobada (sendTemplate) podria reabrir contacto; eso
  // no esta en alcance de este checkpoint para el flujo de chat.
  //
  // Igual que sendTemplate, cada intento deja su fila en
  // `whatsapp_outbound_messages`: `sent` si Meta aceptó el envío (así
  // `countSentSince` lo descuenta de la cuota) y `failed` si falló -- el
  // error original se sigue propagando al caller, como antes.
  async sendFreeText(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    body: string,
    lastInboundAt: Date | null,
  ): Promise<string | null> {
    if (!lastInboundAt || Date.now() - lastInboundAt.getTime() > TWENTY_FOUR_HOURS_MS) {
      throw new WhatsappWindowClosedError();
    }
    await this.whatsappQuotaService.assertCanSend();
    // La cuenta ya existe en todos los callers (chats, webhook, automation,
    // notification-queue la resolvieron antes); esto solo la lee, no crea
    // una nueva salvo que el taller aún no tenga ninguna.
    const account = await this.whatsappAccountService.getOrCreateForTenant();
    try {
      const result = await sendTextMessage(phoneNumberId, accessToken, to, body);
      await this.whatsappOutboundMessageDao.create({
        accountId: account.id,
        catalogKey: FREE_TEXT_CATALOG_KEY,
        to,
        variables: {},
        idempotencyKey: `free-text:${randomUUID()}`,
        status: "sent",
        metaMessageId: result.messages?.[0]?.id ?? null,
        errorMessage: null,
      });
      return result.messages?.[0]?.id ?? null;
    } catch (error) {
      try {
        await this.whatsappOutboundMessageDao.create({
          accountId: account.id,
          catalogKey: FREE_TEXT_CATALOG_KEY,
          to,
          variables: {},
          idempotencyKey: `free-text:${randomUUID()}`,
          status: "failed",
          metaMessageId: null,
          errorMessage: error instanceof Error ? error.message : "Error desconocido al enviar",
        });
      } catch (recordError) {
        console.error("No se pudo registrar el envío fallido de texto libre:", recordError);
      }
      throw error;
    }
  }

  // Para respuestas dentro de un job que se reintenta: la marca se guarda
  // DESPUES de que Meta acepto el envio y se revisa ANTES, asi un reintento
  // por una falla posterior (ej. al registrar el mensaje) no reenvia y recupera
  // el wamid de salida. Solo queda abierto el lapso entre el envio y el SET.
  async sendFreeTextOnce(
    idempotencyKey: string,
    phoneNumberId: string,
    accessToken: string,
    to: string,
    body: string,
    lastInboundAt: Date | null,
  ): Promise<string | null> {
    const markerKey = `wa_sent:${getCurrentTenantId()}:${idempotencyKey}`;
    const sent = await redisClient.get(markerKey);
    // "" = enviado, pero Meta no devolvio wamid.
    if (sent !== null) return sent || null;

    const waMessageId = await this.sendFreeText(
      phoneNumberId,
      accessToken,
      to,
      body,
      lastInboundAt,
    );
    await redisClient.set(markerKey, waMessageId ?? "", "EX", SENT_MARKER_TTL_SECONDS);
    return waMessageId;
  }

  // Sin número de contacto no hay a quién avisar -- no es un error, la nota
  // se guarda igual (ver RepairNoteService.update).
  async notifyOrderReady(
    note: RepairNoteReadyNotification,
  ): Promise<WhatsappOutboundMessage | null> {
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

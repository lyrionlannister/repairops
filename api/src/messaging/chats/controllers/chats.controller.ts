import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { CHATS_ERROR_MESSAGES } from "../constants/chats.constants.js";
import { ChatsService } from "../services/chats.service.js";
import { ChatMediaService } from "../services/chat-media.service.js";
import { humanModeService } from "../../../app_platform/human-mode/human-mode.service.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { ContactName } from "../entities/contact-name.entity.js";
import { normalizePhone } from "../helpers/chats.helpers.js";
import { WhatsappAccountService } from "../../whatsapp-official/services/whatsapp-account.service.js";
import { WhatsappSendService, WhatsappWindowClosedError } from "../../whatsapp-official/services/whatsapp-send.service.js";

@singleton()
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private chatMediaService: ChatMediaService,
    private whatsappAccountService: WhatsappAccountService,
    private whatsappSendService: WhatsappSendService,
  ) {}

  async listConversations(_req: Request, res: Response): Promise<void> {
    try {
      const conversations = await this.chatsService.getConversations();
      res.status(200).json(conversations);
    } catch (error) {
      console.error("Error listando conversaciones", error);
      res.status(500).json({ error: CHATS_ERROR_MESSAGES.CONVERSATIONS_LIST });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = Array.isArray(req.params.sessionId)
        ? req.params.sessionId[0]
        : req.params.sessionId;
      if (!sessionId) {
        res.status(400).json({ error: CHATS_ERROR_MESSAGES.SESSION_ID_REQUIRED });
        return;
      }
      const messages = await this.chatsService.getMessages(sessionId);
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error obteniendo mensajes", error);
      res.status(500).json({ error: CHATS_ERROR_MESSAGES.MESSAGES_LIST });
    }
  }

  // Entrega el archivo por el API (nunca una URL del bucket). La busqueda del
  // mensaje es del tenant del contexto, asi que un id de otro tenant da 404.
  async getMedia(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId ?? "");
      const mediaId = String(req.params.mediaId ?? "");
      const message = await this.chatsService.findMediaMessage(sessionId, mediaId);
      const stored = message?.mediaKey ? await this.chatMediaService.read(message.mediaKey) : null;
      if (!message || !stored) {
        res.status(404).json({ error: "Archivo no encontrado" });
        return;
      }
      res.setHeader("Content-Type", message.mediaMime ?? stored.contentType);
      res.setHeader("Content-Disposition", "attachment");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.status(200).send(stored.body);
    } catch (error) {
      console.error("Error entregando archivo de chat", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "No se pudo obtener el archivo" });
    }
  }

  async getConversationCountsByDay(_req: Request, res: Response): Promise<void> {
    try {
      const counts = await this.chatsService.getConversationCountsByDay();
      res.status(200).json(counts);
    } catch (error) {
      console.error("Error obteniendo conteo diario", error);
      res.status(500).json({ error: CHATS_ERROR_MESSAGES.DAILY_COUNT });
    }
  }

  async getConversationCountsByMonth(req: Request, res: Response): Promise<void> {
    try {
      const year = Number(req.query.year ?? new Date().getFullYear());
      const counts = await this.chatsService.getConversationCountsByMonth(year);
      res.status(200).json(counts);
    } catch (error) {
      console.error("Error obteniendo conteo mensual", error);
      res.status(500).json({ error: CHATS_ERROR_MESSAGES.MONTHLY_COUNT });
    }
  }

  async getWeekSessionCount(_req: Request, res: Response): Promise<void> {
    try {
      const count = await this.chatsService.getWeekSessionCount();
      res.status(200).json({ count });
    } catch (error) {
      console.error("Error obteniendo conteo semanal", error);
      res.status(500).json({ error: CHATS_ERROR_MESSAGES.WEEKLY_COUNT });
    }
  }

  async getLastInteractionAt(_req: Request, res: Response): Promise<void> {
    try {
      const lastAt = await this.chatsService.getLastInteractionAt();
      res.status(200).json({ lastAt });
    } catch (error) {
      console.error("Error obteniendo última interacción", error);
      res.status(500).json({ error: CHATS_ERROR_MESSAGES.LAST_INTERACTION });
    }
  }

  async getTransferStatus(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      const isHumanMode = await humanModeService.isActive(sessionId);
      res.status(200).json({ isHumanMode });
    } catch (error) {
      console.error("Error obteniendo estado de transferencia:", error);
      res.status(500).json({ error: "Error al obtener estado de transferencia" });
    }
  }

  async activateTransfer(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      const contactName = await AppDataSource.getRepository(ContactName)
        .findOneBy({ tenantId: getCurrentTenantId(), phone: normalizePhone(sessionId) })
        .then((cn) => cn?.name);
      await humanModeService.activate(sessionId, contactName);
      res.status(200).json({ isHumanMode: true });
    } catch (error) {
      console.error("Error activando transferencia:", error);
      res.status(500).json({ error: "Error al activar transferencia" });
    }
  }

  async deactivateTransfer(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      await humanModeService.deactivate(sessionId);
      res.status(200).json({ isHumanMode: false });
    } catch (error) {
      console.error("Error desactivando transferencia:", error);
      res.status(500).json({ error: "Error al desactivar transferencia" });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      const body = req.body?.body as string | undefined;

      if (!body?.trim()) {
        res.status(400).json({ error: "El campo 'body' es requerido" });
        return;
      }

      const isHumanMode = await humanModeService.isActive(sessionId);
      if (!isHumanMode) {
        res.status(400).json({ error: "La conversación no está en modo humano" });
        return;
      }

      const [account, lastInboundAt] = await Promise.all([
        this.whatsappAccountService.getOrCreateForTenant(),
        this.chatsService.getLastInboundAt(sessionId),
      ]);
      const waMessageId = await this.whatsappSendService.sendFreeText(
        account.phoneNumberId,
        account.accessToken,
        sessionId,
        body,
        lastInboundAt,
      );
      await this.chatsService.recordMessage({
        contactPhone: sessionId,
        direction: "outbound",
        sender: "agent",
        body,
        waMessageId,
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      if (error instanceof WhatsappWindowClosedError) {
        res.status(409).json({ error: error.message });
        return;
      }
      console.error("Error enviando mensaje manual:", error);
      const message = error instanceof Error ? error.message : "Error al enviar mensaje";
      res.status(500).json({ error: message });
    }
  }
}

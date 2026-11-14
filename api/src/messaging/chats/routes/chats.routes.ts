import { Router } from "express";
import { ChatsController } from "../controllers/chats.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// n8n_chat_histories sigue sin columna tenant_id (una sola sesion de
// WhatsApp compartida, ver plan Fase 4) -- tenantMiddleware NO cambia eso,
// las lecturas/escrituras de historial siguen globales. Lo que si necesita
// tenant en contexto es el envio manual (sendMessage, Checkpoint 4): resuelve
// WhatsappAccount de ESTE tenant via TenantScopedDao, igual que cualquier
// otra ruta protegida.
export function createChatsRouter(chatsController: ChatsController): Router {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);

  router.get("/", (req, res) => chatsController.listConversations(req, res));
  router.get("/stats/daily", (req, res) => chatsController.getConversationCountsByDay(req, res));
  router.get("/stats/monthly", (req, res) => chatsController.getConversationCountsByMonth(req, res));
  router.get("/stats/weekly", (req, res) => chatsController.getWeekSessionCount(req, res));
  router.get("/stats/last-interaction", (req, res) => chatsController.getLastInteractionAt(req, res));
  router.get("/:sessionId/transfer", (req, res) => chatsController.getTransferStatus(req, res));
  router.post("/:sessionId/transfer", (req, res) => chatsController.activateTransfer(req, res));
  router.delete("/:sessionId/transfer", (req, res) => chatsController.deactivateTransfer(req, res));
  router.post("/:sessionId/messages", (req, res) => chatsController.sendMessage(req, res));
  router.get("/:sessionId", (req, res) => chatsController.getMessages(req, res));

  return router;
}

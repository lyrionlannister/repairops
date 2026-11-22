import { Router } from "express";
import { ChatsController } from "../controllers/chats.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Todo el historial de chat (chat_messages) y sus estadisticas son por
// tenant: tenantMiddleware pone el tenant en contexto para los DAO.
export function createChatsRouter(chatsController: ChatsController): Router {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);

  router.get("/", requirePermission("chats.read", "chats.read.own"), (req, res) => chatsController.listConversations(req, res));
  router.get("/stats/daily", requirePermission("chats.read", "dashboard.read"), (req, res) => chatsController.getConversationCountsByDay(req, res));
  router.get("/stats/monthly", requirePermission("chats.read", "dashboard.read"), (req, res) => chatsController.getConversationCountsByMonth(req, res));
  router.get("/stats/weekly", requirePermission("chats.read", "dashboard.read"), (req, res) => chatsController.getWeekSessionCount(req, res));
  router.get("/stats/last-interaction", requirePermission("chats.read", "dashboard.read"), (req, res) => chatsController.getLastInteractionAt(req, res));
  router.get("/:sessionId/transfer", requirePermission("chats.read", "chats.read.own"), (req, res) => chatsController.getTransferStatus(req, res));
  router.post("/:sessionId/transfer", requirePermission("chats.reply", "chats.reply.own"), (req, res) => chatsController.activateTransfer(req, res));
  router.delete("/:sessionId/transfer", requirePermission("chats.reply", "chats.reply.own"), (req, res) => chatsController.deactivateTransfer(req, res));
  router.post("/:sessionId/messages", requirePermission("chats.reply", "chats.reply.own"), (req, res) => chatsController.sendMessage(req, res));
  router.get("/:sessionId/media/:mediaId", requirePermission("chats.read", "chats.read.own"), (req, res) => chatsController.getMedia(req, res));
  router.get("/:sessionId", requirePermission("chats.read", "chats.read.own"), (req, res) => chatsController.getMessages(req, res));

  return router;
}

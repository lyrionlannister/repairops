import type { Server as HttpServer, IncomingMessage } from "node:http";
import { singleton } from "tsyringe";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { requireJwtSecret } from "../../../identity/auth/jwt-secret.js";
import { ACCESS_TOKEN_COOKIE } from "../../../identity/auth/constants/auth.constants.js";
import { loadAccess } from "../../../core/tenancy/tenant.middleware.js";
import { effectivePermissions } from "../../../identity/authz/permissions.js";
import type { Permission } from "../../../identity/authz/permissions.js";
import type { UserRole } from "../../../identity/auth/entities/user.entity.js";
import { runWithTenant } from "../../../core/tenancy/tenant-context.js";
import { ChatMessageDao } from "../daos/chat-message.dao.js";
import { canAccessConversation } from "../helpers/chats.helpers.js";
import type { MessageDto } from "../types/chats.types.js";

const { verify } = jwt;
const WS_PATH = "/ws/chats";

interface Connection {
  ws: WebSocket;
  tenantId: string;
  userId: string;
  roles: readonly UserRole[];
  permissions: ReadonlySet<Permission>;
}

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.split("; ").find((pair) => pair.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

// Empuja los mensajes de chat ya grabados (ver ChatsService.recordMessage) a
// quien tenga la conversacion abierta, para que el inbox se comporte como un
// chat real sin que el cliente tenga que hacer polling. Nunca es la fuente de
// verdad: si el socket se cae, el historial sigue disponible por GET /chats.
@singleton()
export class ChatRealtimeService {
  private readonly byTenant = new Map<string, Set<Connection>>();

  constructor(private chatMessageDao: ChatMessageDao) {}

  // allowedOrigins cubre el caso de dev separado (ej. Vite en :4300 pegandole
  // directo a la API en :3000, origin y Host distintos). En todo despliegue
  // real (api.conf, app.conf, dev-tunnel.conf) nginx sirve app + api bajo el
  // MISMO host (proxy_pass por path, no por origen) -- ahí el Origin del
  // handshake siempre coincide con el Host que nginx reenvía, y esa
  // comparación acepta cualquier dominio que lo sirva sin tener que mantener
  // la lista sincronizada con cada dominio nuevo (dev.kaltrafix.mx, etc).
  attach(server: HttpServer, allowedOrigins: readonly string[]): void {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (req, socket, head) => {
      if (req.url !== WS_PATH) return;
      const origin = req.headers.origin;
      if (!origin || !this.isAllowedOrigin(origin, req.headers.host, allowedOrigins)) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    });

    wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req).catch((error) => {
        console.error("Error autenticando socket de chats:", error);
        ws.close(1011, "Error interno");
      });
    });
  }

  private isAllowedOrigin(
    origin: string,
    host: string | undefined,
    allowedOrigins: readonly string[],
  ): boolean {
    if (allowedOrigins.includes(origin)) return true;
    try {
      return !!host && new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    const actor = await this.authenticate(req);
    if (!actor) {
      ws.close(4401, "No autenticado");
      return;
    }
    const connection: Connection = { ws, ...actor };
    this.add(connection);
    ws.on("close", () => this.remove(connection));
    ws.on("error", () => this.remove(connection));
  }

  private async authenticate(req: IncomingMessage): Promise<Omit<Connection, "ws"> | null> {
    const token =
      req.headers.authorization?.split(" ")[1] ??
      readCookie(req.headers.cookie, ACCESS_TOKEN_COOKIE);
    if (!token) return null;

    try {
      const decoded = verify(token, requireJwtSecret()) as { id: string; tenantId: string };
      const access = await loadAccess(decoded.tenantId, decoded.id);
      if (!access) return null;
      return {
        tenantId: access.tenantId,
        userId: access.id,
        roles: access.roles,
        permissions: effectivePermissions(access.roles, access.isPlatformAdmin),
      };
    } catch {
      return null;
    }
  }

  private add(connection: Connection): void {
    const set = this.byTenant.get(connection.tenantId) ?? new Set<Connection>();
    set.add(connection);
    this.byTenant.set(connection.tenantId, set);
  }

  private remove(connection: Connection): void {
    const set = this.byTenant.get(connection.tenantId);
    set?.delete(connection);
    if (set && set.size === 0) this.byTenant.delete(connection.tenantId);
  }

  // Llamar siempre dentro del runWithTenant de quien escribió el mensaje
  // (ChatsService.recordMessage ya corre ahí). Cada socket del tenant se
  // filtra con la misma regla que GET /chats/:sessionId (chats.read /
  // chats.read.own), así un técnico con alcance propio no recibe push de
  // conversaciones que no son suyas.
  broadcastMessage(tenantId: string, sessionId: string, message: MessageDto): void {
    const connections = this.byTenant.get(tenantId);
    if (!connections || connections.size === 0) return;

    for (const connection of connections) {
      this.sendIfAuthorized(connection, sessionId, message).catch((error) => {
        console.error("Error enviando mensaje de chat por socket:", error);
      });
    }
  }

  private async sendIfAuthorized(
    connection: Connection,
    sessionId: string,
    message: MessageDto,
  ): Promise<void> {
    if (connection.ws.readyState !== WebSocket.OPEN) return;
    const allowed = await runWithTenant(
      connection.tenantId,
      () => canAccessConversation(this.chatMessageDao, sessionId, "read"),
      null,
      { userId: connection.userId, roles: connection.roles, permissions: connection.permissions },
    );
    if (!allowed) return;
    connection.ws.send(JSON.stringify({ type: "chat:message", sessionId, message }));
  }
}

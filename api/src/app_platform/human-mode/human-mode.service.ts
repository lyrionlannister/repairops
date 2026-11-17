import { redisClient } from "../../core/config/redis-client.js";
import AppDataSource from "../../core/config/data-source.js";
import { getCurrentTenantId } from "../../core/tenancy/tenant-context.js";
import { Notification } from "../../messaging/notifications/entities/notification.entity.js";

const HUMAN_MODE_TTL_SECONDS = 86400; // 24 horas

// Siempre dentro de un tenant en contexto: el mismo telefono en dos talleres
// son dos conversaciones distintas, la clave lleva el tenant.
class HumanModeService {
  private key(phone: string): string {
    return `human_mode:${getCurrentTenantId()}:${phone}`;
  }

  async isActive(phone: string): Promise<boolean> {
    const val = await redisClient.get(this.key(phone));
    return val === "true";
  }

  async activate(phone: string, contactName?: string): Promise<void> {
    await redisClient.set(this.key(phone), "true", "EX", HUMAN_MODE_TTL_SECONDS);
    await AppDataSource.getRepository(Notification).save({
      tenantId: getCurrentTenantId(),
      type: "conversation_transferred" as const,
      sessionId: phone,
      phone,
      contactName: contactName ?? undefined,
      read: false,
    });
  }

  async deactivate(phone: string): Promise<void> {
    await redisClient.del(this.key(phone));
  }
}

export const humanModeService = new HumanModeService();

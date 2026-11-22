import { singleton } from "tsyringe";
import { redisClient } from "../../../core/config/redis-client.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";

// Un usuario cuenta como conectado si hizo alguna petición autenticada en esta ventana;
// el cliente refresca datos con frecuencia, así que una pestaña abierta no cae fuera.
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
// Limita las escrituras a Redis a una por usuario cada 30 s por instancia del API.
const TOUCH_THROTTLE_MS = 30 * 1000;
const KEY_TTL_SECONDS = 60 * 60;

@singleton()
export class PresenceService {
  private lastTouch = new Map<string, number>();

  private key(): string {
    return `presence:${getCurrentTenantId()}`;
  }

  async touch(userId: string): Promise<void> {
    const key = this.key();
    const now = Date.now();
    const throttleKey = `${key}:${userId}`;
    if (now - (this.lastTouch.get(throttleKey) ?? 0) < TOUCH_THROTTLE_MS) return;
    this.lastTouch.set(throttleKey, now);
    await redisClient
      .multi()
      .zadd(key, now, userId)
      .zremrangebyscore(key, "-inf", now - ONLINE_WINDOW_MS)
      .expire(key, KEY_TTL_SECONDS)
      .exec();
  }

  async countOnline(): Promise<number> {
    try {
      return await redisClient.zcount(this.key(), Date.now() - ONLINE_WINDOW_MS, "+inf");
    } catch {
      return 0;
    }
  }
}

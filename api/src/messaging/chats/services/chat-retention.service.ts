import { singleton } from "tsyringe";
import { redisClient } from "../../../core/config/redis-client.js";
import { ChatMessageDao } from "../daos/chat-message.dao.js";
import { ChatStatsDao } from "../daos/chat-stats.dao.js";

const MESSAGE_RETENTION_MS = 24 * 60 * 60 * 1000;
const STATS_RETENTION_DAYS = 13 * 31;
const RUN_EVERY_MS = 60 * 60 * 1000;
// Un poco menos que el intervalo: si dos instancias del API arrancan juntas,
// solo una purga por ciclo.
const LOCK_TTL_SECONDS = 50 * 60;
const LOCK_KEY = "chat_retention_lock";

// chat_messages solo conserva las ultimas 24h (la ventana de WhatsApp); los
// contadores de chat_daily_* guardan ~13 meses para las graficas del
// dashboard.
@singleton()
export class ChatRetentionService {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private chatMessageDao: ChatMessageDao,
    private chatStatsDao: ChatStatsDao,
  ) {}

  async purge(now: Date = new Date()): Promise<{ messages: number }> {
    const messages = await this.chatMessageDao.purgeBefore(new Date(now.getTime() - MESSAGE_RETENTION_MS));
    const statsCutoff = new Date(now.getTime() - STATS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await this.chatStatsDao.purgeBefore(statsCutoff.toISOString().slice(0, 10));
    return { messages };
  }

  start(): void {
    if (this.timer) return;
    const run = async (): Promise<void> => {
      try {
        const acquired = await redisClient.set(LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
        if (acquired !== "OK") return;
        const { messages } = await this.purge();
        if (messages > 0) console.log(`Retención de chat: ${messages} mensajes borrados`);
      } catch (error) {
        console.error("Error en la retención de chat:", error);
      }
    };
    void run();
    this.timer = setInterval(() => void run(), RUN_EVERY_MS);
    this.timer.unref();
  }
}

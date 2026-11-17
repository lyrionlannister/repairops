import { describe, expect, it, vi } from "vitest";
import { ChatRetentionService } from "../../../../src/messaging/chats/services/chat-retention.service.js";
import type { ChatMessageDao } from "../../../../src/messaging/chats/daos/chat-message.dao.js";
import type { ChatStatsDao } from "../../../../src/messaging/chats/daos/chat-stats.dao.js";

vi.mock("../../../../src/core/config/redis-client.js", () => ({ redisClient: { set: vi.fn() } }));

describe("ChatRetentionService.purge", () => {
  const now = new Date("2026-11-17T12:00:00.000Z");

  function makeService(deleted = 3) {
    const chatMessageDao = { purgeBefore: vi.fn().mockResolvedValue(deleted) } as unknown as ChatMessageDao;
    const chatStatsDao = { purgeBefore: vi.fn().mockResolvedValue(undefined) } as unknown as ChatStatsDao;
    return { service: new ChatRetentionService(chatMessageDao, chatStatsDao), chatMessageDao, chatStatsDao };
  }

  it("deletes messages older than 24 hours", async () => {
    const { service, chatMessageDao } = makeService();

    const result = await service.purge(now);

    expect(chatMessageDao.purgeBefore).toHaveBeenCalledWith(new Date("2026-11-16T12:00:00.000Z"));
    expect(result.messages).toBe(3);
  });

  it("keeps the daily counters for about 13 months", async () => {
    const { service, chatStatsDao } = makeService();

    await service.purge(now);

    // 13 * 31 = 403 dias antes del 2026-11-17.
    expect(chatStatsDao.purgeBefore).toHaveBeenCalledWith("2025-10-10");
  });
});

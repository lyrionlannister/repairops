import { describe, expect, it, vi } from "vitest";
import { NotificationService } from "../../../../src/messaging/notifications/services/notification.service.js";
import type { NotificationDao } from "../../../../src/messaging/notifications/daos/notification.dao.js";
import type { Notification } from "../../../../src/messaging/notifications/entities/notification.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeDao() {
  return {
    findAllOrdered: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    markAllRead: vi.fn(),
  } as unknown as NotificationDao;
}

describe("NotificationService.create", () => {
  it("always creates a notification as unread, regardless of input", async () => {
    const dao = makeDao();
    vi.mocked(dao.create).mockImplementation((data) =>
      Promise.resolve(mockEntity<Notification>({ id: "1", ...data })),
    );

    const service = new NotificationService(dao);
    await service.create({
      type: "conversation_transferred",
      sessionId: "5215512345678",
      phone: "5215512345678",
    });

    expect(dao.create).toHaveBeenCalledWith(
      expect.objectContaining({ read: false }),
    );
  });
});

describe("NotificationService.markRead", () => {
  it("sets read to true for the given id", async () => {
    const dao = makeDao();
    vi.mocked(dao.update).mockResolvedValue(mockEntity<Notification>({ id: "5", read: true }));

    const service = new NotificationService(dao);
    await service.markRead(5);

    expect(dao.update).toHaveBeenCalledWith(5, { read: true });
  });
});

describe("NotificationService.getAll", () => {
  it("passes the unreadOnly flag through to the dao", async () => {
    const dao = makeDao();
    const service = new NotificationService(dao);

    await service.getAll(true);
    expect(dao.findAllOrdered).toHaveBeenCalledWith(true);

    await service.getAll();
    expect(dao.findAllOrdered).toHaveBeenCalledWith(false);
  });
});

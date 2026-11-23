import { describe, expect, it, vi } from "vitest";
import { WhatsappNotificationQueueService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-notification-queue.service.js";
import type { WhatsappPendingNotificationDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-pending-notification.dao.js";
import type { WhatsappSendService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-send.service.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { ChatsService } from "../../../../src/messaging/chats/services/chats.service.js";
import type { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import type { WhatsappPendingNotification } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-pending-notification.entity.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeDeps() {
  const pendingDao = {
    deleteForNote: vi.fn().mockResolvedValue(false),
    upsertForNote: vi.fn(),
    findByRepairNoteId: vi.fn().mockResolvedValue(null),
    delete: vi.fn(),
  } as unknown as WhatsappPendingNotificationDao;
  const whatsappSendService = {
    sendFreeTextOnce: vi.fn().mockResolvedValue("wamid-1"),
  } as unknown as WhatsappSendService;
  const whatsappAccountService = {
    getOrCreateForTenant: vi
      .fn()
      .mockResolvedValue(
        mockEntity<WhatsappAccount>({ phoneNumberId: "phone-1", accessToken: "token-1" }),
      ),
  } as unknown as WhatsappAccountService;
  const chatsService = {
    getLastInboundForNote: vi.fn().mockResolvedValue(null),
    recordMessage: vi.fn(),
  } as unknown as ChatsService;
  return { pendingDao, whatsappSendService, whatsappAccountService, chatsService };
}

const note = (overrides: Partial<RepairNote>) =>
  mockEntity<RepairNote>({
    id: "note-1",
    customerName: "Ana",
    controlNumber: 7,
    contactNumber: "5215500000000",
    ...overrides,
  });

describe("WhatsappNotificationQueueService.notifyStatusChange", () => {
  it("clears any pending notification and sends nothing when the note is delivered", async () => {
    const deps = makeDeps();
    const service = new WhatsappNotificationQueueService(
      deps.pendingDao,
      deps.whatsappSendService,
      deps.whatsappAccountService,
      deps.chatsService,
    );

    await service.notifyStatusChange(note({ status: "delivered" }), "done");

    expect(deps.pendingDao.deleteForNote).toHaveBeenCalledWith("note-1");
    expect(deps.chatsService.getLastInboundForNote).not.toHaveBeenCalled();
    expect(deps.whatsappSendService.sendFreeTextOnce).not.toHaveBeenCalled();
  });

  it("does nothing when the status did not actually change", async () => {
    const deps = makeDeps();
    const service = new WhatsappNotificationQueueService(
      deps.pendingDao,
      deps.whatsappSendService,
      deps.whatsappAccountService,
      deps.chatsService,
    );

    await service.notifyStatusChange(note({ status: "in_repair" }), "in_repair");

    expect(deps.chatsService.getLastInboundForNote).not.toHaveBeenCalled();
    expect(deps.pendingDao.upsertForNote).not.toHaveBeenCalled();
  });

  it("does nothing when the note has no contact number", async () => {
    const deps = makeDeps();
    const service = new WhatsappNotificationQueueService(
      deps.pendingDao,
      deps.whatsappSendService,
      deps.whatsappAccountService,
      deps.chatsService,
    );

    await service.notifyStatusChange(
      note({ status: "done", contactNumber: undefined }),
      "in_repair",
    );

    expect(deps.chatsService.getLastInboundForNote).not.toHaveBeenCalled();
  });

  it("sends immediately, to whoever last wrote about this note, when that is within 24h", async () => {
    const deps = makeDeps();
    // Quien escribio sobre la nota no es el numero_contacto registrado (su
    // telefono esta en reparacion): la ventana se mide por la nota, no por
    // ese numero, y se responde a quien de verdad escribio.
    vi.mocked(deps.chatsService.getLastInboundForNote).mockResolvedValue({
      contactPhone: "5215599999999",
      createdAt: new Date(Date.now() - 60_000),
    });
    const service = new WhatsappNotificationQueueService(
      deps.pendingDao,
      deps.whatsappSendService,
      deps.whatsappAccountService,
      deps.chatsService,
    );

    await service.notifyStatusChange(note({ status: "done" }), "in_repair");

    expect(deps.chatsService.getLastInboundForNote).toHaveBeenCalledWith("note-1");
    expect(deps.whatsappAccountService.getOrCreateForTenant).toHaveBeenCalled();
    expect(deps.whatsappSendService.sendFreeTextOnce).toHaveBeenCalledWith(
      "pending-notify:note-1:repair_note.status_changed_to_terminada",
      "phone-1",
      "token-1",
      "5215599999999",
      expect.stringContaining("listo para recoger"),
      expect.any(Date),
    );
    expect(deps.chatsService.recordMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: "outbound",
        sender: "ai",
        repairNoteId: "note-1",
        contactPhone: "5215599999999",
      }),
    );
    expect(deps.pendingDao.upsertForNote).not.toHaveBeenCalled();
  });

  it("queues the notification instead of sending when nobody has written about this note within 24h", async () => {
    const deps = makeDeps();
    vi.mocked(deps.chatsService.getLastInboundForNote).mockResolvedValue({
      contactPhone: "5215599999999",
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    const service = new WhatsappNotificationQueueService(
      deps.pendingDao,
      deps.whatsappSendService,
      deps.whatsappAccountService,
      deps.chatsService,
    );

    await service.notifyStatusChange(note({ status: "cancelled" }), "received");

    expect(deps.pendingDao.upsertForNote).toHaveBeenCalledWith(
      "note-1",
      "5215500000000",
      "repair_note.status_changed_to_cancelada",
      expect.stringContaining("cancelada"),
      expect.any(Date),
    );
    expect(deps.whatsappSendService.sendFreeTextOnce).not.toHaveBeenCalled();
  });
});

describe("WhatsappNotificationQueueService.flushPending", () => {
  it("does nothing when the note has no pending notification", async () => {
    const deps = makeDeps();
    const service = new WhatsappNotificationQueueService(
      deps.pendingDao,
      deps.whatsappSendService,
      deps.whatsappAccountService,
      deps.chatsService,
    );

    await service.flushPending("note-1", "5215500000000", "phone-1", "token-1");

    expect(deps.whatsappSendService.sendFreeTextOnce).not.toHaveBeenCalled();
  });

  it("deletes an expired pending notification without sending it", async () => {
    const deps = makeDeps();
    vi.mocked(deps.pendingDao.findByRepairNoteId).mockResolvedValue(
      mockEntity<WhatsappPendingNotification>({
        id: "pending-1",
        repairNoteId: "note-1",
        eventKey: "repair_note.status_changed_to_terminada",
        messageText: "Listo",
        expiresAt: new Date(Date.now() - 1000),
      }),
    );
    const service = new WhatsappNotificationQueueService(
      deps.pendingDao,
      deps.whatsappSendService,
      deps.whatsappAccountService,
      deps.chatsService,
    );

    await service.flushPending("note-1", "5215500000000", "phone-1", "token-1");

    expect(deps.whatsappSendService.sendFreeTextOnce).not.toHaveBeenCalled();
    expect(deps.pendingDao.delete).toHaveBeenCalledWith("pending-1");
  });

  it("sends a still-valid pending notification to whoever wrote now, and then deletes it", async () => {
    const deps = makeDeps();
    vi.mocked(deps.pendingDao.findByRepairNoteId).mockResolvedValue(
      mockEntity<WhatsappPendingNotification>({
        id: "pending-2",
        repairNoteId: "note-1",
        eventKey: "repair_note.status_changed_to_terminada",
        messageText: "Listo",
        expiresAt: new Date(Date.now() + 1000),
      }),
    );
    const service = new WhatsappNotificationQueueService(
      deps.pendingDao,
      deps.whatsappSendService,
      deps.whatsappAccountService,
      deps.chatsService,
    );

    // Quien escribe ahora (otro telefono) no tiene por que ser el
    // numero_contacto registrado en la nota.
    await service.flushPending("note-1", "5215599999999", "phone-1", "token-1");

    expect(deps.whatsappSendService.sendFreeTextOnce).toHaveBeenCalledWith(
      "pending-notify:note-1:repair_note.status_changed_to_terminada",
      "phone-1",
      "token-1",
      "5215599999999",
      "Listo",
      expect.any(Date),
    );
    expect(deps.chatsService.recordMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Listo",
        direction: "outbound",
        sender: "ai",
        repairNoteId: "note-1",
        contactPhone: "5215599999999",
      }),
    );
    expect(deps.pendingDao.delete).toHaveBeenCalledWith("pending-2");
  });
});

import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { WhatsappPendingNotification } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-pending-notification.entity.js";
import { WhatsappPendingNotificationDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-pending-notification.dao.js";
import { generatePublicRef } from "../../../../src/commerce/repair-notes/utils/public-ref.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("WhatsappPendingNotificationDao tenant isolation", () => {
  let dao: WhatsappPendingNotificationDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;
  let noteA: RepairNote;
  let noteB: RepairNote;

  const futureExpiry = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new WhatsappPendingNotificationDao(
      AppDataSource.getRepository(WhatsappPendingNotification),
    );
    const notes = AppDataSource.getRepository(RepairNote);
    noteA = await notes.save({
      tenantId: tenantA,
      localId: "1",
      controlNumber: 1,
      publicRef: generatePublicRef(),
      customerName: "Cliente A",
      receivedAt: "2026-01-01",
      receivedTime: "10:00",
    });
    noteB = await notes.save({
      tenantId: tenantB,
      localId: "1",
      controlNumber: 1,
      publicRef: generatePublicRef(),
      customerName: "Cliente B",
      receivedAt: "2026-01-01",
      receivedTime: "10:00",
    });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("upsertForNote creates a single row, and a second call replaces it instead of duplicating", async () => {
    await runWithTenant(tenantA, () =>
      dao.upsertForNote(
        noteA.id,
        "5215500000001",
        "repair_note.status_changed_to_recibida",
        "Recibido",
        futureExpiry(),
      ),
    );
    const replaced = await runWithTenant(tenantA, () =>
      dao.upsertForNote(
        noteA.id,
        "5215500000001",
        "repair_note.status_changed_to_terminada",
        "Listo",
        futureExpiry(),
      ),
    );

    const found = await runWithTenant(tenantA, () => dao.findByRepairNoteId(noteA.id));
    expect(found?.id).toBe(replaced.id);
    expect(found?.eventKey).toBe("repair_note.status_changed_to_terminada");
    expect(found?.messageText).toBe("Listo");
  });

  it("findByRepairNoteId never returns another tenant's pending notification", async () => {
    await runWithTenant(tenantB, () =>
      dao.upsertForNote(
        noteB.id,
        "5215500000002",
        "repair_note.status_changed_to_recibida",
        "Recibido B",
        futureExpiry(),
      ),
    );

    const fromOwnTenant = await runWithTenant(tenantB, () => dao.findByRepairNoteId(noteB.id));
    const fromOtherTenant = await runWithTenant(tenantA, () => dao.findByRepairNoteId(noteB.id));

    expect(fromOwnTenant?.repairNoteId).toBe(noteB.id);
    expect(fromOtherTenant).toBeNull();
  });

  it("deleteForNote cannot remove a row that belongs to another tenant", async () => {
    await runWithTenant(tenantB, () =>
      dao.upsertForNote(
        noteB.id,
        "5215500000002",
        "repair_note.status_changed_to_cancelada",
        "Cancelada B",
        futureExpiry(),
      ),
    );

    const deletedByOther = await runWithTenant(tenantA, () => dao.deleteForNote(noteB.id));
    expect(deletedByOther).toBe(false);

    const stillThere = await runWithTenant(tenantB, () => dao.findByRepairNoteId(noteB.id));
    expect(stillThere?.repairNoteId).toBe(noteB.id);
  });
});

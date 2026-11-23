import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteDevice } from "../../../../src/commerce/repair-notes/entities/repair-note-device.entity.js";
import { RepairNoteDeviceDao } from "../../../../src/commerce/repair-notes/daos/repair-note-device.dao.js";
import { generatePublicRef } from "../../../../src/commerce/repair-notes/utils/public-ref.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("RepairNoteDeviceDao tenant isolation", () => {
  let dao: RepairNoteDeviceDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;
  let noteA: RepairNote;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new RepairNoteDeviceDao(AppDataSource.getRepository(RepairNoteDevice));
    noteA = await AppDataSource.getRepository(RepairNote).save({
      tenantId: tenantA,
      localId: "1",
      controlNumber: 1,
      publicRef: generatePublicRef(),
      customerName: "Cliente A",
      receivedAt: "2026-01-01",
      receivedTime: "10:00",
    });
    await AppDataSource.getRepository(RepairNoteDevice).save([
      { tenantId: tenantA, repairNoteId: noteA.id, position: 1, brand: "Apple", model: "iPhone 12", reportedFailure: "No carga" },
      { tenantId: tenantA, repairNoteId: noteA.id, position: 0, brand: "Samsung", model: "A52", reportedFailure: "Pantalla" },
    ]);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("findByRepairNoteIds returns the note's devices ordered by position for its own tenant", async () => {
    const devices = await runWithTenant(tenantA, () => dao.findByRepairNoteIds([noteA.id]));
    expect(devices.map((d) => d.model)).toEqual(["A52", "iPhone 12"]);
  });

  it("findByRepairNoteIds never returns another tenant's devices, even with the note id", async () => {
    const devices = await runWithTenant(tenantB, () => dao.findByRepairNoteIds([noteA.id]));
    expect(devices).toEqual([]);
  });

  it("findById returns null for a device that belongs to another tenant", async () => {
    const [device] = await runWithTenant(tenantA, () => dao.findByRepairNoteIds([noteA.id]));
    expect(await runWithTenant(tenantB, () => dao.findById(device.id))).toBeNull();
    expect((await runWithTenant(tenantA, () => dao.findById(device.id)))?.id).toBe(device.id);
  });
});

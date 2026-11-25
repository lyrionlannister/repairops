import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteDevice } from "../../../../src/commerce/repair-notes/entities/repair-note-device.entity.js";
import { RepairNoteDao } from "../../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import { generatePublicRef } from "../../../../src/commerce/repair-notes/utils/public-ref.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("RepairNoteDao.findPage", () => {
  let dao: RepairNoteDao;
  const base = Date.now();
  const tenantA = `${base}31`;
  const tenantB = `${base}32`;

  const note = (tenantId: string, controlNumber: number, customerName: string, status: string) => ({
    tenantId,
    localId: "1",
    controlNumber,
    status,
    publicRef: generatePublicRef(),
    customerName,
    receivedAt: "2026-01-01",
    receivedTime: "10:00",
  });

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new RepairNoteDao(AppDataSource.getRepository(RepairNote));
    const notes = await AppDataSource.getRepository(RepairNote).save([
      note(tenantA, 1, "Ana López", "received"),
      note(tenantA, 2, "Beto 100%", "delivered"),
      note(tenantA, 3, "Carla", "cancelled"),
      note(tenantA, 4, "Dora", "in_repair"),
      note(tenantB, 1, "Ana López", "received"),
    ]);
    await AppDataSource.getRepository(RepairNoteDevice).save({
      tenantId: tenantA,
      repairNoteId: notes[3].id,
      position: 0,
      brand: "Motorola",
      model: "G84",
      reportedFailure: "No enciende",
    });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const page = (
    tenantId: string,
    extra: { page?: number; pageSize?: number; status?: string; search?: string } = {},
  ) =>
    runWithTenant(tenantId, () =>
      dao.findPage(
        { branchId: null, status: extra.status, search: extra.search },
        { page: extra.page ?? 1, pageSize: extra.pageSize ?? 2 },
      ),
    );

  it("pages newest first and reports the full total", async () => {
    const result = await page(tenantA);
    expect(result.total).toBe(4);
    expect(result.items.map((n) => n.controlNumber)).toEqual([4, 3]);
    const second = await page(tenantA, { page: 2 });
    expect(second.items.map((n) => n.controlNumber)).toEqual([2, 1]);
  });

  it("filters open notes, by name, folio and device", async () => {
    expect(
      (await page(tenantA, { status: "open", pageSize: 10 })).items.map((n) => n.controlNumber),
    ).toEqual([4, 1]);
    expect((await page(tenantA, { search: "ana" })).items.map((n) => n.controlNumber)).toEqual([1]);
    expect(
      (await page(tenantA, { search: "motorola g8" })).items.map((n) => n.controlNumber),
    ).toEqual([4]);
    expect((await page(tenantA, { search: "100%" })).items.map((n) => n.controlNumber)).toEqual([
      2,
    ]);
    expect((await page(tenantA, { search: "%" })).total).toBe(1);
  });

  it("counts total and open notes per tenant", async () => {
    expect(await runWithTenant(tenantA, () => dao.countStats({ branchId: null }))).toEqual({
      total: 4,
      open: 2,
    });
    expect(await runWithTenant(tenantB, () => dao.countStats({ branchId: null }))).toEqual({
      total: 1,
      open: expect.any(Number),
    });
  });

  it("never returns another tenant's notes", async () => {
    const result = await page(tenantB, { pageSize: 10 });
    expect(result.total).toBe(1);
    expect(result.items.every((n) => String(n.tenantId) === tenantB)).toBe(true);
  });
});

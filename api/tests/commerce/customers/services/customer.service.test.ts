import { describe, expect, it, vi } from "vitest";
import { CustomerService } from "../../../../src/commerce/customers/services/customer.service.js";
import type { CustomerDao } from "../../../../src/commerce/customers/daos/customer.dao.js";
import type { RepairNoteDao } from "../../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import type { SalePaymentDao } from "../../../../src/commerce/payments/daos/sale-payment.dao.js";
import type { RepairNoteDeviceDao } from "../../../../src/commerce/repair-notes/daos/repair-note-device.dao.js";
import type { RepairNoteDevice } from "../../../../src/commerce/repair-notes/entities/repair-note-device.entity.js";
import type { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import type { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeDao() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as CustomerDao;
}

function makeRepairNoteDao() {
  return {
    findByCustomerId: vi.fn(),
  } as unknown as RepairNoteDao;
}

function makeRepairNoteDeviceDao(devices: Array<Partial<RepairNoteDevice>> = []) {
  return {
    findByRepairNoteIds: vi.fn().mockResolvedValue(devices.map((d) => mockEntity<RepairNoteDevice>(d))),
  } as unknown as RepairNoteDeviceDao;
}

function makeSalePaymentDao() {
  return {
    sumCreditoForCustomer: vi.fn(),
  } as unknown as SalePaymentDao;
}

describe("CustomerService", () => {
  it("create rejects a blank name", async () => {
    const dao = makeDao();
    const service = new CustomerService(dao, makeRepairNoteDao(), makeSalePaymentDao(), makeRepairNoteDeviceDao());

    await expect(service.create({ name: "  ", phone: "555" })).rejects.toThrow("nombre");
    expect(dao.create).not.toHaveBeenCalled();
  });

  it("create accepts a customer without phone", async () => {
    const dao = makeDao();
    vi.mocked(dao.create).mockResolvedValue(mockEntity<Customer>({ id: "c-1" }));
    const service = new CustomerService(dao, makeRepairNoteDao(), makeSalePaymentDao(), makeRepairNoteDeviceDao());

    await service.create({ name: "Juan", phone: "  " });
    expect(dao.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Juan", phone: null }));
  });

  it("create trims fields and treats email as optional", async () => {
    const dao = makeDao();
    vi.mocked(dao.create).mockResolvedValue(mockEntity<Customer>({ id: "c-1" }));
    const service = new CustomerService(dao, makeRepairNoteDao(), makeSalePaymentDao(), makeRepairNoteDeviceDao());

    await service.create({ name: " Juan Pérez ", phone: " 5551234567 " });

    expect(dao.create).toHaveBeenCalledWith({
      name: "Juan Pérez",
      phone: "5551234567",
      email: undefined,
    });
  });

  it("getDeviceHistory dedupes by brand+model, keeps the most recent date, and counts notes", async () => {
    const repairNoteDao = makeRepairNoteDao();
    vi.mocked(repairNoteDao.findByCustomerId).mockResolvedValue([
      mockEntity<RepairNote>({ id: "n1", receivedAt: "2026-01-10", controlNumber: 10 }),
      mockEntity<RepairNote>({ id: "n2", receivedAt: "2026-03-05", controlNumber: 22 }),
      mockEntity<RepairNote>({ id: "n3", receivedAt: "2026-02-01", controlNumber: 15 }),
    ]);
    const deviceDao = makeRepairNoteDeviceDao([
      { repairNoteId: "n1", brand: "Samsung", model: "A15" },
      { repairNoteId: "n2", brand: "samsung", model: "a15" },
      { repairNoteId: "n2", brand: "Samsung", model: "A15 " },
      { repairNoteId: "n3", brand: "Apple", model: "iPhone 12" },
    ]);
    const service = new CustomerService(makeDao(), repairNoteDao, makeSalePaymentDao(), deviceDao);

    const history = await service.getDeviceHistory("c-1");

    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({
      brand: "Samsung",
      model: "A15",
      lastReceivedAt: "2026-03-05",
      controlNumber: 22,
      notesCount: 2,
    });
    expect(history[1].brand).toBe("Apple");
  });

  it("getDeviceHistory returns an empty list when the customer has no notes", async () => {
    const repairNoteDao = makeRepairNoteDao();
    vi.mocked(repairNoteDao.findByCustomerId).mockResolvedValue([]);
    const service = new CustomerService(makeDao(), repairNoteDao, makeSalePaymentDao(), makeRepairNoteDeviceDao());

    expect(await service.getDeviceHistory("c-1")).toEqual([]);
  });
});

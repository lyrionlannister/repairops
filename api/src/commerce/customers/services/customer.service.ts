import { Decimal } from "decimal.js";
import { singleton } from "tsyringe";
import { CustomerDao } from "../daos/customer.dao.js";
import { Customer } from "../entities/customer.entity.js";
import { RepairNoteDao } from "../../repair-notes/daos/repair-note.dao.js";
import { RepairNoteDeviceDao } from "../../repair-notes/daos/repair-note-device.dao.js";
import { SalePaymentDao } from "../../payments/daos/sale-payment.dao.js";
import { toMoney } from "../../../core/common/utils/money.js";

export interface CustomerCreditBalance {
  creditLimit: number;
  balance: number;
  available: number;
}

type CreatePayload = Pick<Customer, "name" | "phone" | "email"> & { creditLimit?: Decimal.Value };
type UpdatePayload = Partial<CreatePayload>;

export interface CustomerDeviceHistoryEntry {
  brand: string;
  model: string;
  lastReceivedAt: string;
  controlNumber: number;
  notesCount: number;
}

@singleton()
export class CustomerService {
  constructor(
    private dao: CustomerDao,
    private repairNoteDao: RepairNoteDao,
    private salePaymentDao: SalePaymentDao,
    private repairNoteDeviceDao: RepairNoteDeviceDao,
  ) {}

  async getAll(): Promise<Customer[]> {
    return this.dao.findAll();
  }

  async getById(id: string): Promise<Customer | null> {
    return this.dao.findById(id);
  }

  async create(data: CreatePayload): Promise<Customer> {
    const name = data.name?.trim();
    const phone = data.phone?.trim() || null;
    if (!name) throw new Error("El nombre del cliente es obligatorio");

    return this.dao.create({
      name,
      phone,
      email: data.email?.trim() || undefined,
      ...(data.creditLimit !== undefined && { creditLimit: toMoney(data.creditLimit) }),
    });
  }

  async update(id: string, data: UpdatePayload): Promise<Customer | null> {
    const payload: Partial<Customer> = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new Error("El nombre del cliente es obligatorio");
      payload.name = name;
    }
    if (data.phone !== undefined) payload.phone = data.phone?.trim() || null;
    if (data.email !== undefined) payload.email = data.email?.trim() || undefined;
    if (data.creditLimit !== undefined) payload.creditLimit = toMoney(data.creditLimit);

    return this.dao.update(id, payload);
  }

  async delete(id: string): Promise<boolean> {
    return this.dao.delete(id);
  }

  // Saldo nunca cacheado (ver SalePaymentDao.sumCreditoForCustomer) -- se
  // recalcula en cada lectura, igual que "disponible para prometer".
  async getCreditBalance(customerId: string): Promise<CustomerCreditBalance | null> {
    const customer = await this.dao.findById(customerId);
    if (!customer) return null;
    const balance = await this.salePaymentDao.sumCreditoForCustomer(customerId);
    const creditLimit = new Decimal(customer.creditLimit);
    return {
      creditLimit: creditLimit.toNumber(),
      balance: new Decimal(balance).toNumber(),
      available: creditLimit.minus(balance).toNumber(),
    };
  }

  // El historial se deriva de los equipos de las notas ya ligadas al cliente
  // (marca+modelo), deduplicado y ordenado por la mas reciente; notesCount
  // cuenta notas, no equipos (dos equipos iguales en una nota suman uno).
  async getDeviceHistory(customerId: string): Promise<CustomerDeviceHistoryEntry[]> {
    const notes = await this.repairNoteDao.findByCustomerId(customerId);
    const devices = await this.repairNoteDeviceDao.findByRepairNoteIds(notes.map((n) => n.id));
    const noteById = new Map(notes.map((n) => [n.id, n]));
    const byDevice = new Map<string, CustomerDeviceHistoryEntry>();
    const counted = new Set<string>();

    for (const device of devices) {
      const note = noteById.get(device.repairNoteId);
      if (!note) continue;
      const key = `${device.brand.trim().toLowerCase()}|${device.model.trim().toLowerCase()}`;
      if (counted.has(`${key}|${note.id}`)) continue;
      counted.add(`${key}|${note.id}`);
      const existing = byDevice.get(key);
      if (existing) {
        existing.notesCount += 1;
        if (note.receivedAt > existing.lastReceivedAt) {
          existing.lastReceivedAt = note.receivedAt;
          existing.controlNumber = note.controlNumber;
        }
        continue;
      }
      byDevice.set(key, {
        brand: device.brand,
        model: device.model,
        lastReceivedAt: note.receivedAt,
        controlNumber: note.controlNumber,
        notesCount: 1,
      });
    }

    return Array.from(byDevice.values()).sort((a, b) => (a.lastReceivedAt < b.lastReceivedAt ? 1 : -1));
  }
}

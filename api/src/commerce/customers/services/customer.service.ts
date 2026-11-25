import { Decimal } from "decimal.js";
import { singleton } from "tsyringe";
import { CustomerDao } from "../daos/customer.dao.js";
import { Customer } from "../entities/customer.entity.js";
import { RepairNoteDao } from "../../repair-notes/daos/repair-note.dao.js";
import { RepairNoteDeviceDao } from "../../repair-notes/daos/repair-note-device.dao.js";
import { RepairNoteServiceTypeDao } from "../../repair-notes/daos/repair-note-service-type.dao.js";
import { SalePaymentDao } from "../../payments/daos/sale-payment.dao.js";
import { toMoney } from "../../../core/common/utils/money.js";
import { BusinessError } from "../../../core/http/business-error.js";

export interface CustomerCreditBalance {
  creditLimit: number;
  balance: number;
  available: number;
}

type CreatePayload = Pick<Customer, "name" | "phone" | "email"> & { creditLimit?: Decimal.Value };
type UpdatePayload = Partial<CreatePayload>;

export interface CustomerDeviceVisit {
  repairNoteId: string;
  controlNumber: number;
  receivedAt: string;
  status: string;
  reportedFailure: string;
  deviceOff: boolean;
  serviceTypeIds: string[];
  totalValue: string;
}

export interface CustomerDeviceHistoryEntry {
  brand: string;
  model: string;
  lastReceivedAt: string;
  controlNumber: number;
  notesCount: number;
  visits: CustomerDeviceVisit[];
}

@singleton()
export class CustomerService {
  constructor(
    private dao: CustomerDao,
    private repairNoteDao: RepairNoteDao,
    private salePaymentDao: SalePaymentDao,
    private repairNoteDeviceDao: RepairNoteDeviceDao,
    private repairNoteServiceTypeDao: RepairNoteServiceTypeDao,
  ) {}

  async getAll(): Promise<Customer[]> {
    return this.dao.findAll();
  }

  async lookup(search: string | undefined, limit: number): Promise<Customer[]> {
    return this.dao.lookup(search, limit);
  }

  async getById(id: string): Promise<Customer | null> {
    return this.dao.findById(id);
  }

  async create(data: CreatePayload): Promise<Customer> {
    const name = data.name?.trim();
    const phone = data.phone?.trim() || null;
    if (!name) throw new BusinessError("El nombre del cliente es obligatorio");

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
      if (!name) throw new BusinessError("El nombre del cliente es obligatorio");
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
  // cuenta notas, no equipos (dos equipos iguales en una nota suman uno, pero
  // cada uno conserva su visita con su falla y sus tipos de servicio).
  async getDeviceHistory(customerId: string): Promise<CustomerDeviceHistoryEntry[]> {
    const notes = await this.repairNoteDao.findByCustomerId(customerId);
    const noteIds = notes.map((n) => n.id);
    const [devices, links] = await Promise.all([
      this.repairNoteDeviceDao.findByRepairNoteIds(noteIds),
      this.repairNoteServiceTypeDao.findByRepairNoteIds(noteIds),
    ]);
    const noteById = new Map(notes.map((n) => [n.id, n]));
    const typesByDevice = new Map<string, string[]>();
    for (const link of links) {
      typesByDevice.set(link.repairNoteDeviceId, [
        ...(typesByDevice.get(link.repairNoteDeviceId) ?? []),
        link.serviceTypeId,
      ]);
    }
    const byDevice = new Map<string, CustomerDeviceHistoryEntry>();
    const counted = new Set<string>();

    for (const device of devices) {
      const note = noteById.get(device.repairNoteId);
      if (!note) continue;
      const key = `${device.brand.trim().toLowerCase()}|${device.model.trim().toLowerCase()}`;
      let entry = byDevice.get(key);
      if (!entry) {
        entry = {
          brand: device.brand,
          model: device.model,
          lastReceivedAt: note.receivedAt,
          controlNumber: note.controlNumber,
          notesCount: 0,
          visits: [],
        };
        byDevice.set(key, entry);
      }
      entry.visits.push({
        repairNoteId: note.id,
        controlNumber: note.controlNumber,
        receivedAt: note.receivedAt,
        status: note.status,
        reportedFailure: device.reportedFailure,
        deviceOff: device.deviceOff,
        serviceTypeIds: typesByDevice.get(device.id) ?? [],
        totalValue: toMoney(note.totalValue ?? 0),
      });
      if (counted.has(`${key}|${note.id}`)) continue;
      counted.add(`${key}|${note.id}`);
      entry.notesCount += 1;
      if (note.receivedAt > entry.lastReceivedAt) {
        entry.lastReceivedAt = note.receivedAt;
        entry.controlNumber = note.controlNumber;
      }
    }

    const entries = Array.from(byDevice.values());
    for (const entry of entries)
      entry.visits.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
    return entries.sort((a, b) => (a.lastReceivedAt < b.lastReceivedAt ? 1 : -1));
  }
}

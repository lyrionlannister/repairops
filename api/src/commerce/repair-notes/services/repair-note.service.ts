import { singleton } from "tsyringe";
import { currentUserId, lacks } from "../../../identity/authz/access.js";
import type { EntityManager } from "typeorm";
import { BusinessError } from "../../../core/http/business-error.js";
import { RepairNoteDao } from "../daos/repair-note.dao.js";
import { RepairNoteItemDao } from "../daos/repair-note-item.dao.js";
import { RepairNoteServiceTypeDao } from "../daos/repair-note-service-type.dao.js";
import { RepairNotePaymentDao } from "../daos/repair-note-payment.dao.js";
import { RepairNoteDeviceDao } from "../daos/repair-note-device.dao.js";
import { RepairNoteDevice } from "../entities/repair-note-device.entity.js";
import {
  normalizeDevices,
  toDeviceView,
  type RepairNoteDeviceInput,
  type RepairNoteDeviceView,
} from "../utils/devices.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { InventoryService } from "../../inventory/services/inventory.service.js";
import { InventoryItemDao } from "../../inventory/daos/inventory-item.dao.js";
import { PriceListDao } from "../../price-list/daos/price-list.dao.js";
import { InventoryReservationService } from "../../inventory/services/inventory-reservation.service.js";
import { ServiceTypeDao } from "../../service-types/daos/service-type.dao.js";
import { RepairNote } from "../entities/repair-note.entity.js";
import { RepairNoteItem } from "../entities/repair-note-item.entity.js";
import { RepairNoteServiceType } from "../entities/repair-note-service-type.entity.js";
import { Customer } from "../../customers/entities/customer.entity.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { WhatsappAccountService } from "../../../messaging/whatsapp-official/services/whatsapp-account.service.js";
import { WhatsappNotificationQueueService } from "../../../messaging/whatsapp-official/services/whatsapp-notification-queue.service.js";
import { buildNoteQrUrl } from "../../../messaging/whatsapp-official/utils/note-qr-url.js";
import { generatePublicRef } from "../utils/public-ref.js";
import { Decimal } from "decimal.js";
import { CashSession } from "../../cash/entities/cash-session.entity.js";
import { CashMovement } from "../../cash/entities/cash-movement.entity.js";
import {
  RepairNotePayment,
  type RepairNotePaymentMethod,
} from "../entities/repair-note-payment.entity.js";
import { sumCreditBalance } from "../../customers/utils/credit-balance.js";
import { resolveOrCreateCustomer } from "../../customers/utils/resolve-customer.js";
import { resolveCreditDueDate } from "../../customers/utils/credit-due-date.js";
import { toMoney } from "../../../core/common/utils/money.js";

// tenantId/controlNumber los agrega create() desde el contexto/consecutivo
// (nunca el caller); totalValue/status/requiresAdvance/hasWarranty/
// hasExtendedWarranty tienen default en la BD, por eso son opcionales aqui
// aunque la entidad los declare requeridos.
type DefaultedOnCreate =
  "totalValue" | "status" | "requiresAdvance" | "hasWarranty" | "hasExtendedWarranty";
type NoteCreateFields = Omit<
  RepairNote,
  | "id"
  | "publicId"
  | "tenantId"
  | "controlNumber"
  | "publicRef"
  | "receivedTime"
  | "createdAt"
  | "updatedAt"
  | DefaultedOnCreate
> &
  Partial<Pick<RepairNote, DefaultedOnCreate>>;
type NoteUpdateFields = Partial<
  Omit<
    RepairNote,
    "id" | "publicId" | "tenantId" | "controlNumber" | "publicRef" | "createdAt" | "updatedAt"
  >
>;
type CreatePayload = NoteCreateFields & { devices: RepairNoteDeviceInput[] };
type UpdatePayload = NoteUpdateFields & { devices?: RepairNoteDeviceInput[] };

export type RepairNoteWithDevices = RepairNote & { devices: RepairNoteDeviceView[] };

export interface RepairNoteItemInput {
  inventoryItemId: string;
  quantity: number;
  unitPrice: Decimal.Value;
}

// Cómo se cobró el anticipo al recibir el equipo (nunca a crédito: es dinero que entra a caja).
export interface AdvancePaymentInput {
  method: "efectivo" | "tarjeta" | "transferencia";
  createdByEmployeeId: string;
}

export interface DeliveryPaymentInput {
  method: RepairNotePaymentMethod;
  amount: Decimal.Value;
  dueDate?: string | null;
}

export interface DeliverInput {
  payments: DeliveryPaymentInput[];
  createdByEmployeeId?: string | null;
}

const PAYMENT_METHODS: RepairNotePaymentMethod[] = [
  "efectivo",
  "tarjeta",
  "transferencia",
  "credito",
];

// Una nota "comprometida" ya uso stock real -- antes de eso, solo reserva
// (Fase 5, Pieza 3 de Inventario vivo: reemplaza el descuento inmediato que
// este Service hacia hasta esa fase). "delivered" solo se alcanza pasando
// por "done" antes, pero se incluye explicito por si algun flujo futuro la
// alcanza de otra forma -- nunca asumir que done siempre precede.
function isCommitted(status: string): boolean {
  return status === "done" || status === "delivered";
}

@singleton()
export class RepairNoteService {
  constructor(
    private repairNoteDao: RepairNoteDao,
    private localService: LocalService,
    private repairNoteItemDao: RepairNoteItemDao,
    private inventoryService: InventoryService,
    private repairNoteServiceTypeDao: RepairNoteServiceTypeDao,
    private serviceTypeDao: ServiceTypeDao,
    private whatsappAccountService: WhatsappAccountService,
    private inventoryReservationService: InventoryReservationService,
    private repairNotePaymentDao: RepairNotePaymentDao,
    private repairNoteDeviceDao: RepairNoteDeviceDao,
    private whatsappNotificationQueueService: WhatsappNotificationQueueService,
    private itemDao: InventoryItemDao,
    private priceListDao: PriceListDao,
  ) {}

  // Precio de inventario: debe ser igual a precio_venta del item o al precio
  // de la lista de precios aplicable del tenant (proveedor + modelo). Si no
  // coincide con ninguno, el cliente está intentando fijar el precio.
  private async validateItemPrices(items: RepairNoteItemInput[]): Promise<void> {
    for (const item of items) {
      const inventoryItem = await this.itemDao.findById(item.inventoryItemId);
      if (!inventoryItem) throw new BusinessError("Item de inventario no encontrado");
      const price = new Decimal(item.unitPrice);
      if (price.equals(new Decimal(inventoryItem.salePrice))) continue;
      if (inventoryItem.supplierId) {
        const listItem = await this.priceListDao.findBySupplierAndModel(
          inventoryItem.supplierId,
          inventoryItem.name,
        );
        if (listItem && price.equals(new Decimal(listItem.price))) continue;
      }
      throw new BusinessError("El precio unitario no coincide con el precio de venta del item");
    }
  }

  async getAll(branchId?: string | null): Promise<RepairNoteWithDevices[]> {
    return this.withDevices(await this.repairNoteDao.findAllOrdered(branchId));
  }

  async getById(id: string): Promise<RepairNoteWithDevices | null> {
    return this.withDevicesOne(await this.repairNoteDao.findById(id));
  }

  async getByControlNumber(controlNumber: number): Promise<RepairNoteWithDevices | null> {
    return this.withDevicesOne(await this.repairNoteDao.findByControlNumber(controlNumber));
  }

  async withDevices(notes: RepairNote[]): Promise<RepairNoteWithDevices[]> {
    const noteIds = notes.map((n) => n.id);
    const [devices, links] = await Promise.all([
      this.repairNoteDeviceDao.findByRepairNoteIds(noteIds),
      this.repairNoteServiceTypeDao.findByRepairNoteIds(noteIds),
    ]);
    const typesByDevice = new Map<string, string[]>();
    for (const link of links) {
      typesByDevice.set(link.repairNoteDeviceId, [
        ...(typesByDevice.get(link.repairNoteDeviceId) ?? []),
        link.serviceTypeId,
      ]);
    }
    const byNote = new Map<string, RepairNoteDeviceView[]>();
    for (const device of devices) {
      const list = byNote.get(device.repairNoteId) ?? [];
      list.push(toDeviceView(device, typesByDevice.get(device.id) ?? []));
      byNote.set(device.repairNoteId, list);
    }
    return notes.map((note) => Object.assign(note, { devices: byNote.get(note.id) ?? [] }));
  }

  private async withDevicesOne(note: RepairNote | null): Promise<RepairNoteWithDevices | null> {
    if (!note) return null;
    const [withDevices] = await this.withDevices([note]);
    return withDevices ?? null;
  }

  // Reemplaza los equipos de la nota (y, por CASCADE, sus tipos de servicio) dentro de
  // la transaccion del caller; el orden del arreglo es la posicion impresa en los tickets.
  private async replaceDevices(
    manager: EntityManager,
    repairNoteId: string,
    tenantId: string,
    devices: RepairNoteDeviceView[],
  ): Promise<void> {
    await manager.delete(RepairNoteDevice, { repairNoteId, tenantId });
    const saved = await manager.save(
      devices.map(({ serviceTypeIds: _types, ...device }, position) =>
        manager.create(RepairNoteDevice, { ...device, tenantId, repairNoteId, position }),
      ),
    );
    const links = saved.flatMap((device, position) =>
      (devices[position]?.serviceTypeIds ?? []).map((serviceTypeId) =>
        manager.create(RepairNoteServiceType, {
          tenantId,
          repairNoteId,
          repairNoteDeviceId: device.id,
          serviceTypeId,
        }),
      ),
    );
    if (links.length > 0) await manager.save(links);
  }

  // Las sub-lecturas pasan por findById: una nota que el usuario no ve (otro taller,
  // otra sucursal o, para el técnico, ajena) no deja ver sus items, tipos ni pagos.
  async getItems(repairNoteId: string): Promise<RepairNoteItem[]> {
    if (!(await this.repairNoteDao.findById(repairNoteId))) return [];
    return this.repairNoteItemDao.findByRepairNoteId(repairNoteId);
  }

  async getServiceTypeIds(repairNoteId: string): Promise<string[]> {
    if (!(await this.repairNoteDao.findById(repairNoteId))) return [];
    const links = await this.repairNoteServiceTypeDao.findByRepairNoteId(repairNoteId);
    return [...new Set(links.map((l) => l.serviceTypeId))];
  }

  async serviceTypeNameResolver(): Promise<(ids: string[]) => string[]> {
    const types = await this.serviceTypeDao.findAllOrdered();
    const nameById = new Map(types.map((t) => [t.id, t.name]));
    return (ids) => ids.map((id) => nameById.get(id)).filter((n): n is string => Boolean(n));
  }

  // Si la nota lleva items (accesorios/partes usados), crearla y reservar su
  // stock (o descontarlo real si la nota ya nace "comprometida", caso raro)
  // corre en una sola transaccion, junto con los equipos y sus tipos de servicio.
  async create(
    data: CreatePayload,
    items: RepairNoteItemInput[] = [],
    advancePayment?: AdvancePaymentInput,
  ): Promise<RepairNoteWithDevices> {
    if (!data.localId) throw new BusinessError("La sucursal es obligatoria");
    const { devices: rawDevices, ...noteData } = data;
    const devices = normalizeDevices(rawDevices);
    await this.validateItemPrices(items);
    // repair-notes.create.own: la nota queda asignada a quien la crea, mande lo que mande.
    const fields: NoteCreateFields = lacks("repair-notes.create")
      ? { ...noteData, assignedEmployeeId: currentUserId() }
      : noteData;
    const tenantId = getCurrentTenantId();
    await this.assertCanCollectAdvance(fields, advancePayment, tenantId);
    const controlNumber = await this.localService.consumeControlNumber();
    const local = await this.localService.getConfig();
    const receivedTime = new Date().toLocaleTimeString("en-GB", {
      timeZone: local.timeZone,
      hour: "2-digit",
      minute: "2-digit",
    });

    // public_ref es unico en toda la tabla: ante un choque (1 en ~10^12) se
    // reintenta la transaccion completa con otra referencia.
    for (let attempt = 1; ; attempt++) {
      try {
        const note = await this.createWithRef(
          fields,
          devices,
          items,
          controlNumber,
          tenantId,
          advancePayment,
          receivedTime,
        );
        await this.whatsappNotificationQueueService.notifyStatusChange(note, undefined);
        return Object.assign(note, { devices });
      } catch (error) {
        const isRefCollision =
          (error as { code?: string; constraint?: string }).code === "23505" &&
          (error as { constraint?: string }).constraint === "UQ_repair_notes_public_ref";
        if (!isRefCollision || attempt >= 5) throw error;
      }
    }
  }

  private async createWithRef(
    data: NoteCreateFields,
    devices: RepairNoteDeviceView[],
    items: RepairNoteItemInput[],
    controlNumber: number,
    tenantId: string,
    advancePayment: AdvancePaymentInput | undefined,
    receivedTime: string,
  ): Promise<RepairNote> {
    return AppDataSource.transaction(async (manager) => {
      const customerId = await resolveOrCreateCustomer(manager, tenantId, data);
      const note = manager.create(RepairNote, {
        ...data,
        customerId,
        controlNumber,
        tenantId,
        receivedTime,
        publicRef: generatePublicRef(),
      } as Partial<RepairNote>);
      const savedNote = await manager.save(note);
      await this.replaceDevices(manager, savedNote.id, tenantId, devices);
      await this.registerAdvance(manager, savedNote, advancePayment, tenantId);
      const committed = isCommitted(savedNote.status);

      for (const item of items) {
        if (committed) {
          await this.inventoryService.applyMovement(manager, {
            inventoryItemId: item.inventoryItemId,
            type: "out",
            quantity: item.quantity,
            relatedEntityType: "repair_note",
            relatedEntityId: savedNote.id,
          });
        }
        const noteItem = manager.create(RepairNoteItem, {
          tenantId,
          repairNoteId: savedNote.id,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitPrice: toMoney(item.unitPrice),
        });
        const savedNoteItem = await manager.save(noteItem);
        if (!committed) {
          await this.inventoryReservationService.reserve(manager, {
            relatedEntityType: "repair_note_item",
            relatedEntityId: savedNoteItem.id,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
          });
        }
      }

      return savedNote;
    });
  }

  // Reglas del anticipo que no dependen del folio: se revisan antes de consumirlo.
  private async assertCanCollectAdvance(
    data: NoteCreateFields,
    input: AdvancePaymentInput | undefined,
    tenantId: string,
  ): Promise<void> {
    if (!data.requiresAdvance || !new Decimal(data.advanceValue ?? 0).gt(0)) return;
    if (!input?.createdByEmployeeId) throw new BusinessError("Indica quién cobra el anticipo");
    if (!["efectivo", "tarjeta", "transferencia"].includes(input.method)) {
      throw new BusinessError(
        "El anticipo no puede quedar a crédito: se cobra al recibir el equipo",
      );
    }
    const session = await AppDataSource.manager.findOne(CashSession, {
      where: { tenantId, localId: data.localId, status: "open" },
    });
    if (!session) throw new BusinessError("Abre la caja de la sucursal para cobrar el anticipo");
  }

  // El anticipo entra a caja en el mismo momento en que se crea la nota: un pago
  // de la nota y un ingreso en la caja abierta de la sucursal, ambos en la
  // transacción de la nota. Sin caja abierta no hay nota con anticipo.
  private async registerAdvance(
    manager: EntityManager,
    note: RepairNote,
    input: AdvancePaymentInput | undefined,
    tenantId: string,
  ): Promise<void> {
    const advance = new Decimal(note.advanceValue ?? 0);
    if (!note.requiresAdvance || advance.lte(0)) return;
    if (!input?.createdByEmployeeId) throw new BusinessError("Indica quién cobra el anticipo");
    if (!["efectivo", "tarjeta", "transferencia"].includes(input.method)) {
      throw new BusinessError(
        "El anticipo no puede quedar a crédito: se cobra al recibir el equipo",
      );
    }
    const session = await manager.findOne(CashSession, {
      where: { tenantId, localId: note.localId, status: "open" },
    });
    if (!session) throw new BusinessError("Abre la caja de la sucursal para cobrar el anticipo");

    await manager.save(
      manager.create(RepairNotePayment, {
        tenantId,
        repairNoteId: note.id,
        kind: "advance",
        method: input.method,
        amount: toMoney(advance),
      }),
    );
    await manager.save(
      manager.create(CashMovement, {
        tenantId,
        cashSessionId: session.id,
        type: "income",
        method: input.method,
        amount: toMoney(advance),
        relatedEntityType: "repair_note",
        relatedEntityId: note.id,
        note: `Anticipo nota #${note.controlNumber}`,
        createdByEmployeeId: input.createdByEmployeeId,
      }),
    );
  }

  // Entregar = cobrar el saldo (total menos anticipo): todo o nada. Los pagos deben
  // sumar exacto el saldo; efectivo, tarjeta y transferencia son ingresos en la caja
  // abierta, y el crédito es cuenta por cobrar (exige cliente y respeta su límite,
  // contando también lo que ya debe por ventas y otras notas). Solo se puede
  // entregar una nota "Lista"; entregar por PATCH de estado está bloqueado.
  async deliver(id: string, input: DeliverInput): Promise<RepairNote> {
    const tenantId = getCurrentTenantId();
    if (!(await this.repairNoteDao.findById(id))) throw new BusinessError("Nota no encontrada");
    if (lacks("repair-notes.deliver")) input = { ...input, createdByEmployeeId: currentUserId() };
    const local = await this.localService.getConfig();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: local.timeZone });
    const payments = input.payments ?? [];
    for (const payment of payments) {
      if (!PAYMENT_METHODS.includes(payment.method))
        throw new BusinessError("Método de pago inválido");
      if (!new Decimal(payment.amount).gt(0))
        throw new BusinessError("Cada pago debe ser mayor a 0");
    }
    const dueDates = payments.map((p) => resolveCreditDueDate(p.method, p.dueDate, today));

    const deliveredNote = await AppDataSource.transaction(async (manager) => {
      const note = await manager.findOneBy(RepairNote, { id, tenantId });
      if (!note) throw new BusinessError("Nota no encontrada");
      if (note.status !== "done")
        throw new BusinessError("La nota debe estar Lista para poder entregarse");

      const advances = await manager.find(RepairNotePayment, {
        where: { repairNoteId: id, tenantId, kind: "advance" },
      });
      const advancePaid = advances.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
      const balance = Decimal.max(0, new Decimal(note.totalValue ?? 0).minus(advancePaid));
      const paid = payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
      if (!paid.equals(balance)) {
        throw new BusinessError(
          `Los pagos deben sumar el saldo de la nota (${balance.toFixed(2)})`,
        );
      }

      const credit = payments
        .filter((p) => p.method === "credito")
        .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
      if (credit.gt(0)) {
        if (!note.customerId)
          throw new BusinessError("Entregar a crédito requiere un cliente registrado");
        const customer = await manager.findOneBy(Customer, { id: note.customerId, tenantId });
        if (!customer) throw new BusinessError("Cliente no encontrado");
        const current = await sumCreditBalance(manager, tenantId, customer.id);
        const limit = new Decimal(customer.creditLimit);
        if (new Decimal(current).plus(credit).gt(limit)) {
          throw new BusinessError(
            `El crédito supera el límite disponible del cliente (límite: ${limit.toFixed(2)}, saldo actual: ${new Decimal(current).toFixed(2)})`,
          );
        }
      }

      const cashPayments = payments.filter((p) => p.method !== "credito");
      let session: CashSession | null = null;
      if (cashPayments.length > 0) {
        if (!input.createdByEmployeeId) throw new BusinessError("Indica quién cobra la entrega");
        session = await manager.findOne(CashSession, {
          where: { tenantId, localId: note.localId, status: "open" },
        });
        if (!session) throw new BusinessError("Abre la caja de la sucursal para cobrar la entrega");
      }

      for (const [paymentIndex, payment] of payments.entries()) {
        await manager.save(
          manager.create(RepairNotePayment, {
            tenantId,
            repairNoteId: id,
            kind: "delivery",
            method: payment.method,
            amount: toMoney(payment.amount),
            dueDate: dueDates[paymentIndex] ?? null,
          }),
        );
        if (payment.method !== "credito" && session) {
          await manager.save(
            manager.create(CashMovement, {
              tenantId,
              cashSessionId: session.id,
              type: "income",
              method: payment.method,
              amount: toMoney(payment.amount),
              relatedEntityType: "repair_note",
              relatedEntityId: id,
              note: `Entrega nota #${note.controlNumber}`,
              createdByEmployeeId: input.createdByEmployeeId ?? null,
            }),
          );
        }
      }

      note.status = "delivered";
      if (!note.deliveryDate) note.deliveryDate = today;
      return manager.save(note);
    });
    await this.whatsappNotificationQueueService.notifyStatusChange(deliveredNote, "done");
    return deliveredNote;
  }

  async getPayments(repairNoteId: string): Promise<RepairNotePayment[]> {
    if (!(await this.repairNoteDao.findById(repairNoteId))) return [];
    return this.repairNotePaymentDao.findByRepairNoteId(repairNoteId);
  }

  // Un anticipo ya cobrado es un ingreso en caja: ni su valor ni "requiere anticipo" se editan.
  private async assertAdvanceUnchanged(
    id: string,
    data: UpdatePayload,
    tenantId: string,
  ): Promise<void> {
    const charged = await AppDataSource.manager.count(RepairNotePayment, {
      where: { repairNoteId: id, tenantId, kind: "advance" },
    });
    if (charged === 0) return;
    const current = await this.repairNoteDao.findById(id);
    if (!current) return;
    const sameValue = new Decimal(data.advanceValue ?? current.advanceValue ?? 0).equals(
      new Decimal(current.advanceValue ?? 0),
    );
    const sameFlag = (data.requiresAdvance ?? current.requiresAdvance) === current.requiresAdvance;
    if (!sameValue || !sameFlag)
      throw new BusinessError("El anticipo ya se cobró y no se puede modificar");
  }

  // Reemplazar los items de una nota existente libera (o
  // revierte, si la nota ya estaba comprometida) los items anteriores y
  // reserva (o descuenta real, si la nota queda comprometida) los nuevos --
  // todo en la misma transaccion que el update de la nota.
  async update(
    id: string,
    data: UpdatePayload,
    items?: RepairNoteItemInput[],
  ): Promise<RepairNoteWithDevices | null> {
    if ("localId" in data && !data.localId) throw new BusinessError("La sucursal es obligatoria");
    const { devices: rawDevices, ...noteFields } = data;
    const devices = rawDevices === undefined ? undefined : normalizeDevices(rawDevices);
    data = noteFields;
    const tenantId = getCurrentTenantId();
    // Las escrituras de abajo van directo al manager: este findById es el que aplica
    // sucursal y, para el técnico, que la nota sea suya.
    if (!(await this.repairNoteDao.findById(id))) return null;
    if (items !== undefined) await this.validateItemPrices(items);
    if (lacks("repair-notes.write")) {
      const { assignedEmployeeId: _ignored, ...rest } = data;
      data = rest;
    }

    if ("advanceValue" in data || "requiresAdvance" in data) {
      await this.assertAdvanceUnchanged(id, data, tenantId);
    }

    if (data.status === "delivered") {
      const current = await this.repairNoteDao.findById(id);
      if (current && current.status !== "delivered") {
        throw new BusinessError("Para entregar una nota hay que cobrar el saldo: usa Entregar");
      }
    }

    if (items === undefined) {
      let previousStatus: string | undefined;
      const savedNote = await AppDataSource.transaction(async (manager) => {
        const note = await manager.findOneBy(RepairNote, { id, tenantId });
        if (!note) return null;
        previousStatus = note.status;
        Object.assign(note, data);
        const saved = await manager.save(note);
        if (devices) await this.replaceDevices(manager, id, tenantId, devices);

        if (isCommitted(saved.status) && !isCommitted(previousStatus)) {
          await this.consumeActiveReservations(manager, id, tenantId);
        }

        return saved;
      });
      if (savedNote)
        await this.whatsappNotificationQueueService.notifyStatusChange(savedNote, previousStatus);
      return this.withDevicesOne(savedNote);
    }

    let previousStatus: string | undefined;
    const savedNote = await AppDataSource.transaction(async (manager) => {
      const note = await manager.findOneBy(RepairNote, { id, tenantId });
      if (!note) return null;
      previousStatus = note.status;
      const wasCommitted = isCommitted(previousStatus);

      if (items !== undefined) {
        const oldItems = await manager.find(RepairNoteItem, {
          where: { repairNoteId: id, tenantId },
        });
        for (const oldItem of oldItems) {
          if (wasCommitted) {
            await this.inventoryService.applyMovement(manager, {
              inventoryItemId: oldItem.inventoryItemId,
              type: "in",
              quantity: oldItem.quantity,
              relatedEntityType: "repair_note",
              relatedEntityId: id,
              reason: "Edición de nota: reverso de item anterior",
            });
          } else {
            await this.inventoryReservationService.release(manager, "repair_note_item", oldItem.id);
          }
        }
        await manager.delete(RepairNoteItem, { repairNoteId: id, tenantId });
      }

      Object.assign(note, data);
      const savedNote = await manager.save(note);
      if (devices) await this.replaceDevices(manager, id, tenantId, devices);
      const willBeCommitted = isCommitted(savedNote.status);

      if (items !== undefined) {
        for (const item of items) {
          if (willBeCommitted) {
            await this.inventoryService.applyMovement(manager, {
              inventoryItemId: item.inventoryItemId,
              type: "out",
              quantity: item.quantity,
              relatedEntityType: "repair_note",
              relatedEntityId: id,
            });
          }
          const noteItem = manager.create(RepairNoteItem, {
            tenantId,
            repairNoteId: id,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: toMoney(item.unitPrice),
          });
          const savedNoteItem = await manager.save(noteItem);
          if (!willBeCommitted) {
            await this.inventoryReservationService.reserve(manager, {
              relatedEntityType: "repair_note_item",
              relatedEntityId: savedNoteItem.id,
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
            });
          }
        }
      } else if (willBeCommitted && !wasCommitted) {
        // Status cruzo a comprometido en esta misma llamada, sin tocar items.
        await this.consumeActiveReservations(manager, id, tenantId);
      }

      return savedNote;
    });
    if (savedNote)
      await this.whatsappNotificationQueueService.notifyStatusChange(savedNote, previousStatus);
    return this.withDevicesOne(savedNote);
  }

  // Consume todas las reservas activas de las lineas ACTUALES de la nota --
  // mismo punto exacto donde se dispara el aviso de WhatsApp (la nota cruza
  // a "done"/"delivered" por primera vez), nunca antes.
  private async consumeActiveReservations(
    manager: EntityManager,
    repairNoteId: string,
    tenantId: string,
  ): Promise<void> {
    const currentItems = await manager.find(RepairNoteItem, {
      where: { repairNoteId, tenantId },
    });
    for (const item of currentItems) {
      await this.inventoryReservationService.consume(manager, "repair_note_item", item.id);
    }
  }

  // URL del QR impreso en la nota (wa.me con el mensaje prellenado), o null si el
  // taller aun no tiene numero de WhatsApp conectado. Unica fuente: el cliente y
  // el PDF solo dibujan lo que devuelve esto.
  async getWhatsappQrUrl(
    note: Pick<RepairNote, "controlNumber" | "publicRef">,
  ): Promise<string | null> {
    const [displayPhoneNumber, local] = await Promise.all([
      this.whatsappAccountService.getDisplayPhoneNumber(),
      this.localService.getConfig(),
    ]);
    return buildNoteQrUrl({
      displayPhoneNumber,
      controlNumber: note.controlNumber,
      localName: local.name,
      publicRef: note.publicRef,
    });
  }

  // Cancelar libera las reservas activas (si la nota aun no estaba
  // comprometida, nunca se movio stock de verdad) o revierte el stock real
  // (si ya estaba "done") -- nunca se borra la nota.
  async cancel(id: string): Promise<RepairNote> {
    const tenantId = getCurrentTenantId();
    if (!(await this.repairNoteDao.findById(id))) throw new BusinessError("Nota no encontrada");
    let previousStatus = "";
    const cancelledNote = await AppDataSource.transaction(async (manager) => {
      const note = await manager.findOneBy(RepairNote, { id, tenantId });
      if (!note) throw new BusinessError("Nota no encontrada");
      if (note.status === "cancelled") throw new BusinessError("La nota ya está cancelada");
      if (note.status === "delivered")
        throw new BusinessError("No se puede cancelar una nota ya entregada");
      previousStatus = note.status;

      const wasCommitted = isCommitted(note.status);
      const items = await manager.find(RepairNoteItem, { where: { repairNoteId: id, tenantId } });
      for (const item of items) {
        if (wasCommitted) {
          await this.inventoryService.applyMovement(manager, {
            inventoryItemId: item.inventoryItemId,
            type: "in",
            quantity: item.quantity,
            relatedEntityType: "repair_note",
            relatedEntityId: id,
            reason: "Nota cancelada",
          });
        } else {
          await this.inventoryReservationService.release(manager, "repair_note_item", item.id);
        }
      }

      note.status = "cancelled";
      return manager.save(note);
    });
    await this.whatsappNotificationQueueService.notifyStatusChange(cancelledNote, previousStatus);
    return cancelledNote;
  }

  async delete(id: string): Promise<boolean> {
    return this.repairNoteDao.delete(id);
  }
}

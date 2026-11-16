import { singleton } from "tsyringe";
import type { EntityManager, FindOptionsWhere } from "typeorm";
import { RepairNoteDao } from "../daos/repair-note.dao.js";
import { RepairNoteItemDao } from "../daos/repair-note-item.dao.js";
import { RepairNoteServiceTypeDao } from "../daos/repair-note-service-type.dao.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { InventoryService } from "../../inventory/services/inventory.service.js";
import { InventoryReservationService } from "../../inventory/services/inventory-reservation.service.js";
import { ServiceTypeDao } from "../../service-types/daos/service-type.dao.js";
import { RepairNote } from "../entities/repair-note.entity.js";
import { RepairNoteItem } from "../entities/repair-note-item.entity.js";
import { RepairNoteServiceType } from "../entities/repair-note-service-type.entity.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { WhatsappSendService } from "../../../messaging/whatsapp-official/services/whatsapp-send.service.js";

// tenantId/controlNumber los agrega create() desde el contexto/consecutivo
// (nunca el caller); totalValue/status/requiresAdvance/deviceOff/
// hasWarranty/hasExtendedWarranty tienen default en la BD, por eso son
// opcionales aqui aunque la entidad los declare requeridos.
type DefaultedOnCreate =
  | "totalValue"
  | "status"
  | "requiresAdvance"
  | "deviceOff"
  | "hasWarranty"
  | "hasExtendedWarranty";
type CreatePayload = Omit<
  RepairNote,
  "id" | "publicId" | "tenantId" | "controlNumber" | "createdAt" | "updatedAt" | DefaultedOnCreate
> &
  Partial<Pick<RepairNote, DefaultedOnCreate>>;
type UpdatePayload = Partial<
  Omit<RepairNote, "id" | "publicId" | "tenantId" | "controlNumber" | "createdAt" | "updatedAt">
>;

export interface RepairNoteItemInput {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
}

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
    private whatsappSendService: WhatsappSendService,
    private inventoryReservationService: InventoryReservationService,
  ) {}

  async getAll(): Promise<RepairNote[]> {
    return this.repairNoteDao.findAllOrdered();
  }

  async getById(id: string): Promise<RepairNote | null> {
    return this.repairNoteDao.findById(id);
  }

  async getByControlNumber(controlNumber: number): Promise<RepairNote | null> {
    return this.repairNoteDao.findByControlNumber(controlNumber);
  }

  async getItems(repairNoteId: string): Promise<RepairNoteItem[]> {
    return this.repairNoteItemDao.findByRepairNoteId(repairNoteId);
  }

  async getServiceTypeIds(repairNoteId: string): Promise<string[]> {
    const links = await this.repairNoteServiceTypeDao.findByRepairNoteId(repairNoteId);
    return links.map((l) => l.serviceTypeId);
  }

  async getServiceTypeNames(repairNoteId: string): Promise<string[]> {
    const [links, types] = await Promise.all([
      this.repairNoteServiceTypeDao.findByRepairNoteId(repairNoteId),
      this.serviceTypeDao.findAllOrdered(),
    ]);
    const nameById = new Map(types.map((t) => [t.id, t.name]));
    return links.map((l) => nameById.get(l.serviceTypeId)).filter((n): n is string => Boolean(n));
  }

  // Si la nota lleva items (accesorios/partes usados), crearla y reservar su
  // stock (o descontarlo real si la nota ya nace "comprometida", caso raro)
  // corre en una sola transaccion. serviceTypeIds va en la misma transaccion:
  // nunca queda una nota sin sus tipos de servicio por un fallo a medio camino.
  async create(
    data: CreatePayload,
    items: RepairNoteItemInput[] = [],
    serviceTypeIds: string[] = [],
  ): Promise<RepairNote> {
    const controlNumber = await this.localService.consumeControlNumber();
    const tenantId = getCurrentTenantId();

    return AppDataSource.transaction(async (manager) => {
      const note = manager.create(RepairNote, { ...data, controlNumber, tenantId } as Partial<RepairNote>);
      const savedNote = await manager.save(note);
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
          unitPrice: item.unitPrice,
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

      for (const serviceTypeId of serviceTypeIds) {
        const link = manager.create(RepairNoteServiceType, {
          tenantId,
          repairNoteId: savedNote.id,
          serviceTypeId,
        });
        await manager.save(link);
      }

      return savedNote;
    });
  }

  // Reemplazar los items/tipos de servicio de una nota existente libera (o
  // revierte, si la nota ya estaba comprometida) los items anteriores y
  // reserva (o descuenta real, si la nota queda comprometida) los nuevos --
  // todo en la misma transaccion que el update de la nota.
  async update(
    id: string,
    data: UpdatePayload,
    items?: RepairNoteItemInput[],
    serviceTypeIds?: string[],
  ): Promise<RepairNote | null> {
    const tenantId = getCurrentTenantId();

    if (items === undefined && serviceTypeIds === undefined) {
      let previousStatus: string | undefined;
      const savedNote = await AppDataSource.transaction(async (manager) => {
        const note = await manager.findOneBy(RepairNote, { id, tenantId } as unknown as FindOptionsWhere<RepairNote>);
        if (!note) return null;
        previousStatus = note.status;
        Object.assign(note, data);
        const saved = await manager.save(note);

        if (isCommitted(saved.status) && !isCommitted(previousStatus)) {
          await this.consumeActiveReservations(manager, id, tenantId);
        }

        return saved;
      });
      await this.notifyIfJustMarkedDone(previousStatus, savedNote);
      return savedNote;
    }

    let previousStatus: string | undefined;
    const savedNote = await AppDataSource.transaction(async (manager) => {
      const note = await manager.findOneBy(RepairNote, { id, tenantId } as unknown as FindOptionsWhere<RepairNote>);
      if (!note) return null;
      previousStatus = note.status;
      const wasCommitted = isCommitted(previousStatus);

      if (items !== undefined) {
        const oldItems = await manager.find(RepairNoteItem, { where: { repairNoteId: id, tenantId } as unknown as FindOptionsWhere<RepairNoteItem> });
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
        await manager.delete(RepairNoteItem, { repairNoteId: id, tenantId } as unknown as FindOptionsWhere<RepairNoteItem>);
      }

      Object.assign(note, data);
      const savedNote = await manager.save(note);
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
            unitPrice: item.unitPrice,
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

      if (serviceTypeIds !== undefined) {
        await manager.delete(RepairNoteServiceType, { repairNoteId: id, tenantId } as unknown as FindOptionsWhere<RepairNoteServiceType>);
        for (const serviceTypeId of serviceTypeIds) {
          const link = manager.create(RepairNoteServiceType, { tenantId, repairNoteId: id, serviceTypeId });
          await manager.save(link);
        }
      }

      return savedNote;
    });
    await this.notifyIfJustMarkedDone(previousStatus, savedNote);
    return savedNote;
  }

  // Consume todas las reservas activas de las lineas ACTUALES de la nota --
  // mismo punto exacto donde se dispara el aviso de WhatsApp (la nota cruza
  // a "done"/"delivered" por primera vez), nunca antes.
  private async consumeActiveReservations(manager: EntityManager, repairNoteId: string, tenantId: string): Promise<void> {
    const currentItems = await manager.find(RepairNoteItem, {
      where: { repairNoteId, tenantId } as unknown as FindOptionsWhere<RepairNoteItem>,
    });
    for (const item of currentItems) {
      await this.inventoryReservationService.consume(manager, "repair_note_item", item.id);
    }
  }

  // Avisa al cliente (plantilla `order_ready`) la primera vez que la nota
  // pasa a "done" -- nunca en un guardado posterior que la deje igual. Corre
  // fuera de cualquier transaccion de BD (es una llamada HTTP a Meta) y
  // nunca tumba el guardado de la nota ya confirmado: una falla de WhatsApp
  // queda registrada en WhatsappOutboundMessage, no aqui.
  private async notifyIfJustMarkedDone(previousStatus: string | undefined, note: RepairNote | null): Promise<void> {
    if (!note || note.status !== "done" || previousStatus === "done") return;
    try {
      await this.whatsappSendService.notifyOrderReady(note);
    } catch {
      // swallow: ver comentario de arriba.
    }
  }

  // Cancelar libera las reservas activas (si la nota aun no estaba
  // comprometida, nunca se movio stock de verdad) o revierte el stock real
  // (si ya estaba "done") -- nunca se borra la nota.
  async cancel(id: string): Promise<RepairNote> {
    const tenantId = getCurrentTenantId();
    return AppDataSource.transaction(async (manager) => {
      const note = await manager.findOneBy(RepairNote, { id, tenantId } as unknown as FindOptionsWhere<RepairNote>);
      if (!note) throw new Error("Nota no encontrada");
      if (note.status === "cancelled") throw new Error("La nota ya está cancelada");
      if (note.status === "delivered") throw new Error("No se puede cancelar una nota ya entregada");

      const wasCommitted = isCommitted(note.status);
      const items = await manager.find(RepairNoteItem, { where: { repairNoteId: id, tenantId } as unknown as FindOptionsWhere<RepairNoteItem> });
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
  }

  async delete(id: string): Promise<boolean> {
    return this.repairNoteDao.delete(id);
  }
}

import { singleton } from "tsyringe";
import { EntityManager } from "typeorm";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { InventoryReservationDao } from "../daos/inventory-reservation.dao.js";
import { InventoryReservation, InventoryReservationRelatedEntityType } from "../entities/inventory-reservation.entity.js";
import { RelatedEntityType as InventoryMovementRelatedEntityType } from "../entities/inventory-movement.entity.js";
import { InventoryService } from "./inventory.service.js";

export interface ReserveInput {
  relatedEntityType: InventoryReservationRelatedEntityType;
  relatedEntityId: string;
  inventoryItemId: string;
  quantity: number;
}

// Discriminador de la reserva -> discriminador del movimiento real que deja
// al consumirla. Una entrada por origen (mismo criterio que el resto de
// discriminadores de este modulo: nunca un "manual" generico cuando hay un
// origen real que nombrar).
const MOVEMENT_RELATED_ENTITY_TYPE: Record<InventoryReservationRelatedEntityType, InventoryMovementRelatedEntityType> = {
  repair_note_item: "repair_note",
  layaway_item: "layaway",
};

// Todos los metodos reciben el EntityManager del caller (mismo patron que
// InventoryService.applyMovement) -- el caller (RepairNoteService,
// LayawayService) siempre corre esto dentro de SU PROPIA transaccion.
@singleton()
export class InventoryReservationService {
  constructor(
    private reservationDao: InventoryReservationDao,
    private inventoryService: InventoryService,
  ) {}

  // No toca quantityOnHand -- solo dejar constancia de que esa cantidad ya
  // esta comprometida con esta linea de origen.
  async reserve(manager: EntityManager, input: ReserveInput): Promise<InventoryReservation> {
    const tenantId = getCurrentTenantId();
    const reservation = manager.create(InventoryReservation, {
      tenantId,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      inventoryItemId: input.inventoryItemId,
      quantity: input.quantity,
      status: "active",
      consumedMovementId: null,
      resolvedAt: null,
    });
    return manager.save(reservation);
  }

  // La linea se quita/reemplaza/cancela/vence ANTES de consumirse -- nunca se
  // movio stock de verdad, asi que liberar tampoco lo toca. No-op si no hay
  // reserva activa para esa linea (ya se libero o ya se consumio antes).
  async release(
    manager: EntityManager,
    relatedEntityType: InventoryReservationRelatedEntityType,
    relatedEntityId: string,
  ): Promise<void> {
    const reservation = await manager.findOneBy(InventoryReservation, {
      relatedEntityType,
      relatedEntityId,
      status: "active",
    });
    if (!reservation) return;

    await manager.update(InventoryReservation, reservation.id, {
      status: "released",
      resolvedAt: new Date(),
    });
  }

  // El origen se completa por primera vez (nota a "done", apartado pagado):
  // la reserva se vuelve stock real -- mismo ledger atomico que ya usan
  // venta/devolucion/transferencia/conteo. No-op si no hay reserva activa.
  async consume(
    manager: EntityManager,
    relatedEntityType: InventoryReservationRelatedEntityType,
    relatedEntityId: string,
    createdByEmployeeId?: string | null,
  ): Promise<void> {
    const reservation = await manager.findOneBy(InventoryReservation, {
      relatedEntityType,
      relatedEntityId,
      status: "active",
    });
    if (!reservation) return;

    const movement = await this.inventoryService.applyMovement(manager, {
      inventoryItemId: reservation.inventoryItemId,
      type: "out",
      quantity: reservation.quantity,
      relatedEntityType: MOVEMENT_RELATED_ENTITY_TYPE[relatedEntityType],
      relatedEntityId,
      createdByEmployeeId: createdByEmployeeId ?? null,
    });

    await manager.update(InventoryReservation, reservation.id, {
      status: "consumed",
      consumedMovementId: movement.id,
      resolvedAt: new Date(),
    });
  }
}

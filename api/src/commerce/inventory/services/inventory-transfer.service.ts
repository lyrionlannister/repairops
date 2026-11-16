import { singleton } from "tsyringe";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { InventoryItemDao } from "../daos/inventory-item.dao.js";
import { InventoryTransferDao } from "../daos/inventory-transfer.dao.js";
import { InventoryTransfer } from "../entities/inventory-transfer.entity.js";
import { InventoryService } from "./inventory.service.js";

export interface CreateInventoryTransferPayload {
  fromInventoryItemId: string;
  toInventoryItemId: string;
  quantity: number;
  reason?: string | null;
  createdByEmployeeId?: string | null;
}

@singleton()
export class InventoryTransferService {
  constructor(
    private transferDao: InventoryTransferDao,
    private itemDao: InventoryItemDao,
    private inventoryService: InventoryService,
  ) {}

  async getAll(): Promise<InventoryTransfer[]> {
    return this.transferDao.findAllOrdered();
  }

  // Todo-o-nada: resuelve ambos items (tenant-scoped, 404 generico si alguno
  // no es de este tenant), valida que de verdad sean sucursales distintas, y
  // mueve el stock con el mismo ledger atomico que ya usan venta/nota/
  // devolucion -- "out" en origen, "in" en destino, mismo relatedEntityId.
  async create(data: CreateInventoryTransferPayload): Promise<InventoryTransfer> {
    if (data.quantity <= 0) {
      throw new Error("La cantidad a transferir debe ser mayor a 0");
    }
    if (data.fromInventoryItemId === data.toInventoryItemId) {
      throw new Error("El item origen y destino no pueden ser el mismo");
    }

    const [fromItem, toItem] = await Promise.all([
      this.itemDao.findById(data.fromInventoryItemId),
      this.itemDao.findById(data.toInventoryItemId),
    ]);
    if (!fromItem) throw new Error("Item origen no encontrado");
    if (!toItem) throw new Error("Item destino no encontrado");
    if (fromItem.localId === toItem.localId) {
      throw new Error("El item origen y destino pertenecen a la misma sucursal");
    }

    const tenantId = getCurrentTenantId();

    return AppDataSource.transaction(async (manager) => {
      const transfer = manager.create(InventoryTransfer, {
        tenantId,
        fromInventoryItemId: fromItem.id,
        toInventoryItemId: toItem.id,
        quantity: data.quantity,
        reason: data.reason ?? null,
        createdByEmployeeId: data.createdByEmployeeId ?? null,
      });
      const savedTransfer = await manager.save(transfer);

      await this.inventoryService.applyMovement(manager, {
        inventoryItemId: fromItem.id,
        type: "out",
        quantity: data.quantity,
        relatedEntityType: "transfer",
        relatedEntityId: savedTransfer.id,
        createdByEmployeeId: data.createdByEmployeeId ?? null,
      });
      await this.inventoryService.applyMovement(manager, {
        inventoryItemId: toItem.id,
        type: "in",
        quantity: data.quantity,
        relatedEntityType: "transfer",
        relatedEntityId: savedTransfer.id,
        createdByEmployeeId: data.createdByEmployeeId ?? null,
      });

      return savedTransfer;
    });
  }
}

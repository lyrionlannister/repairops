import { singleton } from "tsyringe";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
import type { InventoryTransferListRow } from "../types/inventory-transfer-page.types.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { InventoryItemDao } from "../daos/inventory-item.dao.js";
import { InventoryTransferDao } from "../daos/inventory-transfer.dao.js";
import { InventoryTransfer } from "../entities/inventory-transfer.entity.js";
import { InventoryService } from "./inventory.service.js";
import { BusinessError } from "../../../core/http/business-error.js";
import { currentUserId } from "../../../identity/authz/access.js";

export interface CreateInventoryTransferPayload {
  fromInventoryItemId: string;
  toInventoryItemId: string;
  quantity: number;
  reason?: string | null;
  // Se ignora: createdByEmployeeId siempre es el usuario autenticado (ver
  // create()), nunca lo que manda el cliente.
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

  async getPage(request: PageRequest): Promise<Page<InventoryTransferListRow>> {
    return this.transferDao.findPage(request);
  }

  // Todo-o-nada: resuelve ambos items (tenant-scoped, 404 generico si alguno
  // no es de este tenant), valida que de verdad sean sucursales distintas, y
  // mueve el stock con el mismo ledger atomico que ya usan venta/nota/
  // devolucion -- "out" en origen, "in" en destino, mismo relatedEntityId.
  async create(data: CreateInventoryTransferPayload): Promise<InventoryTransfer> {
    if (data.quantity <= 0) {
      throw new BusinessError("La cantidad a transferir debe ser mayor a 0");
    }
    if (data.fromInventoryItemId === data.toInventoryItemId) {
      throw new BusinessError("El producto de origen y el de destino no pueden ser el mismo");
    }

    const [fromItem, toItem] = await Promise.all([
      this.itemDao.findById(data.fromInventoryItemId),
      this.itemDao.findById(data.toInventoryItemId),
    ]);
    if (!fromItem) throw new BusinessError("No encontramos el producto de origen");
    if (!toItem) throw new BusinessError("No encontramos el producto de destino");
    if (fromItem.localId === toItem.localId) {
      throw new BusinessError("El producto de origen y el de destino están en la misma sucursal");
    }

    const tenantId = getCurrentTenantId();
    // createdByEmployeeId es siempre el usuario autenticado: lo que manda el
    // cliente en el body se ignora (un empleado no puede atribuir traspasos
    // a otro). Los movimientos del traspaso lo fuerzan de nuevo en
    // applyMovement, pero la entidad del traspaso lo fija aquí.
    const createdByEmployeeId = currentUserId();

    return AppDataSource.transaction(async (manager) => {
      const transfer = manager.create(InventoryTransfer, {
        tenantId,
        fromInventoryItemId: fromItem.id,
        toInventoryItemId: toItem.id,
        quantity: data.quantity,
        reason: data.reason ?? null,
        createdByEmployeeId,
      });
      const savedTransfer = await manager.save(transfer);

      await this.inventoryService.applyMovement(manager, {
        inventoryItemId: fromItem.id,
        type: "out",
        quantity: data.quantity,
        relatedEntityType: "transfer",
        relatedEntityId: savedTransfer.id,
        createdByEmployeeId,
      });
      await this.inventoryService.applyMovement(manager, {
        inventoryItemId: toItem.id,
        type: "in",
        quantity: data.quantity,
        relatedEntityType: "transfer",
        relatedEntityId: savedTransfer.id,
        createdByEmployeeId,
      });

      return savedTransfer;
    });
  }
}

import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import { toMoney } from "../../../core/common/utils/money.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { InventoryService } from "../../inventory/services/inventory.service.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { CashSessionDao } from "../../cash/daos/cash-session.dao.js";
import { SaleDao } from "../../inventory/daos/sale.dao.js";
import { SaleItemDao } from "../../inventory/daos/sale-item.dao.js";
import { SaleItem } from "../../inventory/entities/sale-item.entity.js";
import { ReturnDao } from "../daos/return.dao.js";
import { ReturnItemDao } from "../daos/return-item.dao.js";
import { Return } from "../entities/return.entity.js";
import { ReturnItem } from "../entities/return-item.entity.js";
import { CashMovement, CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
  refundAmount: Decimal.Value;
}

export interface CreateReturnPayload {
  saleId: string;
  cashSessionId: string;
  refundMethod: CashMovementMethod;
  reason: string;
  totalRefunded: Decimal.Value;
  createdByEmployeeId?: string | null;
  idempotencyKey?: string | null;
  items: ReturnItemInput[];
}

@singleton()
export class ReturnService {
  constructor(
    private returnDao: ReturnDao,
    private returnItemDao: ReturnItemDao,
    private saleDao: SaleDao,
    private saleItemDao: SaleItemDao,
    private cashSessionDao: CashSessionDao,
    private inventoryService: InventoryService,
    private localService: LocalService,
  ) {}

  async getById(id: string): Promise<Return | null> {
    return this.returnDao.findById(id);
  }

  async getItems(returnId: string): Promise<ReturnItem[]> {
    return this.returnItemDao.findByReturnId(returnId);
  }

  async getBySaleId(saleId: string): Promise<Return[]> {
    return this.returnDao.findBySaleId(saleId);
  }

  // "Cuanto queda disponible por devolver" de una linea -- SUMA sobre todas
  // las devoluciones previas, nunca un campo cacheado (SPEC-pos-sale-cycle.md).
  // Expuesto para que la UI (Tarea R5) muestre lo ya devuelto sin inventar su
  // propia query.
  async getReturnedQuantity(saleItemId: string): Promise<number> {
    return this.returnItemDao.sumReturnedQuantityForSaleItem(saleItemId);
  }

  // Todo-o-nada, mismo criterio que SaleService.create: folio, movimiento de
  // caja y reversion de stock de cada linea en una sola transaccion. Idempotente
  // por idempotencyKey. Nunca edita Sale/SaleItem (invariante central de
  // SPEC-pos-sale-cycle.md) -- Return es siempre una entidad nueva.
  // A diferencia de SaleService.create, no hay regla de negocio por rol aqui
  // (sin tope de descuento que validar) -- el permiso ya lo exige la ruta
  // (returns.create), el Service no necesita el rol de quien llama.
  async create(data: CreateReturnPayload): Promise<Return> {
    if (data.items.length === 0) {
      throw new Error("La devolución debe tener al menos un item");
    }

    const sale = await this.saleDao.findById(data.saleId);
    if (!sale) throw new Error("Venta no encontrada");

    const session = await this.cashSessionDao.findById(data.cashSessionId);
    if (!session) throw new Error("Sesión de caja no encontrada");
    if (session.status !== "open") {
      throw new Error("No se puede devolver: la sesión de caja está cerrada");
    }

    if (data.idempotencyKey) {
      const existing = await this.returnDao.findByIdempotencyKey(data.idempotencyKey);
      if (existing) return existing;
    }

    const saleItemsById = new Map<string, SaleItem>();
    for (const item of data.items) {
      const saleItem = await this.saleItemDao.findById(item.saleItemId);
      if (!saleItem || saleItem.saleId !== sale.id) {
        throw new Error("Línea de venta no encontrada en esta venta");
      }
      saleItemsById.set(item.saleItemId, saleItem);
    }

    const refundSum = data.items.reduce((sum, item) => sum.plus(item.refundAmount), new Decimal(0));
    if (!refundSum.equals(new Decimal(data.totalRefunded))) {
      throw new Error("La suma de los montos por línea no coincide con el total a reembolsar");
    }

    const tenantId = getCurrentTenantId();
    const returnNumber = await this.localService.consumeReturnNumber();

    return AppDataSource.transaction(async (manager) => {
      const newReturn = manager.create(Return, {
        tenantId,
        localId: session.localId,
        saleId: sale.id,
        returnNumber,
        cashSessionId: data.cashSessionId,
        refundMethod: data.refundMethod,
        reason: data.reason,
        totalRefunded: toMoney(data.totalRefunded),
        createdByEmployeeId: data.createdByEmployeeId ?? null,
        idempotencyKey: data.idempotencyKey ?? null,
      });
      const savedReturn = await manager.save(newReturn);

      for (const item of data.items) {
        const saleItem = saleItemsById.get(item.saleItemId)!;

        // Lock pesimista sobre la fila de SaleItem + suma agregada dentro de
        // LA MISMA transaccion -- por eso no se reusa ReturnItemDao aqui (su
        // repository corre fuera de esta transaccion, el lock perderia
        // sentido). Serializa devoluciones concurrentes sobre la misma linea
        // sin cachear "cantidad devuelta" en ningun lado (prohibido por
        // SPEC-pos-sale-cycle.md).
        await manager
          .createQueryBuilder(SaleItem, "si")
          .setLock("pessimistic_write")
          .where("si.id = :id", { id: saleItem.id })
          .getOne();

        const sumRow = await manager
          .createQueryBuilder(ReturnItem, "ri")
          .select("COALESCE(SUM(ri.quantity), 0)", "total")
          .where("ri.saleItemId = :saleItemId", { saleItemId: saleItem.id })
          .getRawOne<{ total: string }>();
        const alreadyReturned = Number(sumRow?.total ?? 0);

        if (item.quantity > saleItem.quantity - alreadyReturned) {
          throw new Error(
            `La cantidad a devolver excede lo disponible en la línea ${saleItem.id} (ya devuelto: ${alreadyReturned}/${saleItem.quantity})`,
          );
        }

        if (saleItem.lineType === "inventory_item") {
          await this.inventoryService.applyMovement(manager, {
            inventoryItemId: saleItem.referenceId,
            type: "in",
            quantity: item.quantity,
            relatedEntityType: "return",
            relatedEntityId: savedReturn.id,
            createdByEmployeeId: data.createdByEmployeeId ?? null,
          });
        }

        const returnItem = manager.create(ReturnItem, {
          tenantId,
          returnId: savedReturn.id,
          saleItemId: saleItem.id,
          quantity: item.quantity,
          refundAmount: toMoney(item.refundAmount),
        });
        await manager.save(returnItem);
      }

      const cashMovement = manager.create(CashMovement, {
        tenantId,
        cashSessionId: data.cashSessionId,
        type: "expense",
        method: data.refundMethod,
        amount: toMoney(data.totalRefunded),
        relatedEntityType: "return",
        relatedEntityId: savedReturn.id,
        note: data.reason,
        createdByEmployeeId: data.createdByEmployeeId ?? null,
      });
      await manager.save(cashMovement);

      return savedReturn;
    });
  }
}

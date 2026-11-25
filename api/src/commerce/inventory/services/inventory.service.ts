import { isRowsTuple } from "../../../core/database/rows-result.js";
import { singleton } from "tsyringe";
import { currentUserId, lacks } from "../../../identity/authz/access.js";
import { EntityManager } from "typeorm";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { InventoryItemDao } from "../daos/inventory-item.dao.js";
import { InventoryMovementDao } from "../daos/inventory-movement.dao.js";
import { InventoryReservationDao } from "../daos/inventory-reservation.dao.js";
import { SupplierDao } from "../../suppliers/daos/supplier.dao.js";
import { InventoryItem } from "../entities/inventory-item.entity.js";
import {
  InventoryMovement,
  MovementType,
  RelatedEntityType,
} from "../entities/inventory-movement.entity.js";
import type { InventoryImportRow } from "../utils/inventory-import-parser.js";
import type { Decimal } from "decimal.js";
import { toMoney } from "../../../core/common/utils/money.js";
import { BusinessError } from "../../../core/http/business-error.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
import type { InventoryFilters, InventoryStats } from "../types/inventory-page.types.js";

export interface RegisterMovementInput {
  inventoryItemId: string;
  type: MovementType;
  quantity: number;
  reason?: string | null;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string | null;
  // Se ignora: createdByEmployeeId siempre es el usuario autenticado (ver
  // applyMovement), nunca lo que manda el cliente.
  createdByEmployeeId?: string | null;
}

// No deriva de InventoryItem via Omit: tenantId lo agrega TenantScopedDao.create
// (nunca lo manda el caller) y sku/minStock son opcionales en la entrada aunque
// la entidad los guarde con default -- shape propio en vez de pelear con el de
// persistencia es lo que permite pasar el DTO ya validado sin castear.
type CreateItemPayload = {
  localId: string;
  name: string;
  sku?: string | null;
  kind: InventoryItem["kind"];
  costPrice: Decimal.Value;
  salePrice: Decimal.Value;
  minStock?: number;
  supplierId?: string | null;
};
type UpdateItemPayload = Partial<CreateItemPayload>;

// inventory.lookup (el técnico): busca refacciones para sus notas sin ver costo ni proveedor.
function hideCostsUnlessAllowed<T extends InventoryItem>(item: T): T {
  if (!lacks("inventory.read")) return item;
  const {
    costPrice: _cost,
    supplierId: _supplier,
    supplier: _supplierRow,
    ...rest
  } = item as T & { supplier?: unknown };
  return rest as T;
}

@singleton()
export class InventoryService {
  constructor(
    private itemDao: InventoryItemDao,
    private movementDao: InventoryMovementDao,
    private reservationDao: InventoryReservationDao,
    private supplierDao: SupplierDao,
  ) {}

  // supplierId llega del cliente -- igual que cualquier ID ajeno, se resuelve
  // con el Dao tenant-scoped antes de guardarlo (ver skill tenant-isolation),
  // nunca se confia en que exista solo porque el tenant actual es valido.
  private async assertSupplierBelongsToTenant(supplierId: string): Promise<void> {
    const supplier = await this.supplierDao.findById(supplierId);
    if (!supplier) throw new BusinessError("Proveedor no encontrado");
  }

  async getAll(branchId?: string | null): Promise<InventoryItem[]> {
    return this.itemDao.findAllOrdered(branchId);
  }

  // "Disponible" por item, calculado en una sola consulta agrupada (ver
  // InventoryReservationDao.sumActiveQuantityByItemForTenant) -- nunca
  // cacheado en la entidad.
  async getAllWithAvailability(
    branchId?: string | null,
  ): Promise<Array<InventoryItem & { available: number }>> {
    const [items, reservedByItem] = await Promise.all([
      this.itemDao.findAllOrdered(branchId),
      this.reservationDao.sumActiveQuantityByItemForTenant(),
    ]);
    return items.map((item) =>
      hideCostsUnlessAllowed({
        ...item,
        available: item.quantityOnHand - (reservedByItem.get(item.id) ?? 0),
      }),
    );
  }

  async getPage(
    filters: InventoryFilters,
    request: PageRequest,
  ): Promise<Page<InventoryItem & { available: number }>> {
    const page = await this.itemDao.findPage(filters, request);
    return { ...page, items: await this.withAvailability(page.items) };
  }

  async lookup(filters: InventoryFilters, limit: number): Promise<Array<InventoryItem & { available: number }>> {
    return this.withAvailability(await this.itemDao.lookup(filters, limit));
  }

  async getStats(filters: InventoryFilters): Promise<InventoryStats> {
    return this.itemDao.stats(filters);
  }

  async getMovementsPage(inventoryItemId: string, request: PageRequest): Promise<Page<InventoryMovement>> {
    return this.movementDao.findPageByItem(inventoryItemId, request);
  }

  private async withAvailability(items: InventoryItem[]): Promise<Array<InventoryItem & { available: number }>> {
    const reserved = await this.reservationDao.sumActiveQuantityByItem(items.map((item) => String(item.id)));
    return items.map((item) =>
      hideCostsUnlessAllowed({ ...item, available: item.quantityOnHand - (reserved.get(String(item.id)) ?? 0) }),
    );
  }

  async getById(id: string): Promise<InventoryItem | null> {
    const item = await this.itemDao.findById(id);
    return item && hideCostsUnlessAllowed(item);
  }

  // "Disponible para prometer" -- nunca se cachea (ver SPEC-fase5-pos-total.md,
  // Pieza 3 de Inventario vivo), siempre quantityOnHand menos reservas
  // activas calculado en cada lectura.
  async getAvailableQuantity(inventoryItemId: string): Promise<number> {
    const item = await this.itemDao.findById(inventoryItemId);
    if (!item) throw new BusinessError("Producto no encontrado");
    const reserved = await this.reservationDao.sumActiveQuantityForItem(inventoryItemId);
    return item.quantityOnHand - reserved;
  }

  async getBySku(sku: string): Promise<InventoryItem | null> {
    const item = await this.itemDao.findBySku(sku);
    return item && hideCostsUnlessAllowed(item);
  }

  async getLowStock(): Promise<InventoryItem[]> {
    return this.itemDao.findLowStock();
  }

  async create(data: CreateItemPayload): Promise<InventoryItem> {
    if (data.supplierId) await this.assertSupplierBelongsToTenant(data.supplierId);
    return this.itemDao.create({
      ...data,
      costPrice: toMoney(data.costPrice),
      salePrice: toMoney(data.salePrice),
      quantityOnHand: 0,
    });
  }

  async update(id: string, data: UpdateItemPayload): Promise<InventoryItem | null> {
    if (data.supplierId) await this.assertSupplierBelongsToTenant(data.supplierId);
    const { costPrice, salePrice, ...rest } = data;
    return this.itemDao.update(id, {
      ...rest,
      ...(costPrice !== undefined && { costPrice: toMoney(costPrice) }),
      ...(salePrice !== undefined && { salePrice: toMoney(salePrice) }),
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.itemDao.delete(id);
  }

  // Todo-o-nada, igual que Sale/RepairNote: una fila invalida no deja items
  // huerfanos a medio importar. El stock inicial de cada fila pasa por
  // applyMovement (nunca se escribe quantityOnHand directo) para que quede
  // registrado en el ledger como cualquier otro movimiento.
  async bulkImport(localId: string, rows: InventoryImportRow[]): Promise<{ imported: number }> {
    if (rows.length === 0) {
      throw new BusinessError("No hay filas para importar");
    }
    const tenantId = getCurrentTenantId();

    return AppDataSource.transaction(async (manager) => {
      for (const row of rows) {
        const item = manager.create(InventoryItem, {
          tenantId,
          localId,
          name: row.name,
          sku: row.sku,
          kind: row.kind,
          costPrice: toMoney(row.costPrice),
          salePrice: toMoney(row.salePrice),
          quantityOnHand: 0,
        });
        const saved = await manager.save(item);

        if (row.quantity > 0) {
          await this.applyMovement(manager, {
            inventoryItemId: saved.id,
            type: "in",
            quantity: row.quantity,
            reason: "Carga inicial por importación CSV/Excel",
          });
        }
      }
      return { imported: rows.length };
    });
  }

  async getMovements(inventoryItemId: string): Promise<InventoryMovement[]> {
    return this.movementDao.findByItem(inventoryItemId);
  }

  // Punto de entrada standalone (p.ej. "Registrar movimiento" manual desde la UI):
  // abre su propia transaccion.
  async registerMovement(input: RegisterMovementInput): Promise<InventoryMovement> {
    return AppDataSource.transaction((manager) => this.applyMovement(manager, input));
  }

  // Lo apartado (apartados, refacciones de notas abiertas) ya no se puede
  // prometer a nadie más. El FOR UPDATE serializa a quien aparta o vende el
  // mismo producto: sin él, dos apartados simultáneos verían el mismo libre.
  async assertUnreservedStock(
    manager: EntityManager,
    inventoryItemId: string,
    quantity: number,
  ): Promise<void> {
    const tenantId = getCurrentTenantId();
    const result = await manager.query<
      Array<{ name: string; free: number }> | [Array<{ name: string; free: number }>, number]
    >(
      `SELECT i.nombre AS name,
              i.cantidad_disponible - COALESCE((
                SELECT SUM(r.cantidad) FROM inventory_reservations r
                WHERE r.id_item_inventario = i.id AND r.tenant_id = i.tenant_id AND r.estado = 'active'
              ), 0) AS free
       FROM inventory_items i
       WHERE i.id = $1 AND i.tenant_id = $2
       FOR UPDATE OF i`,
      [inventoryItemId, tenantId],
    );
    const [row] = isRowsTuple(result) ? result[0] : result;
    if (!row) throw new BusinessError("No encontramos el producto en el inventario");
    const free = Math.max(0, Number(row.free));
    if (free < quantity) {
      throw new BusinessError(
        free === 0
          ? `No hay piezas libres de "${row.name}": las que quedan ya están apartadas.`
          : `Solo hay ${free} pieza${free === 1 ? "" : "s"} libre${free === 1 ? "" : "s"} de "${row.name}".`,
      );
    }
  }

  // Reusable dentro de una transaccion mas grande que ya esta en curso
  // (crear una Sale o guardar los items de una RepairNote): el caller pasa
  // su propio EntityManager para que el decremento de stock, el insert del
  // movimiento y el resto de la operacion (venta/nota) sean todo-o-nada.
  //
  // Atomico por diseno: el UPDATE aplica el delta y valida
  // quantityOnHand + delta >= 0 en la misma sentencia -- no hay
  // read-then-write, asi que dos llamadas concurrentes sobre el mismo item
  // nunca pueden dejar el stock negativo ni perder un decremento (mismo
  // patron que consumeControlNumber en local.dao.ts).
  async applyMovement(
    manager: EntityManager,
    input: RegisterMovementInput,
  ): Promise<InventoryMovement> {
    const tenantId = getCurrentTenantId();
    const delta =
      input.type === "out"
        ? -Math.abs(input.quantity)
        : input.type === "in"
          ? Math.abs(input.quantity)
          : input.quantity;

    const result = await manager.query<Array<{ id: string }> | [Array<{ id: string }>, number]>(
      `UPDATE inventory_items
       SET cantidad_disponible = cantidad_disponible + $1
       WHERE id = $2 AND tenant_id = $3 AND cantidad_disponible + $1 >= 0
       RETURNING id`,
      [delta, input.inventoryItemId, tenantId],
    );
    const rows = isRowsTuple(result) ? result[0] : result;
    if (rows.length === 0) {
      throw new BusinessError(
        "No hay suficiente stock de uno de los productos. Revisa las existencias e intenta de nuevo.",
      );
    }

    const movement = manager.create(InventoryMovement, {
      tenantId,
      inventoryItemId: input.inventoryItemId,
      type: input.type,
      quantity: delta,
      reason: input.reason ?? null,
      relatedEntityType: input.relatedEntityType ?? "manual",
      relatedEntityId: input.relatedEntityId ?? null,
      // createdByEmployeeId es siempre el usuario autenticado: lo que manda
      // el cliente se ignora (un empleado no puede atribuir movimientos a
      // otro). Este es el embudo de todos los movimientos (venta, traspaso,
      // conteo, reserva, nota, importación), así que con forzarlo aquí basta.
      createdByEmployeeId: currentUserId(),
    });
    return manager.save(movement);
  }
}

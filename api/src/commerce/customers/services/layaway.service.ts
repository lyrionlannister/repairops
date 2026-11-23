import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import AppDataSource from "../../../core/config/data-source.js";
import { BusinessError } from "../../../core/http/business-error.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { currentUserId } from "../../../identity/authz/access.js";
import { CustomerDao } from "../daos/customer.dao.js";
import { CashSessionDao } from "../../cash/daos/cash-session.dao.js";
import { CashMovement, CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";
import { InventoryItemDao } from "../../inventory/daos/inventory-item.dao.js";
import { PriceListDao } from "../../price-list/daos/price-list.dao.js";
import { InventoryReservationService } from "../../inventory/services/inventory-reservation.service.js";
import { LayawayDao } from "../daos/layaway.dao.js";
import { LayawayItemDao } from "../daos/layaway-item.dao.js";
import { Layaway } from "../entities/layaway.entity.js";
import { LayawayItem } from "../entities/layaway-item.entity.js";
import { toMoney } from "../../../core/common/utils/money.js";

export interface LayawayItemInput {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface OpenLayawayPayload {
  customerId: string;
  cashSessionId: string;
  depositAmount: number;
  depositMethod: CashMovementMethod;
  expiresAt: string;
  // Se ignora: createdByEmployeeId siempre es el usuario autenticado (ver
  // open()), nunca lo que manda el cliente.
  createdByEmployeeId?: string | null;
  items: LayawayItemInput[];
}

export interface CompletePaymentInput {
  method: CashMovementMethod;
  amount: number;
}

const today = () => new Date().toISOString().slice(0, 10);

@singleton()
export class LayawayService {
  constructor(
    private layawayDao: LayawayDao,
    private layawayItemDao: LayawayItemDao,
    private customerDao: CustomerDao,
    private cashSessionDao: CashSessionDao,
    private itemDao: InventoryItemDao,
    private reservationService: InventoryReservationService,
    private priceListDao: PriceListDao,
  ) {}

  // Precio de inventario: debe ser igual a precio_venta del item o al precio
  // de la lista de precios aplicable del tenant (proveedor + modelo). Si no
  // coincide con ninguno, el cliente está intentando fijar el precio.
  private async validateItemPrices(items: LayawayItemInput[]): Promise<void> {
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

  async getAll(branchId?: string | null): Promise<Layaway[]> {
    return this.layawayDao.findAllOrdered(branchId);
  }

  async getItems(layawayId: string): Promise<LayawayItem[]> {
    return this.layawayItemDao.findByLayawayId(layawayId);
  }

  // Lee el apartado y, si vencio sin completarse, lo expira primero (libera
  // reservas, nunca toca el anticipo ya cobrado) antes de devolverlo --
  // sin cron en este repo, la expiracion es perezosa: se evalua en cada
  // lectura/escritura, mismo criterio que el resto del repo para estados
  // calculados al vuelo.
  async getById(id: string): Promise<Layaway | null> {
    const layaway = await this.layawayDao.findById(id);
    if (!layaway) return null;
    return this.expireIfDue(layaway);
  }

  private async expireIfDue(layaway: Layaway): Promise<Layaway> {
    if (layaway.status !== "open" || layaway.expiresAt >= today()) return layaway;

    const tenantId = getCurrentTenantId();
    return AppDataSource.transaction(async (manager) => {
      const items = await manager.find(LayawayItem, {
        where: { layawayId: layaway.id, tenantId } as Partial<LayawayItem>,
      });
      for (const item of items) {
        await this.reservationService.release(manager, "layaway_item", item.id);
      }
      await manager.update(Layaway, layaway.id, { status: "expired", expiredAt: new Date() });
      return (await manager.findOneBy(Layaway, { id: layaway.id })) as Layaway;
    });
  }

  // Todo-o-nada: reserva cada linea (nunca toca quantityOnHand) + registra
  // el anticipo como CashMovement "income" real -- mismo gate de sesion
  // abierta que Sale/Return.
  // createdByEmployeeId es siempre el usuario autenticado: lo que manda el
  // cliente en el body se ignora.
  async open(data: OpenLayawayPayload): Promise<Layaway> {
    if (data.items.length === 0) {
      throw new BusinessError("El apartado debe tener al menos un item");
    }
    const customer = await this.customerDao.findById(data.customerId);
    if (!customer) throw new BusinessError("Cliente no encontrado");

    const session = await this.cashSessionDao.findById(data.cashSessionId);
    if (!session) throw new BusinessError("Sesión de caja no encontrada");
    if (session.status !== "open") {
      throw new BusinessError("No se puede abrir el apartado: la sesión de caja está cerrada");
    }

    await this.validateItemPrices(data.items);
    const createdByEmployeeId = currentUserId();

    const totalValue = data.items.reduce(
      (sum, item) => sum.plus(new Decimal(item.unitPrice).times(item.quantity)),
      new Decimal(0),
    );
    const depositAmount = new Decimal(data.depositAmount);
    if (depositAmount.lessThanOrEqualTo(0)) {
      throw new BusinessError("El anticipo debe ser mayor a 0");
    }
    if (depositAmount.greaterThan(totalValue)) {
      throw new BusinessError("El anticipo no puede ser mayor al valor total del apartado");
    }

    const tenantId = getCurrentTenantId();

    return AppDataSource.transaction(async (manager) => {
      const layaway = manager.create(Layaway, {
        tenantId,
        localId: session.localId,
        customerId: data.customerId,
        status: "open",
        totalValue: toMoney(totalValue),
        depositAmount: toMoney(depositAmount),
        depositMethod: data.depositMethod,
        expiresAt: data.expiresAt,
        createdByEmployeeId,
        completedAt: null,
        cancelledAt: null,
        expiredAt: null,
      });
      const savedLayaway = await manager.save(layaway);

      for (const item of data.items) {
        const layawayItem = manager.create(LayawayItem, {
          tenantId,
          layawayId: savedLayaway.id,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitPrice: toMoney(item.unitPrice),
        });
        const savedItem = await manager.save(layawayItem);
        await this.reservationService.reserve(manager, {
          relatedEntityType: "layaway_item",
          relatedEntityId: savedItem.id,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
        });
      }

      const depositMovement = manager.create(CashMovement, {
        tenantId,
        cashSessionId: data.cashSessionId,
        type: "income",
        method: data.depositMethod,
        amount: toMoney(depositAmount),
        relatedEntityType: "layaway",
        relatedEntityId: savedLayaway.id,
        note: "Anticipo de apartado",
        createdByEmployeeId,
      });
      await manager.save(depositMovement);

      return savedLayaway;
    });
  }

  // Paga el saldo restante: consume las reservas (stock real baja) y
  // registra un segundo CashMovement "income" -- nunca crea una Sale (ver
  // comentario de la entidad).
  async complete(
    layawayId: string,
    payments: CompletePaymentInput[],
    cashSessionId: string,
  ): Promise<Layaway> {
    const layaway = await this.getById(layawayId);
    if (!layaway) throw new BusinessError("Apartado no encontrado");
    if (layaway.status === "expired") throw new BusinessError("El apartado ya venció");
    if (layaway.status === "cancelled") throw new BusinessError("El apartado ya está cancelado");
    if (layaway.status === "completed") throw new BusinessError("El apartado ya está completado");
    if (payments.length === 0) throw new BusinessError("Se requiere al menos un pago");

    const session = await this.cashSessionDao.findById(cashSessionId);
    if (!session) throw new BusinessError("Sesión de caja no encontrada");
    if (session.status !== "open") {
      throw new BusinessError("No se puede completar el apartado: la sesión de caja está cerrada");
    }

    const remaining = new Decimal(layaway.totalValue).minus(layaway.depositAmount);
    const paymentsSum = payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
    if (!paymentsSum.equals(remaining)) {
      throw new BusinessError(
        "La suma de los pagos no coincide con el saldo restante del apartado",
      );
    }

    const tenantId = getCurrentTenantId();
    const items = await this.layawayItemDao.findByLayawayId(layawayId);

    return AppDataSource.transaction(async (manager) => {
      for (const item of items) {
        await this.reservationService.consume(manager, "layaway_item", item.id);
      }

      for (const payment of payments) {
        const movement = manager.create(CashMovement, {
          tenantId,
          cashSessionId,
          type: "income",
          method: payment.method,
          amount: toMoney(payment.amount),
          relatedEntityType: "layaway",
          relatedEntityId: layawayId,
          note: "Saldo final de apartado",
        });
        await manager.save(movement);
      }

      await manager.update(Layaway, layawayId, { status: "completed", completedAt: new Date() });
      return (await manager.findOneBy(Layaway, { id: layawayId })) as Layaway;
    });
  }

  // Libera las reservas sin tocar stock -- el anticipo ya cobrado NO se
  // reembolsa solo (decision explicita del usuario), queda registrado tal
  // cual en el ledger de caja; devolverlo (si el taller decide hacerlo) es
  // una Return manual, no un efecto automatico de cancelar.
  async cancel(layawayId: string): Promise<Layaway> {
    const layaway = await this.getById(layawayId);
    if (!layaway) throw new BusinessError("Apartado no encontrado");
    if (layaway.status === "completed")
      throw new BusinessError("No se puede cancelar un apartado ya completado");
    if (layaway.status === "cancelled") throw new BusinessError("El apartado ya está cancelado");
    if (layaway.status === "expired") throw new BusinessError("El apartado ya venció");

    const tenantId = getCurrentTenantId();
    const items = await this.layawayItemDao.findByLayawayId(layawayId);

    return AppDataSource.transaction(async (manager) => {
      for (const item of items) {
        await this.reservationService.release(manager, "layaway_item", item.id);
      }
      await manager.update(Layaway, layawayId, { status: "cancelled", cancelledAt: new Date() });
      return (await manager.findOneBy(Layaway, {
        id: layawayId,
        tenantId,
      })) as Layaway;
    });
  }
}

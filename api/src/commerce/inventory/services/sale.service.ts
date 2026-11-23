import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import AppDataSource from "../../../core/config/data-source.js";
import { BusinessError } from "../../../core/http/business-error.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { currentUserId } from "../../../identity/authz/access.js";
import { AuditLogService, AUDIT_ACTIONS } from "../../../core/audit/services/audit-log.service.js";
import { InventoryService } from "./inventory.service.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { CashSessionDao } from "../../cash/daos/cash-session.dao.js";
import { ServiceTypeDao } from "../../service-types/daos/service-type.dao.js";
import { InventoryItemDao } from "../daos/inventory-item.dao.js";
import { PriceListDao } from "../../price-list/daos/price-list.dao.js";
import { InventoryItem } from "../entities/inventory-item.entity.js";
import { SaleDao } from "../daos/sale.dao.js";
import { SaleItemDao } from "../daos/sale-item.dao.js";
import { Sale, SaleOrigin } from "../entities/sale.entity.js";
import { SaleItem, SaleItemLineType } from "../entities/sale-item.entity.js";
import { SalePayment, SalePaymentMethod } from "../../payments/entities/sale-payment.entity.js";
import { SalePaymentDao } from "../../payments/daos/sale-payment.dao.js";
import { CashMovement } from "../../cash/entities/cash-movement.entity.js";
import { CustomerDao } from "../../customers/daos/customer.dao.js";
import { resolveCreditDueDate } from "../../customers/utils/credit-due-date.js";
import { calculateSaleTotals } from "../../pricing/calculate-sale-totals.js";
import { toMoney } from "../../../core/common/utils/money.js";
import type { UserRole } from "../../../identity/auth/entities/user.entity.js";
import { BranchDiscountCapService } from "../../../identity/branches/services/branch-discount-cap.service.js";

export interface SaleItemInput {
  lineType: SaleItemLineType;
  referenceId: string;
  quantity: number;
  unitPrice: Decimal.Value;
  discountPercent?: Decimal.Value;
}

export interface PaymentInput {
  method: SalePaymentMethod;
  amount: Decimal.Value;
  providerReference?: string | null;
  providerAuthorizationCode?: string | null;
  dueDate?: string | null;
}

export interface CreateSalePayload {
  applyTax?: boolean;
  localId: string;
  cashSessionId: string;
  customerId?: string | null;
  customerName?: string | null;
  origin?: SaleOrigin;
  payments: PaymentInput[];
  // Se ignora: createdByEmployeeId siempre es el usuario autenticado (ver
  // create()), nunca lo que manda el cliente.
  createdByEmployeeId?: string | null;
  idempotencyKey?: string | null;
  items: SaleItemInput[];
}

// Renglón con precio fijado por un humano (sin precio de referencia en el
// servidor): queda en bitácora después de crear la venta.
interface HumanPricedLine {
  lineKind: string;
  unitPrice: string;
}

@singleton()
export class SaleService {
  constructor(
    private saleDao: SaleDao,
    private saleItemDao: SaleItemDao,
    private salePaymentDao: SalePaymentDao,
    private inventoryService: InventoryService,
    private localService: LocalService,
    private cashSessionDao: CashSessionDao,
    private serviceTypeDao: ServiceTypeDao,
    private customerDao: CustomerDao,
    private discountCapService: BranchDiscountCapService,
    private itemDao: InventoryItemDao,
    private priceListDao: PriceListDao,
    // Opcional: la bitácora es best-effort (nunca rompe la venta); un
    // servicio construido sin ella simplemente no registra precios fijados.
    private auditLog?: AuditLogService,
  ) {}

  async getAll(branchId?: string | null): Promise<Sale[]> {
    return this.saleDao.findAllOrdered(branchId);
  }

  async getById(id: string): Promise<Sale | null> {
    return this.saleDao.findById(id);
  }

  async getItems(saleId: string): Promise<SaleItem[]> {
    return this.saleItemDao.findBySaleId(saleId);
  }

  async getPayments(saleId: string): Promise<SalePayment[]> {
    return this.salePaymentDao.findBySaleId(saleId);
  }

  // Precio de inventario: debe ser igual a precio_venta del item o al precio
  // de la lista de precios aplicable del tenant (proveedor + modelo). Si no
  // coincide con ninguno, el cliente está intentando fijar el precio.
  private async assertInventoryPrice(item: InventoryItem, unitPrice: Decimal.Value): Promise<void> {
    const price = new Decimal(unitPrice);
    if (price.equals(new Decimal(item.salePrice))) return;
    if (item.supplierId) {
      const listItem = await this.priceListDao.findBySupplierAndModel(item.supplierId, item.name);
      if (listItem && price.equals(new Decimal(listItem.price))) return;
    }
    throw new BusinessError("El precio unitario no coincide con el precio de venta del item");
  }

  // Revalida el precio de cada renglón en el servidor, antes de crear la
  // venta: el unitPrice del cliente nunca se acepta tal cual. Devuelve los
  // renglones con precio fijado por un humano, para dejarlos en bitácora.
  private async validateLinePrices(items: SaleItemInput[]): Promise<HumanPricedLine[]> {
    const humanPriced: HumanPricedLine[] = [];
    for (const item of items) {
      if (item.lineType === "service_type") {
        const serviceType = await this.serviceTypeDao.findById(item.referenceId);
        if (!serviceType) throw new BusinessError("Tipo de servicio no encontrado");
        const price = new Decimal(item.unitPrice);
        if (serviceType.basePrice !== null && serviceType.basePrice !== undefined) {
          if (!price.equals(new Decimal(serviceType.basePrice))) {
            throw new BusinessError(
              "El precio del servicio no coincide con su precio base configurado",
            );
          }
        } else {
          if (price.lessThanOrEqualTo(0)) {
            throw new BusinessError("El precio del servicio debe ser mayor a 0");
          }
          humanPriced.push({ lineKind: "service_type", unitPrice: toMoney(price) });
        }
      } else {
        const inventoryItem = await this.itemDao.findById(item.referenceId);
        if (!inventoryItem) throw new BusinessError("Item de inventario no encontrado");
        await this.assertInventoryPrice(inventoryItem, item.unitPrice);
      }
    }
    return humanPriced;
  }

  // Best-effort: la bitácora nunca rompe la operación que ya se creó.
  private async recordHumanPrices(entityId: string, lines: HumanPricedLine[]): Promise<void> {
    const auditLog = this.auditLog;
    if (!auditLog || lines.length === 0) return;
    const tenantId = getCurrentTenantId();
    const userId = currentUserId();
    for (const line of lines) {
      try {
        await auditLog.record({
          tenantId,
          userId,
          action: AUDIT_ACTIONS.SALES_PRICE_SET,
          entity: "sale",
          entityId,
          details: { lineKind: line.lineKind, unitPrice: line.unitPrice },
        });
      } catch (error) {
        console.error("No se pudo registrar el precio fijado en bitácora", error);
      }
    }
  }

  // Todo-o-nada: folio, caja, pagos, cada movimiento de stock y cada item en
  // una sola transaccion. Idempotente por idempotencyKey (un doble clic en
  // "Cobrar" nunca produce una segunda venta) y exige una sesion de caja
  // abierta del mismo local (cap. 3 del plan: "sin sesión de caja no hay
  // cobro"). El tope de descuento de la sucursal para los roles de quien vende se valida aquí, nunca solo en
  // pantalla (ver skill tenant-isolation / money-precision). Pago dividido
  // (Fase 3, SPEC-fase3-pos-dinero.md): sum(payments[].amount) debe cuadrar
  // exacto contra el total, sin tolerancia de redondeo -- se valida antes
  // de abrir la transaccion, mismo lugar que el tope de descuento.
  // createdByEmployeeId es siempre el usuario autenticado: lo que manda el
  // cliente en el body se ignora (un empleado no puede atribuir ventas a otro).
  async create(data: CreateSalePayload, requestingRoles: readonly UserRole[]): Promise<Sale> {
    if (data.items.length === 0) {
      throw new BusinessError("La venta debe tener al menos un item");
    }
    if (data.payments.length === 0) {
      throw new BusinessError("La venta debe tener al menos un pago");
    }

    const session = await this.cashSessionDao.findById(data.cashSessionId);
    if (!session || session.localId !== data.localId) {
      throw new BusinessError("Sesión de caja no encontrada");
    }
    if (session.status !== "open") {
      throw new BusinessError("No se puede cobrar: la sesión de caja está cerrada");
    }

    if (data.idempotencyKey) {
      const existing = await this.saleDao.findByIdempotencyKey(data.idempotencyKey);
      if (existing) return existing;
    }

    const humanPricedLines = await this.validateLinePrices(data.items);
    const createdByEmployeeId = currentUserId();

    const local = await this.localService.getConfig();
    const discountCap = await this.discountCapService.maxDiscountFor(data.localId, requestingRoles);
    if (discountCap) {
      for (const item of data.items) {
        if (new Decimal(item.discountPercent ?? 0).greaterThan(discountCap)) {
          throw new BusinessError(
            `El descuento del renglón supera el límite permitido para tu rol (${discountCap.toFixed(2)}%)`,
          );
        }
      }
    }

    const totals = calculateSaleTotals(
      data.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      })),
      data.applyTax ? local.taxRatePercent : 0,
    );

    const paymentsSum = data.payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
    if (!paymentsSum.equals(new Decimal(totals.total))) {
      throw new BusinessError("La suma de los pagos no coincide con el total de la venta");
    }
    const today = new Date().toLocaleDateString("en-CA", { timeZone: local.timeZone });
    const dueDates = data.payments.map((p) => resolveCreditDueDate(p.method, p.dueDate, today));

    // Sexta precondicion (Fase 5, Rama Cliente): credito exige cliente y
    // respeta su limite. El saldo se recalcula aqui mismo, nunca se confia
    // en un valor cacheado -- dos ventas a credito seguidas del mismo
    // cliente deben ver el saldo que la anterior ya dejo.
    const creditoAmount = data.payments
      .filter((p) => p.method === "credito")
      .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
    if (creditoAmount.greaterThan(0)) {
      if (!data.customerId) {
        throw new BusinessError("Una venta a crédito requiere un cliente");
      }
      const customer = await this.customerDao.findById(data.customerId);
      if (!customer) throw new BusinessError("Cliente no encontrado");
      const currentBalance = await this.salePaymentDao.sumCreditoForCustomer(data.customerId);
      const limit = new Decimal(customer.creditLimit);
      if (new Decimal(currentBalance).plus(creditoAmount).greaterThan(limit)) {
        throw new BusinessError(
          `La venta a crédito supera el límite disponible del cliente (límite: ${limit.toFixed(2)}, saldo actual: ${currentBalance})`,
        );
      }
    }

    const tenantId = getCurrentTenantId();
    const saleNumber = await this.localService.consumeSaleNumber();

    const savedSale = await AppDataSource.transaction(async (manager) => {
      const sale = manager.create(Sale, {
        tenantId,
        localId: data.localId,
        saleNumber,
        cashSessionId: data.cashSessionId,
        customerId: data.customerId ?? null,
        customerName: data.customerName ?? null,
        origin: data.origin ?? "counter",
        createdByEmployeeId,
        idempotencyKey: data.idempotencyKey ?? null,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalValue: totals.total,
      });
      const savedSale = await manager.save(sale);

      for (const [paymentIndex, paymentInput] of data.payments.entries()) {
        const payment = manager.create(SalePayment, {
          tenantId,
          saleId: savedSale.id,
          method: paymentInput.method,
          amount: toMoney(paymentInput.amount),
          providerReference: paymentInput.providerReference ?? null,
          providerAuthorizationCode: paymentInput.providerAuthorizationCode ?? null,
          dueDate: dueDates[paymentIndex] ?? null,
        });
        await manager.save(payment);

        // Credito no es dinero en caja -- es una cuenta por cobrar, nunca un
        // movimiento (igual que ReturnService/LayawayService solo mueven
        // caja en metodos que sí son efectivo/tarjeta/transferencia).
        if (paymentInput.method !== "credito") {
          const cashMovement = manager.create(CashMovement, {
            tenantId,
            cashSessionId: data.cashSessionId,
            type: "income",
            method: paymentInput.method,
            amount: toMoney(paymentInput.amount),
            relatedEntityType: "sale",
            relatedEntityId: savedSale.id,
            createdByEmployeeId,
          });
          await manager.save(cashMovement);
        }
      }

      for (const [index, item] of data.items.entries()) {
        const line = totals.lines[index];

        if (item.lineType === "inventory_item") {
          await this.inventoryService.applyMovement(manager, {
            inventoryItemId: item.referenceId,
            type: "out",
            quantity: item.quantity,
            relatedEntityType: "sale",
            relatedEntityId: savedSale.id,
            createdByEmployeeId,
          });
        }

        const saleItem = manager.create(SaleItem, {
          tenantId,
          saleId: savedSale.id,
          lineType: item.lineType,
          referenceId: item.referenceId,
          quantity: item.quantity,
          unitPrice: toMoney(item.unitPrice),
          discountAmount: line.lineDiscount,
        });
        await manager.save(saleItem);
      }

      return savedSale;
    });

    await this.recordHumanPrices(savedSale.id, humanPricedLines);
    return savedSale;
  }
}

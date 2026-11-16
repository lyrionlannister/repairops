import { singleton, inject } from "tsyringe";
import { Decimal } from "decimal.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { InventoryService } from "./inventory.service.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { CashSessionDao } from "../../cash/daos/cash-session.dao.js";
import { ServiceTypeDao } from "../../service-types/daos/service-type.dao.js";
import { SaleDao } from "../daos/sale.dao.js";
import { SaleItemDao } from "../daos/sale-item.dao.js";
import { Sale, SaleOrigin } from "../entities/sale.entity.js";
import { SaleItem, SaleItemLineType } from "../entities/sale-item.entity.js";
import { SalePayment, SalePaymentMethod } from "../../payments/entities/sale-payment.entity.js";
import { SalePaymentDao } from "../../payments/daos/sale-payment.dao.js";
import { CashMovement, CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";
import { CustomerDao } from "../../customers/daos/customer.dao.js";
import { calculateSaleTotals } from "../../pricing/calculate-sale-totals.js";
import type { UserRole } from "../../../identity/auth/entities/user.entity.js";

export interface SaleItemInput {
  lineType: SaleItemLineType;
  referenceId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface PaymentInput {
  method: SalePaymentMethod;
  amount: number;
  providerReference?: string | null;
  providerAuthorizationCode?: string | null;
}

export interface CreateSalePayload {
  localId: string;
  cashSessionId: string;
  customerId?: string | null;
  customerName?: string | null;
  origin?: SaleOrigin;
  payments: PaymentInput[];
  createdByEmployeeId?: string | null;
  idempotencyKey?: string | null;
  items: SaleItemInput[];
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
  ) {}

  async getAll(): Promise<Sale[]> {
    return this.saleDao.findAllOrdered();
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

  // Todo-o-nada: folio, caja, pagos, cada movimiento de stock y cada item en
  // una sola transaccion. Idempotente por idempotencyKey (un doble clic en
  // "Cobrar" nunca produce una segunda venta) y exige una sesion de caja
  // abierta del mismo local (cap. 3 del plan: "sin sesión de caja no hay
  // cobro"). El tope de descuento por rol se valida aquí, nunca solo en
  // pantalla (ver skill tenant-isolation / money-precision). Pago dividido
  // (Fase 3, SPEC-fase3-pos-dinero.md): sum(payments[].amount) debe cuadrar
  // exacto contra el total, sin tolerancia de redondeo -- se valida antes
  // de abrir la transaccion, mismo lugar que el tope de descuento.
  async create(data: CreateSalePayload, requestingRole: UserRole): Promise<Sale> {
    if (data.items.length === 0) {
      throw new Error("La venta debe tener al menos un item");
    }
    if (data.payments.length === 0) {
      throw new Error("La venta debe tener al menos un pago");
    }

    const session = await this.cashSessionDao.findById(data.cashSessionId);
    if (!session || session.localId !== data.localId) {
      throw new Error("Sesión de caja no encontrada");
    }
    if (session.status !== "open") {
      throw new Error("No se puede cobrar: la sesión de caja está cerrada");
    }

    if (data.idempotencyKey) {
      const existing = await this.saleDao.findByIdempotencyKey(data.idempotencyKey);
      if (existing) return existing;
    }

    for (const item of data.items) {
      if (item.lineType === "service_type") {
        const serviceType = await this.serviceTypeDao.findById(item.referenceId);
        if (!serviceType) throw new Error("Tipo de servicio no encontrado");
      }
    }

    const local = await this.localService.getConfig();
    const discountCap = local.maxDiscountPercentByRole?.[requestingRole] ?? 100;
    for (const item of data.items) {
      if ((item.discountPercent ?? 0) > discountCap) {
        throw new Error(`El descuento del renglón supera el límite permitido para tu rol (${discountCap}%)`);
      }
    }

    const totals = calculateSaleTotals(
      data.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      })),
      Number(local.taxRatePercent),
    );

    const paymentsSum = data.payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
    if (!paymentsSum.equals(new Decimal(totals.total))) {
      throw new Error("La suma de los pagos no coincide con el total de la venta");
    }

    // Sexta precondicion (Fase 5, Rama Cliente): credito exige cliente y
    // respeta su limite. El saldo se recalcula aqui mismo, nunca se confia
    // en un valor cacheado -- dos ventas a credito seguidas del mismo
    // cliente deben ver el saldo que la anterior ya dejo.
    const creditoAmount = data.payments
      .filter((p) => p.method === "credito")
      .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
    if (creditoAmount.greaterThan(0)) {
      if (!data.customerId) {
        throw new Error("Una venta a crédito requiere un cliente");
      }
      const customer = await this.customerDao.findById(data.customerId);
      if (!customer) throw new Error("Cliente no encontrado");
      const currentBalance = await this.salePaymentDao.sumCreditoForCustomer(data.customerId);
      const limit = new Decimal(customer.creditLimit);
      if (new Decimal(currentBalance).plus(creditoAmount).greaterThan(limit)) {
        throw new Error(`La venta a crédito supera el límite disponible del cliente (límite: ${limit.toFixed(2)}, saldo actual: ${currentBalance})`);
      }
    }

    const tenantId = getCurrentTenantId();
    const saleNumber = await this.localService.consumeSaleNumber();

    return AppDataSource.transaction(async (manager) => {
      const sale = manager.create(Sale, {
        tenantId,
        localId: data.localId,
        saleNumber,
        cashSessionId: data.cashSessionId,
        customerId: data.customerId ?? null,
        customerName: data.customerName ?? null,
        origin: data.origin ?? "counter",
        createdByEmployeeId: data.createdByEmployeeId ?? null,
        idempotencyKey: data.idempotencyKey ?? null,
        // totals.* ya están redondeados por el motor de cálculo con Decimal
        // (ver commerce/pricing) -- Number() aquí solo satisface el tipo de
        // la columna TypeORM, no repite el cálculo con aritmética nativa.
        subtotal: Number(totals.subtotal),
        discountAmount: Number(totals.discountAmount),
        taxAmount: Number(totals.taxAmount),
        totalValue: Number(totals.total),
      });
      const savedSale = await manager.save(sale);

      for (const paymentInput of data.payments) {
        const payment = manager.create(SalePayment, {
          tenantId,
          saleId: savedSale.id,
          method: paymentInput.method,
          amount: paymentInput.amount,
          providerReference: paymentInput.providerReference ?? null,
          providerAuthorizationCode: paymentInput.providerAuthorizationCode ?? null,
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
            method: paymentInput.method as CashMovementMethod,
            amount: paymentInput.amount,
            relatedEntityType: "sale",
            relatedEntityId: savedSale.id,
            createdByEmployeeId: data.createdByEmployeeId ?? null,
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
            createdByEmployeeId: data.createdByEmployeeId ?? null,
          });
        }

        const saleItem = manager.create(SaleItem, {
          tenantId,
          saleId: savedSale.id,
          lineType: item.lineType,
          referenceId: item.referenceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: Number(line.lineDiscount),
        });
        await manager.save(saleItem);
      }

      return savedSale;
    });
  }
}

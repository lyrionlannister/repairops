import { singleton } from "tsyringe";
import type { FindOptionsWhere } from "typeorm";
import { Decimal } from "decimal.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { CustomerPaymentDao } from "../daos/customer-payment.dao.js";
import { CustomerPayment } from "../entities/customer-payment.entity.js";
import { Customer } from "../entities/customer.entity.js";
import { sumCreditBalance } from "../utils/credit-balance.js";
import { CashSession } from "../../cash/entities/cash-session.entity.js";
import { CashMovement } from "../../cash/entities/cash-movement.entity.js";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

export interface RegisterCustomerPaymentInput {
  customerId: string;
  localId: string;
  amount: number;
  method: CashMovementMethod;
  createdByEmployeeId?: string | null;
}

@singleton()
export class CustomerPaymentService {
  constructor(private dao: CustomerPaymentDao) {}

  async getByCustomerId(customerId: string): Promise<CustomerPayment[]> {
    return this.dao.findByCustomerId(customerId);
  }

  // Un abono baja el saldo a crédito del cliente: nunca más de lo que debe, y
  // siempre con caja abierta (entra como ingreso) -- mismo criterio que el
  // anticipo de una nota (RepairNoteService.registerAdvance).
  async register(input: RegisterCustomerPaymentInput): Promise<CustomerPayment> {
    const amount = new Decimal(input.amount);
    if (!amount.gt(0)) throw new Error("El monto del abono debe ser mayor a 0");
    const tenantId = getCurrentTenantId();

    return AppDataSource.transaction(async (manager) => {
      const customer = await manager.findOneBy(Customer, {
        id: input.customerId,
        tenantId,
      } as unknown as FindOptionsWhere<Customer>);
      if (!customer) throw new Error("Cliente no encontrado");

      const balance = await sumCreditBalance(manager, tenantId, customer.id);
      if (amount.gt(balance)) {
        throw new Error(`El abono no puede ser mayor a lo que debe el cliente (debe: ${new Decimal(balance).toFixed(2)})`);
      }

      const session = await manager.findOne(CashSession, {
        where: { tenantId, localId: input.localId, status: "open" } as unknown as FindOptionsWhere<CashSession>,
      });
      if (!session) throw new Error("Abre la caja de la sucursal para registrar el abono");

      const payment = manager.create(CustomerPayment, {
        tenantId,
        localId: input.localId,
        customerId: customer.id,
        amount: amount.toNumber(),
        method: input.method,
        createdByEmployeeId: input.createdByEmployeeId ?? null,
      });
      const savedPayment = await manager.save(payment);

      await manager.save(
        manager.create(CashMovement, {
          tenantId,
          cashSessionId: session.id,
          type: "income",
          method: input.method,
          amount: amount.toNumber(),
          relatedEntityType: "customer_payment",
          relatedEntityId: savedPayment.id,
          note: `Abono cliente #${customer.id}`,
          createdByEmployeeId: input.createdByEmployeeId ?? null,
        }),
      );

      return savedPayment;
    });
  }
}

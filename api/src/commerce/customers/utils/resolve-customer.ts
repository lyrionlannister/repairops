import type { EntityManager, FindOptionsWhere } from "typeorm";
import { Customer } from "../entities/customer.entity.js";

export interface ResolveCustomerInput {
  customerId?: string | null;
  customerName?: string | null;
  contactNumber?: string | null;
}

// Un ID de cliente que llega del cliente se valida contra el tenant actual
// (nunca se confia); sin ID se reutiliza el cliente del tenant con el mismo
// telefono y nombre, o se crea uno nuevo. Sin telefono no hay cliente nuevo.
// Mismo criterio en notas de reparacion y cotizaciones.
export async function resolveOrCreateCustomer(
  manager: EntityManager,
  tenantId: string,
  input: ResolveCustomerInput,
): Promise<string | null> {
  if (input.customerId) {
    const customer = await manager.findOneBy(Customer, {
      id: input.customerId,
      tenantId,
    } as unknown as FindOptionsWhere<Customer>);
    if (!customer) throw new Error("Cliente no encontrado");
    return customer.id;
  }
  const name = input.customerName?.trim();
  const phone = input.contactNumber?.trim();
  if (!name || !phone) return null;
  const existing = await manager.findOneBy(Customer, { tenantId, phone } as unknown as FindOptionsWhere<Customer>);
  if (existing && existing.name.trim().toLowerCase() === name.toLowerCase()) return existing.id;
  const created = await manager.save(manager.create(Customer, { tenantId, name, phone, creditLimit: 0 } as Partial<Customer>));
  return created.id;
}

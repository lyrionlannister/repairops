import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Customer } from "../entities/customer.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { can, currentUserId } from "../../../identity/authz/access.js";

// customers.read.own (el técnico): solo los clientes ligados a notas asignadas a él.
function ownCustomersOnly(): string | null {
  return !can("customers.read") && can("customers.read.own") ? currentUserId() : null;
}

const OWN_NOTES_CUSTOMERS = `
SELECT 
  rn.customer_id
FROM repair_notes rn
WHERE rn.tenant_id = :tenantId 
AND rn.id_empleado_asignado = :ownCustomersUserId 
AND rn.customer_id IS NOT NULL`;

@singleton()
export class CustomerDao extends TenantScopedDao<Customer> {
  constructor(@inject(repositoryToken(Customer)) repository: Repository<Customer>) {
    super(repository);
  }

  protected override scoped(alias = "entity") {
    const query = super.scoped(alias);
    const userId = ownCustomersOnly();
    if (userId)
      query.andWhere(`${alias}.id IN (${OWN_NOTES_CUSTOMERS})`, { ownCustomersUserId: userId });
    return query;
  }

  override async findById(id: string | number): Promise<Customer | null> {
    if (!ownCustomersOnly()) return super.findById(id);
    return this.scoped().andWhere("entity.id = :id", { id }).getOne();
  }

  override async findOne(where: Partial<Customer>): Promise<Customer | null> {
    const customer = await super.findOne(where);
    return customer && ownCustomersOnly() ? this.findById(customer.id) : customer;
  }

  override async findAll(): Promise<Customer[]> {
    return this.scoped().orderBy("entity.name", "ASC").getMany();
  }
}

import { singleton } from "tsyringe";
import { SupplierDao } from "../daos/supplier.dao.js";
import { Supplier } from "../entities/supplier.entity.js";

type CreatePayload = Pick<Supplier, "name" | "phone" | "email" | "address" | "contactName">;
type UpdatePayload = Partial<CreatePayload>;

@singleton()
export class SupplierService {
  constructor(private dao: SupplierDao) {}

  async getAll(): Promise<Supplier[]> {
    return this.dao.findAll();
  }

  async getById(id: string): Promise<Supplier | null> {
    return this.dao.findById(id);
  }

  async create(data: CreatePayload): Promise<Supplier> {
    const name = data.name?.trim();
    const phone = data.phone?.trim() ?? "";

    if (!name) {
      throw new Error("El nombre del proveedor es obligatorio");
    }

    return this.dao.create({
      name,
      phone,
      email: data.email?.trim() || undefined,
      address: data.address?.trim() || undefined,
      contactName: data.contactName?.trim() || undefined,
      isActive: true,
    });
  }

  async update(id: string, data: UpdatePayload): Promise<Supplier | null> {
    const payload: Partial<Supplier> = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new Error("El nombre del proveedor es obligatorio");
      }
      payload.name = name;
    }

    if (data.phone !== undefined) payload.phone = data.phone.trim();
    if (data.email !== undefined) payload.email = data.email?.trim() || undefined;
    if (data.address !== undefined) payload.address = data.address?.trim() || undefined;
    if (data.contactName !== undefined) payload.contactName = data.contactName?.trim() || undefined;

    return this.dao.update(id, payload);
  }

  // Soft: nunca se borra un proveedor con historial (price_list_items/inventory_items lo
  // referencian), solo se desactiva -- mismo criterio que Branch.setActive.
  async setActive(id: string, isActive: boolean): Promise<Supplier | null> {
    return this.dao.update(id, { isActive });
  }

  async delete(id: string): Promise<boolean> {
    return this.dao.delete(id);
  }
}

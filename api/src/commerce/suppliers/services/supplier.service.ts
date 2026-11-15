import { singleton, inject } from "tsyringe";
import { SupplierDao } from "../daos/supplier.dao.js";
import { Supplier } from "../entities/supplier.entity.js";

type CreatePayload = Pick<Supplier, "name" | "phone">;
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

    return this.dao.create({ name, phone });
  }

  async update(id: string, data: UpdatePayload): Promise<Supplier | null> {
    const payload: UpdatePayload = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new Error("El nombre del proveedor es obligatorio");
      }
      payload.name = name;
    }

    if (data.phone !== undefined) {
      payload.phone = data.phone.trim();
    }

    return this.dao.update(id, payload as Partial<Supplier>);
  }

  async delete(id: string): Promise<boolean> {
    return this.dao.delete(id);
  }
}

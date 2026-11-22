import { singleton } from "tsyringe";
import { PriceListDao } from "../daos/price-list.dao.js";
import { PriceListItem } from "../entities/price-list-item.entity.js";
import { SupplierDao } from "../../suppliers/daos/supplier.dao.js";

type CreatePayload = Omit<PriceListItem, "id" | "createdAt" | "updatedAt" | "supplier">;
type UpdatePayload = Partial<CreatePayload>;

@singleton()
export class PriceListService {
  constructor(
    private dao: PriceListDao,
    private supplierDao: SupplierDao,
  ) {}

  async getAll(): Promise<PriceListItem[]> {
    return this.dao.findAllOrdered();
  }

  async search(query: string): Promise<PriceListItem[]> {
    return this.dao.searchByModel(query);
  }

  // supplierId llega del cliente -- se resuelve con el Dao tenant-scoped
  // antes de guardarlo (ver skill tenant-isolation); antes de este cambio
  // la FK de Postgres validaba solo que la fila existiera, sin importar de
  // que tenant.
  async create(data: CreatePayload): Promise<PriceListItem> {
    if (data.supplierId) {
      const supplier = await this.supplierDao.findById(data.supplierId);
      if (!supplier) throw new Error("Proveedor no encontrado");
    }
    return this.dao.create(data);
  }

  async update(id: string, data: UpdatePayload): Promise<PriceListItem | null> {
    if (data.supplierId) {
      const supplier = await this.supplierDao.findById(data.supplierId);
      if (!supplier) throw new Error("Proveedor no encontrado");
    }
    return this.dao.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.dao.delete(id);
  }

}

import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { InventoryTransfer } from "../entities/inventory-transfer.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { InventoryItem } from "../entities/inventory-item.entity.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
import type {
  InventoryTransferItemRef,
  InventoryTransferListRow,
} from "../types/inventory-transfer-page.types.js";

const itemRef = (item: InventoryItem | undefined): InventoryTransferItemRef | null =>
  item ? { name: item.name, localId: item.localId } : null;

@singleton()
export class InventoryTransferDao extends TenantScopedDao<InventoryTransfer> {
  constructor(@inject(repositoryToken(InventoryTransfer)) repository: Repository<InventoryTransfer>) {
    super(repository);
  }

  // Nombre y sucursal de cada producto viajan con la fila: la pantalla ya no necesita
  // descargar el inventario completo solo para etiquetar el historial.
  async findPage(request: PageRequest): Promise<Page<InventoryTransferListRow>> {
    const builder = this.scoped()
      .leftJoinAndSelect("entity.fromItem", "fromItem", "fromItem.tenantId = entity.tenantId")
      .leftJoinAndSelect("entity.toItem", "toItem", "toItem.tenantId = entity.tenantId")
      .orderBy("entity.createdAt", "DESC")
      .addOrderBy("entity.id", "DESC");
    const page = await this.paginate(builder, request);
    return {
      ...page,
      items: page.items.map((row) => {
        const { fromItem, toItem, ...transfer } = row;
        return Object.assign(Object.create(Object.getPrototypeOf(row)), transfer, {
          fromItem: itemRef(fromItem),
          toItem: itemRef(toItem),
        }) as InventoryTransferListRow;
      }),
    };
  }

  async findAllOrdered(): Promise<InventoryTransfer[]> {
    return this.scoped().orderBy("entity.createdAt", "DESC").getMany();
  }
}

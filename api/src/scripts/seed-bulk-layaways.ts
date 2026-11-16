import "reflect-metadata";
import AppDataSource from "../core/config/data-source.js";
import { runWithTenant, allowSystemScope } from "../core/tenancy/tenant-context.js";
import { Tenant } from "../core/tenancy/entities/tenant.entity.js";
import { Local } from "../app_platform/local/entities/local.entity.js";
import { LocalDao } from "../app_platform/local/daos/local.dao.js";
import { LocalService } from "../app_platform/local/services/local.service.js";
import { Customer } from "../commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../commerce/customers/daos/customer.dao.js";
import { InventoryItem } from "../commerce/inventory/entities/inventory-item.entity.js";
import { InventoryItemDao } from "../commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovement } from "../commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryMovementDao } from "../commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryReservation } from "../commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../commerce/inventory/daos/inventory-reservation.dao.js";
import { InventoryReservationService } from "../commerce/inventory/services/inventory-reservation.service.js";
import { InventoryService } from "../commerce/inventory/services/inventory.service.js";
import { Supplier } from "../commerce/suppliers/entities/supplier.entity.js";
import { SupplierDao } from "../commerce/suppliers/daos/supplier.dao.js";
import { CashSession } from "../commerce/cash/entities/cash-session.entity.js";
import { CashSessionDao } from "../commerce/cash/daos/cash-session.dao.js";
import { CashMovement } from "../commerce/cash/entities/cash-movement.entity.js";
import { CashMovementDao } from "../commerce/cash/daos/cash-movement.dao.js";
import { CashService } from "../commerce/cash/services/cash.service.js";
import { User } from "../identity/auth/entities/user.entity.js";
import { UserDao } from "../identity/auth/daos/user.dao.js";
import { Layaway } from "../commerce/customers/entities/layaway.entity.js";
import { LayawayDao } from "../commerce/customers/daos/layaway.dao.js";
import { LayawayItem } from "../commerce/customers/entities/layaway-item.entity.js";
import { LayawayItemDao } from "../commerce/customers/daos/layaway-item.dao.js";
import { LayawayService } from "../commerce/customers/services/layaway.service.js";

// Complemento de seed-bulk.ts: solo apartados, reusando clientes/items que
// ya existen (seed-bulk.ts no pudo abrir una 2a sesion de caja la primera
// corrida). No idempotente, cada corrida agrega mas apartados.
async function seedLayaways(tenantId: string): Promise<void> {
  await runWithTenant(tenantId, async () => {
    const localDao = new LocalDao(AppDataSource.getRepository(Local));
    const localService = new LocalService(localDao);
    const local = await localService.getConfig();

    const customerDao = new CustomerDao(AppDataSource.getRepository(Customer));
    const customers = await customerDao.findAll();

    const inventoryService = new InventoryService(
      new InventoryItemDao(AppDataSource.getRepository(InventoryItem)),
      new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement)),
      new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation)),
      new SupplierDao(AppDataSource.getRepository(Supplier)),
    );
    const inventoryReservationService = new InventoryReservationService(
      new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation)),
      inventoryService,
    );
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const items = await itemDao.findAll();

    const cashService = new CashService(
      new CashSessionDao(AppDataSource.getRepository(CashSession)),
      new CashMovementDao(AppDataSource.getRepository(CashMovement)),
      localService,
      new UserDao(AppDataSource.getRepository(User)),
    );
    const session = (await cashService.getOpenSession(local.id)) ?? (await cashService.openSession(local.id, 1000));

    const layawayService = new LayawayService(
      new LayawayDao(AppDataSource.getRepository(Layaway)),
      new LayawayItemDao(AppDataSource.getRepository(LayawayItem)),
      customerDao,
      new CashSessionDao(AppDataSource.getRepository(CashSession)),
      itemDao,
      inventoryReservationService,
    );

    for (let i = 1; i <= 15; i++) {
      const customer = customers[(i * 5) % customers.length];
      const item = items[(i * 2) % items.length];
      await layawayService.open({
        customerId: customer.id,
        cashSessionId: session.id,
        depositAmount: Math.max(1, Math.round(Number(item.salePrice) * 0.3)),
        depositMethod: "efectivo",
        expiresAt: new Date(Date.now() + (i + 5) * 86400000).toISOString().slice(0, 10),
        items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: item.salePrice }],
      });
    }

    console.log("Seed apartados listo: 15 apartados.");
  });
}

async function main(): Promise<void> {
  await AppDataSource.initialize();

  const tenantIdArg = process.argv[2];
  const tenantId = tenantIdArg
    ?? (await allowSystemScope(async () => {
      const [tenant] = await AppDataSource.getRepository(Tenant).find({ take: 1 });
      return tenant?.id;
    }));

  if (!tenantId) {
    console.error("No hay ningun tenant creado todavia.");
    process.exitCode = 1;
    return AppDataSource.destroy();
  }

  await seedLayaways(tenantId);
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error("Error sembrando apartados:", error);
  process.exitCode = 1;
});

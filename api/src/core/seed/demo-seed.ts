import AppDataSource from "../config/data-source.js";
import { runWithTenant } from "../tenancy/tenant-context.js";
import { Customer } from "../../commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../../commerce/customers/daos/customer.dao.js";
import { ServiceType } from "../../commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../../commerce/service-types/daos/service-type.dao.js";
import { Local } from "../../app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../app_platform/local/daos/local.dao.js";
import { LocalService } from "../../app_platform/local/services/local.service.js";
import { InventoryItem } from "../../commerce/inventory/entities/inventory-item.entity.js";
import { InventoryItemDao } from "../../commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovement } from "../../commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryMovementDao } from "../../commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryService } from "../../commerce/inventory/services/inventory.service.js";
import { RepairNote } from "../../commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteDao } from "../../commerce/repair-notes/daos/repair-note.dao.js";
import { RepairNoteItem } from "../../commerce/repair-notes/entities/repair-note-item.entity.js";
import { RepairNoteItemDao } from "../../commerce/repair-notes/daos/repair-note-item.dao.js";
import { RepairNoteServiceType } from "../../commerce/repair-notes/entities/repair-note-service-type.entity.js";
import { RepairNoteServiceTypeDao } from "../../commerce/repair-notes/daos/repair-note-service-type.dao.js";
import { RepairNoteService } from "../../commerce/repair-notes/services/repair-note.service.js";
import { CashSession } from "../../commerce/cash/entities/cash-session.entity.js";
import { CashSessionDao } from "../../commerce/cash/daos/cash-session.dao.js";
import { CashMovement } from "../../commerce/cash/entities/cash-movement.entity.js";
import { CashMovementDao } from "../../commerce/cash/daos/cash-movement.dao.js";
import { CashService } from "../../commerce/cash/services/cash.service.js";
import { User } from "../../identity/auth/entities/user.entity.js";
import { UserDao } from "../../identity/auth/daos/user.dao.js";

// Taller de demostración repetible: clientes, refacciones, servicios,
// órdenes y caja. Idempotente por tenant (si ya hay clientes, no vuelve a
// sembrar) para poder correrlo en cada boot sin duplicar datos.
export async function seedDemoShop(tenantId: string): Promise<void> {
  await runWithTenant(tenantId, async () => {
    const customerRepository = AppDataSource.getRepository(Customer);
    const already = await customerRepository.count({ where: { tenantId } });
    if (already > 0) return;

    const localDao = new LocalDao(AppDataSource.getRepository(Local));
    const localService = new LocalService(localDao);
    const local = await localService.getConfig();

    const customerDao = new CustomerDao(customerRepository);
    const [maria, carlos] = await Promise.all([
      customerDao.create({ name: "María Fernández", phone: "5215512349001" }),
      customerDao.create({ name: "Carlos Torres", phone: "5215512349002" }),
    ]);

    const serviceTypeDao = new ServiceTypeDao(AppDataSource.getRepository(ServiceType));
    const [screenRepair, batteryRepair] = await Promise.all([
      serviceTypeDao.create({ name: "Cambio de pantalla" }),
      serviceTypeDao.create({ name: "Cambio de batería" }),
    ]);
    await serviceTypeDao.create({ name: "Diagnóstico" });

    const inventoryService = new InventoryService(
      new InventoryItemDao(AppDataSource.getRepository(InventoryItem)),
      new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement)),
    );
    const partsAndAccessories: Array<[string, InventoryItem["kind"], number, number, number]> = [
      ["Pantalla iPhone 11", "part", 850, 1400, 5],
      ["Batería Samsung A52", "part", 280, 550, 8],
      ["Funda silicón universal", "accessory", 40, 120, 20],
      ["Cable USB-C 1m", "accessory", 35, 90, 25],
    ];
    const items: InventoryItem[] = [];
    for (const [name, kind, costPrice, salePrice, initialStock] of partsAndAccessories) {
      const item = await inventoryService.create({
        tenantId,
        localId: local.id,
        name,
        sku: null,
        kind,
        costPrice,
        salePrice,
        minStock: 0,
      });
      await inventoryService.registerMovement({
        inventoryItemId: item.id,
        type: "in",
        quantity: initialStock,
        reason: "Carga inicial — taller demo",
      });
      items.push(item);
    }
    const [screenItem, batteryItem] = items;

    const repairNoteService = new RepairNoteService(
      new RepairNoteDao(AppDataSource.getRepository(RepairNote)),
      localService,
      new RepairNoteItemDao(AppDataSource.getRepository(RepairNoteItem)),
      inventoryService,
      new RepairNoteServiceTypeDao(AppDataSource.getRepository(RepairNoteServiceType)),
      serviceTypeDao,
    );
    await repairNoteService.create(
      {
        tenantId,
        localId: local.id,
        customerId: maria.id,
        customerName: maria.name,
        contactNumber: maria.phone,
        brand: "Apple",
        model: "iPhone 11",
        reportedFailure: "Pantalla rota tras caída",
        totalValue: screenItem.salePrice,
        status: "in_repair",
        requiresAdvance: true,
        advanceValue: 300,
        receivedAt: new Date().toISOString().slice(0, 10),
        deviceOff: false,
        hasWarranty: false,
        hasExtendedWarranty: false,
      },
      [{ inventoryItemId: screenItem.id, quantity: 1, unitPrice: screenItem.salePrice }],
      [screenRepair.id],
    );
    await repairNoteService.create(
      {
        tenantId,
        localId: local.id,
        customerId: carlos.id,
        customerName: carlos.name,
        contactNumber: carlos.phone,
        brand: "Samsung",
        model: "Galaxy A52",
        reportedFailure: "Batería se agota en minutos",
        totalValue: batteryItem.salePrice,
        status: "received",
        requiresAdvance: false,
        receivedAt: new Date().toISOString().slice(0, 10),
        deviceOff: false,
        hasWarranty: false,
        hasExtendedWarranty: false,
      },
      [{ inventoryItemId: batteryItem.id, quantity: 1, unitPrice: batteryItem.salePrice }],
      [batteryRepair.id],
    );

    const cashService = new CashService(
      new CashSessionDao(AppDataSource.getRepository(CashSession)),
      new CashMovementDao(AppDataSource.getRepository(CashMovement)),
      localService,
      new UserDao(AppDataSource.getRepository(User)),
    );
    const session = await cashService.openSession(local.id, 500);
    await cashService.registerMovement({
      cashSessionId: session.id,
      type: "income",
      method: "efectivo",
      amount: 300,
      note: "Anticipo — orden de María Fernández",
      relatedEntityType: "repair_note",
    });

    console.log("Taller demo sembrado: 2 clientes, 4 items de inventario, 2 órdenes, 1 sesión de caja.");
  });
}

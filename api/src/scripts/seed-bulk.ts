import "reflect-metadata";
import { hash } from "bcryptjs";
import AppDataSource from "../core/config/data-source.js";
import { runWithTenant, allowSystemScope } from "../core/tenancy/tenant-context.js";
import { Tenant } from "../core/tenancy/entities/tenant.entity.js";
import { Customer } from "../commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../commerce/customers/daos/customer.dao.js";
import { ServiceType } from "../commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../commerce/service-types/daos/service-type.dao.js";
import { Local } from "../app_platform/local/entities/local.entity.js";
import { LocalDao } from "../app_platform/local/daos/local.dao.js";
import { LocalService } from "../app_platform/local/services/local.service.js";
import { InventoryItem } from "../commerce/inventory/entities/inventory-item.entity.js";
import { InventoryItemDao } from "../commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovement } from "../commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryMovementDao } from "../commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryService } from "../commerce/inventory/services/inventory.service.js";
import { InventoryReservation } from "../commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../commerce/inventory/daos/inventory-reservation.dao.js";
import { InventoryReservationService } from "../commerce/inventory/services/inventory-reservation.service.js";
import { RepairNote } from "../commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteDao } from "../commerce/repair-notes/daos/repair-note.dao.js";
import { RepairNoteItem } from "../commerce/repair-notes/entities/repair-note-item.entity.js";
import { RepairNoteItemDao } from "../commerce/repair-notes/daos/repair-note-item.dao.js";
import { RepairNoteServiceType } from "../commerce/repair-notes/entities/repair-note-service-type.entity.js";
import { RepairNoteServiceTypeDao } from "../commerce/repair-notes/daos/repair-note-service-type.dao.js";
import { RepairNoteService } from "../commerce/repair-notes/services/repair-note.service.js";
import type { WhatsappSendService } from "../messaging/whatsapp-official/services/whatsapp-send.service.js";
import { CashSession } from "../commerce/cash/entities/cash-session.entity.js";
import { CashSessionDao } from "../commerce/cash/daos/cash-session.dao.js";
import { CashMovement } from "../commerce/cash/entities/cash-movement.entity.js";
import { CashMovementDao } from "../commerce/cash/daos/cash-movement.dao.js";
import { CashService } from "../commerce/cash/services/cash.service.js";
import { User } from "../identity/auth/entities/user.entity.js";
import { UserDao } from "../identity/auth/daos/user.dao.js";
import { Supplier } from "../commerce/suppliers/entities/supplier.entity.js";
import { SupplierDao } from "../commerce/suppliers/daos/supplier.dao.js";
import { PriceListItem } from "../commerce/price-list/entities/price-list-item.entity.js";
import { PriceListDao } from "../commerce/price-list/daos/price-list.dao.js";
import { Quote } from "../commerce/quotes/entities/quote.entity.js";
import { QuoteDao } from "../commerce/quotes/daos/quote.dao.js";
import { QuoteItem } from "../commerce/quotes/entities/quote-item.entity.js";
import { QuoteItemDao } from "../commerce/quotes/daos/quote-item.dao.js";
import { QuoteService } from "../commerce/quotes/services/quote.service.js";
import { MessageTemplate } from "../messaging/message-templates/entities/message-template.entity.js";
import { MessageTemplateDao } from "../messaging/message-templates/daos/message-template.dao.js";
import { Branch } from "../identity/branches/entities/branch.entity.js";
import { BranchDao } from "../identity/branches/daos/branch.dao.js";
import { Layaway } from "../commerce/customers/entities/layaway.entity.js";
import { LayawayDao } from "../commerce/customers/daos/layaway.dao.js";
import { LayawayItem } from "../commerce/customers/entities/layaway-item.entity.js";
import { LayawayItemDao } from "../commerce/customers/daos/layaway-item.dao.js";
import { LayawayService } from "../commerce/customers/services/layaway.service.js";

// Script manual (pnpm seed:bulk), nunca enganchado al boot del server.
// Genera volumen alto en cada modulo con tabla (suplidores, clientes,
// inventario, lista de precios, notas, cotizaciones, plantillas, sucursales,
// usuarios, apartados) para validar visualmente paginas/tablas con muchos
// elementos -- no idempotente a proposito, cada corrida agrega mas filas.
const BRANDS = ["Apple", "Samsung", "Xiaomi", "Motorola", "Huawei", "OnePlus"];
const MODELS = ["iPhone 12", "iPhone 13", "Galaxy A54", "Galaxy S22", "Redmi Note 12", "Moto G84", "Mate 50", "Nord 3"];
const FAILURES = [
  "Pantalla rota tras caída",
  "No enciende",
  "Batería se agota en minutos",
  "No carga",
  "Micrófono no funciona",
  "Cámara trasera borrosa",
  "Se moja y no prende",
  "Botón de encendido dañado",
];
const STATUSES = ["received", "in_repair", "done", "delivered", "cancelled"] as const;
const PART_NAMES = [
  "Pantalla", "Batería", "Micrófono", "Cámara trasera", "Cámara frontal", "Bocina",
  "Puerto de carga", "Botón de encendido", "Flex de carga", "Táctil",
];
const ACCESSORY_NAMES = [
  "Funda silicón", "Mica templada", "Cable USB-C", "Cable Lightning", "Cargador 20W",
  "Audífonos alámbricos", "Power bank 10000mAh", "Soporte para auto",
];

async function seedBulk(tenantId: string): Promise<void> {
  await runWithTenant(tenantId, async () => {
    const localDao = new LocalDao(AppDataSource.getRepository(Local));
    const localService = new LocalService(localDao);
    const local = await localService.getConfig();

    // --- Suppliers ---
    const supplierDao = new SupplierDao(AppDataSource.getRepository(Supplier));
    const suppliers: Supplier[] = [];
    for (let i = 1; i <= 30; i++) {
      suppliers.push(await supplierDao.create({ name: `Proveedor Demo ${i}`, phone: `55${(10000000 + i).toString()}` }));
    }

    // --- Customers ---
    const customerDao = new CustomerDao(AppDataSource.getRepository(Customer));
    const customers: Customer[] = [];
    const firstNames = ["Ana", "Luis", "Jorge", "Paola", "Sofía", "Diego", "Valeria", "Hugo", "Renata", "Iván"];
    const lastNames = ["García", "Martínez", "López", "Hernández", "Pérez", "Sánchez", "Ramírez", "Flores", "Cruz", "Morales"];
    for (let i = 1; i <= 50; i++) {
      const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
      customers.push(await customerDao.create({ name, phone: `556${(1000000 + i).toString()}` }));
    }

    // --- Inventory items (+ initial stock) ---
    const inventoryService = new InventoryService(
      new InventoryItemDao(AppDataSource.getRepository(InventoryItem)),
      new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement)),
      new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation)),
      supplierDao,
    );
    const inventoryReservationService = new InventoryReservationService(
      new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation)),
      inventoryService,
    );
    const inventoryItems: InventoryItem[] = [];
    for (let i = 1; i <= 25; i++) {
      const item = await inventoryService.create({
        localId: local.id,
        name: `${PART_NAMES[i % PART_NAMES.length]} genérico ${i}`,
        sku: null,
        kind: "part",
        costPrice: 100 + i * 15,
        salePrice: 200 + i * 25,
        minStock: 2,
      });
      await inventoryService.registerMovement({
        inventoryItemId: item.id,
        type: "in",
        quantity: 50,
        reason: "Carga demo masiva",
      });
      inventoryItems.push(item);
    }
    for (let i = 1; i <= 15; i++) {
      const item = await inventoryService.create({
        localId: local.id,
        name: `${ACCESSORY_NAMES[i % ACCESSORY_NAMES.length]} demo ${i}`,
        sku: null,
        kind: "accessory",
        costPrice: 20 + i * 5,
        salePrice: 50 + i * 10,
        minStock: 5,
      });
      await inventoryService.registerMovement({
        inventoryItemId: item.id,
        type: "in",
        quantity: 50,
        reason: "Carga demo masiva",
      });
      inventoryItems.push(item);
    }

    // --- Price list ---
    const priceListDao = new PriceListDao(AppDataSource.getRepository(PriceListItem));
    for (let i = 1; i <= 50; i++) {
      await priceListDao.create({
        brand: BRANDS[i % BRANDS.length],
        model: `${MODELS[i % MODELS.length]} (${i})`,
        price: 300 + i * 20,
        supplierId: suppliers[i % suppliers.length].id,
      });
    }

    // --- Repair notes ---
    const serviceTypeDao = new ServiceTypeDao(AppDataSource.getRepository(ServiceType));
    const serviceTypes = await serviceTypeDao.findAll();
    const repairNoteService = new RepairNoteService(
      new RepairNoteDao(AppDataSource.getRepository(RepairNote)),
      localService,
      new RepairNoteItemDao(AppDataSource.getRepository(RepairNoteItem)),
      inventoryService,
      new RepairNoteServiceTypeDao(AppDataSource.getRepository(RepairNoteServiceType)),
      serviceTypeDao,
      { notifyOrderReady: async () => null } as unknown as WhatsappSendService,
      inventoryReservationService,
    );
    for (let i = 1; i <= 40; i++) {
      const customer = customers[i % customers.length];
      const item = inventoryItems[i % inventoryItems.length];
      const status = STATUSES[i % STATUSES.length];
      await repairNoteService.create(
        {
          localId: local.id,
          customerId: customer.id,
          customerName: customer.name,
          contactNumber: customer.phone,
          brand: BRANDS[i % BRANDS.length],
          model: MODELS[i % MODELS.length],
          reportedFailure: FAILURES[i % FAILURES.length],
          totalValue: item.salePrice,
          status,
          requiresAdvance: i % 3 === 0,
          advanceValue: i % 3 === 0 ? Math.round(Number(item.salePrice) * 0.3) : undefined,
          receivedAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
          deviceOff: i % 5 === 0,
          hasWarranty: i % 4 === 0,
          hasExtendedWarranty: false,
        },
        [{ inventoryItemId: item.id, quantity: 1, unitPrice: item.salePrice }],
        serviceTypes.length ? [serviceTypes[i % serviceTypes.length].id] : [],
      );
    }

    // --- Quotes ---
    const quoteService = new QuoteService(
      new QuoteDao(AppDataSource.getRepository(Quote)),
      new QuoteItemDao(AppDataSource.getRepository(QuoteItem)),
    );
    for (let i = 1; i <= 25; i++) {
      const customer = customers[(i * 2) % customers.length];
      await quoteService.create(
        {
          localId: local.id,
          customerId: customer.id,
          customerName: customer.name,
          contactNumber: customer.phone,
          validUntil: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
          createdByEmployeeId: null,
        },
        [
          { description: `Reparación ${PART_NAMES[i % PART_NAMES.length]}`, quantity: 1, unitPrice: 300 + i * 10 },
          { description: "Mano de obra", quantity: 1, unitPrice: 150 },
        ],
      );
    }

    // --- Message templates ---
    const messageTemplateDao = new MessageTemplateDao(AppDataSource.getRepository(MessageTemplate));
    for (let i = 1; i <= 15; i++) {
      await messageTemplateDao.create({
        key: `plantilla_demo_${i}`,
        text: `Hola {{nombre}}, este es el mensaje demo número ${i} para tu reparación.`,
        description: `Plantilla demo ${i}`,
      });
    }

    // --- Branches ---
    const branchDao = new BranchDao(AppDataSource.getRepository(Branch));
    for (let i = 1; i <= 10; i++) {
      await branchDao.create({
        name: `Sucursal Demo ${i}`,
        address: `Av. Siempre Viva #${100 + i}`,
        phone: `55${(20000000 + i).toString()}`,
        isActive: i % 4 !== 0,
      });
    }

    // --- Users ---
    const userDao = new UserDao(AppDataSource.getRepository(User));
    const roles = ["technician", "cashier", "employee", "admin"] as const;
    for (let i = 1; i <= 10; i++) {
      const hashedPassword = await hash("Demo1234!", 10);
      await userDao.create({
        firstName: `Usuario${i}`,
        lastName: "Demo",
        email: `demo.usuario${i}@local.test`,
        password: hashedPassword,
        role: roles[i % roles.length],
        isPlatformAdmin: false,
      });
    }

    // --- Layaways (abre su propia sesión de caja) ---
    const cashService = new CashService(
      new CashSessionDao(AppDataSource.getRepository(CashSession)),
      new CashMovementDao(AppDataSource.getRepository(CashMovement)),
      localService,
      userDao,
    );
    const layawaySession = (await cashService.getOpenSession(local.id)) ?? (await cashService.openSession(local.id, 1000));
    const layawayService = new LayawayService(
      new LayawayDao(AppDataSource.getRepository(Layaway)),
      new LayawayItemDao(AppDataSource.getRepository(LayawayItem)),
      customerDao,
      new CashSessionDao(AppDataSource.getRepository(CashSession)),
      new InventoryItemDao(AppDataSource.getRepository(InventoryItem)),
      inventoryReservationService,
    );
    for (let i = 1; i <= 15; i++) {
      const customer = customers[(i * 5) % customers.length];
      const item = inventoryItems[(i * 2) % inventoryItems.length];
      await layawayService.open({
        customerId: customer.id,
        cashSessionId: layawaySession.id,
        depositAmount: Math.round(Number(item.salePrice) * 0.3),
        depositMethod: "efectivo",
        expiresAt: new Date(Date.now() + (i + 5) * 86400000).toISOString().slice(0, 10),
        items: [{ inventoryItemId: item.id, quantity: 1, unitPrice: item.salePrice }],
      });
    }

    console.log(
      "Seed bulk listo: 30 proveedores, 50 clientes, 40 items de inventario, 50 precios, 40 notas, 25 cotizaciones, 15 plantillas, 10 sucursales, 10 usuarios, 15 apartados.",
    );
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
    console.error("No hay ningun tenant creado todavia -- registra uno primero, o pasa un id: pnpm seed:bulk <tenantId>");
    process.exitCode = 1;
    return AppDataSource.destroy();
  }

  await seedBulk(tenantId);
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error("Error sembrando datos masivos:", error);
  process.exitCode = 1;
});

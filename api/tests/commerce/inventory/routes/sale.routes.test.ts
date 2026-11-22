import "reflect-metadata";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../../../src/commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovementDao } from "../../../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryReservation } from "../../../../src/commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../../../../src/commerce/inventory/daos/inventory-reservation.dao.js";
import { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import { Sale } from "../../../../src/commerce/inventory/entities/sale.entity.js";
import { SaleDao } from "../../../../src/commerce/inventory/daos/sale.dao.js";
import { SaleItem } from "../../../../src/commerce/inventory/entities/sale-item.entity.js";
import { SaleItemDao } from "../../../../src/commerce/inventory/daos/sale-item.dao.js";
import { SaleService } from "../../../../src/commerce/inventory/services/sale.service.js";
import { SalePayment } from "../../../../src/commerce/payments/entities/sale-payment.entity.js";
import { SalePaymentDao } from "../../../../src/commerce/payments/daos/sale-payment.dao.js";
import { SaleController } from "../../../../src/commerce/inventory/controllers/sale.controller.js";
import { createSaleRouter } from "../../../../src/commerce/inventory/routes/sale.routes.js";
import { CashSession } from "../../../../src/commerce/cash/entities/cash-session.entity.js";
import { CashSessionDao } from "../../../../src/commerce/cash/daos/cash-session.dao.js";
import { CashMovement } from "../../../../src/commerce/cash/entities/cash-movement.entity.js";
import { CashMovementDao } from "../../../../src/commerce/cash/daos/cash-movement.dao.js";
import { CashService } from "../../../../src/commerce/cash/services/cash.service.js";
import { ServiceType } from "../../../../src/commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import { Customer } from "../../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../../../../src/commerce/customers/daos/customer.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { User, type UserRole } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { BranchAccessService } from "../../../../src/identity/branches/services/branch-access.service.js";
import { BranchDao } from "../../../../src/identity/branches/daos/branch.dao.js";
import { Branch } from "../../../../src/identity/branches/entities/branch.entity.js";
import { setupStaff } from "../../../support/staff.js";
import { makeDiscountCapService, makeUserRoleDao } from "../../../support/authz-deps.js";

// Integration test contra Postgres real + el router real -- un técnico no
// opera el POS, igual criterio de módulo que cash.routes.ts.
describe("sale routes: permisos por rol (modulo POS)", () => {
  let app: express.Express;
  let cashService: CashService;
  let inventoryService: InventoryService;
  const tenantId = `${Date.now()}7`;

  // Sucursal real y un usuario por rol (el personal asignado a ella): ver tests/support/staff.ts.
  let branchId = "";
  let tokens: Record<string, string> = {};
  const tokenFor = (role: UserRole) => tokens[role];

  beforeAll(async () => {
    await AppDataSource.initialize();
    ({ branchId, tokens } = await setupStaff(AppDataSource, tenantId, ["owner", "cashier", "technician"]));

    const localService = new LocalService(new LocalDao(AppDataSource.getRepository(Local)));
    const cashSessionDao = new CashSessionDao(AppDataSource.getRepository(CashSession));
    cashService = new CashService(
      cashSessionDao,
      new CashMovementDao(AppDataSource.getRepository(CashMovement)),
      localService,
      new UserDao(AppDataSource.getRepository(User)), makeUserRoleDao(),
    );
    inventoryService = new InventoryService(
      new InventoryItemDao(AppDataSource.getRepository(InventoryItem)),
      new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement)),
      new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation)),
    );
    const serviceTypeDao = new ServiceTypeDao(AppDataSource.getRepository(ServiceType));
    const saleService = new SaleService(
      new SaleDao(AppDataSource.getRepository(Sale)),
      new SaleItemDao(AppDataSource.getRepository(SaleItem)),
      new SalePaymentDao(AppDataSource.getRepository(SalePayment)),
      inventoryService,
      localService,
      cashSessionDao,
      serviceTypeDao,
      new CustomerDao(AppDataSource.getRepository(Customer)), makeDiscountCapService(),
    );
    const controller = new SaleController(saleService, new BranchAccessService(new BranchDao(AppDataSource.getRepository(Branch))));

    app = express();
    app.use(express.json());
    app.use("/sales", createSaleRouter(controller));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("rejects a technician creating or reading sales (403)", async () => {
    const technicianToken = tokenFor("technician");

    const createRes = await request(app)
      .post("/sales")
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ localId: branchId, cashSessionId: "1", payments: [{ method: "efectivo", amount: 1 }], items: [] });
    expect(createRes.status).toBe(403);

    const readRes = await request(app).get("/sales").set("Authorization", `Bearer ${technicianToken}`);
    expect(readRes.status).toBe(403);
  });

  it("allows a cashier to sell with an open cash session", async () => {
    const cashierToken = tokenFor("cashier");

    const session = await runWithTenant(tenantId, () => cashService.openSession(branchId, 0));
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({
        localId: branchId,
        name: "Funda ruta",
        sku: "FUNDA-ROUTE",
        kind: "accessory",
        costPrice: 10,
        salePrice: 25,
        minStock: 0,
      }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 3 }),
    );

    const res = await request(app)
      .post("/sales")
      .set("Authorization", `Bearer ${cashierToken}`)
      .send({
        localId: branchId,
        cashSessionId: session.id,
        applyTax: true,
        // 25 subtotal + 16% de impuesto por defecto del tenant = 29.
        payments: [{ method: "efectivo", amount: 29 }],
        items: [{ lineType: "inventory_item", referenceId: item.id, quantity: 1, unitPrice: 25 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.saleNumber).toBeGreaterThan(0);
  });
});

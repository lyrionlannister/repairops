import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { User } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { generatePublicRef } from "../../../../src/commerce/repair-notes/utils/public-ref.js";
import { RepairNote } from "../../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteItem } from "../../../../src/commerce/repair-notes/entities/repair-note-item.entity.js";
import { RepairNoteDao } from "../../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import { RepairNoteItemDao } from "../../../../src/commerce/repair-notes/daos/repair-note-item.dao.js";
import { Sale } from "../../../../src/commerce/inventory/entities/sale.entity.js";
import { SaleItem } from "../../../../src/commerce/inventory/entities/sale-item.entity.js";
import { SaleDao } from "../../../../src/commerce/inventory/daos/sale.dao.js";
import { SaleItemDao } from "../../../../src/commerce/inventory/daos/sale-item.dao.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { RevenueAttributionSetting } from "../../../../src/commerce/revenue-attribution/entities/revenue-attribution-setting.entity.js";
import { RevenueAttributionSettingDao } from "../../../../src/commerce/revenue-attribution/daos/revenue-attribution-setting.dao.js";
import { RevenueAttributionService } from "../../../../src/commerce/revenue-attribution/services/revenue-attribution.service.js";
import { ServiceType } from "../../../../src/commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../../../../src/commerce/service-types/daos/service-type.dao.js";
import { RepairNoteServiceType } from "../../../../src/commerce/repair-notes/entities/repair-note-service-type.entity.js";
import { RepairNoteDevice } from "../../../../src/commerce/repair-notes/entities/repair-note-device.entity.js";
import { RepairNoteServiceTypeDao } from "../../../../src/commerce/repair-notes/daos/repair-note-service-type.dao.js";
import { ReportsService } from "../../../../src/reporting/reports/services/reports.service.js";
import { ReportsDao } from "../../../../src/reporting/reports/daos/reports.dao.js";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

const today = () => new Date().toISOString().split("T")[0];
// Ventana amplia para no depender de que el reloj del host coincida con el
// del contenedor de Postgres (default sin periodo usa "hoy" de cada uno).
const WIDE_PERIOD = { periodStart: "2000-01-01", periodEnd: "2099-12-31" };

describe("ReportsService", () => {
  let reportsService: ReportsService;
  let userDao: UserDao;
  let repairNoteDao: RepairNoteDao;
  let repairNoteItemDao: RepairNoteItemDao;
  let saleDao: SaleDao;
  let saleItemDao: SaleItemDao;
  let inventoryItemDao: InventoryItemDao;
  let revenueAttributionService: RevenueAttributionService;
  let serviceTypeDao: ServiceTypeDao;
  let repairNoteServiceTypeDao: RepairNoteServiceTypeDao;
  const tenantId = `${Date.now()}6`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    userDao = new UserDao(AppDataSource.getRepository(User));
    repairNoteDao = new RepairNoteDao(AppDataSource.getRepository(RepairNote));
    repairNoteItemDao = new RepairNoteItemDao(AppDataSource.getRepository(RepairNoteItem));
    saleDao = new SaleDao(AppDataSource.getRepository(Sale));
    saleItemDao = new SaleItemDao(AppDataSource.getRepository(SaleItem));
    inventoryItemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    revenueAttributionService = new RevenueAttributionService(
      new RevenueAttributionSettingDao(AppDataSource.getRepository(RevenueAttributionSetting)),
    );
    serviceTypeDao = new ServiceTypeDao(AppDataSource.getRepository(ServiceType));
    repairNoteServiceTypeDao = new RepairNoteServiceTypeDao(AppDataSource.getRepository(RepairNoteServiceType));
    reportsService = new ReportsService(
      new ReportsDao(AppDataSource.getRepository(RepairNote)),
      userDao,
      revenueAttributionService,
      new LocalService(new LocalDao(AppDataSource.getRepository(Local))),
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe("getEmployeePerformance", () => {
    it("attributes totalValue, margin or labor-only revenue depending on the configured basis", async () => {
      const basisTenant = `${tenantId}1`;

      const employee = await runWithTenant(basisTenant, () =>
        userDao.create({
          firstName: "Tech",
          lastName: "Uno",
          email: `tech.${basisTenant}@test.local`,
          password: "x",
          role: "employee",
          salaryAmount: 3000,
          payCycle: "monthly",
        } as Partial<User>),
      );

      const item = await runWithTenant(basisTenant, () =>
        inventoryItemDao.create({
          localId: "1",
          name: "Pantalla",
          kind: "part",
          costPrice: 10,
          salePrice: 20,
        } as Partial<InventoryItem>),
      );

      const note = await runWithTenant(basisTenant, () =>
        repairNoteDao.create({
          controlNumber: 1,
          customerName: "Cliente",
          totalValue: 500,
          receivedAt: today(),
          receivedTime: "12:00",
          assignedEmployeeId: employee.id,
          localId: "1",
          publicRef: generatePublicRef(),
        } as Partial<RepairNote>),
      );
      await runWithTenant(basisTenant, () =>
        repairNoteItemDao.create({
          repairNoteId: note.id,
          inventoryItemId: item.id,
          quantity: 2,
          unitPrice: 20,
        } as Partial<RepairNoteItem>),
      );

      const sale = await runWithTenant(basisTenant, () =>
        saleDao.create({
          localId: "1",
          saleNumber: 1,
          cashSessionId: "1",
          subtotal: 100,
          totalValue: 100,
          createdByEmployeeId: employee.id,
        } as Partial<Sale>),
      );
      await runWithTenant(basisTenant, () =>
        saleItemDao.create({
          saleId: sale.id,
          lineType: "inventory_item",
          referenceId: item.id,
          quantity: 1,
          unitPrice: 100,
        } as Partial<SaleItem>),
      );

      const getFor = async (basis: "total_value" | "margin" | "labor_only") => {
        await runWithTenant(basisTenant, () => revenueAttributionService.setBasis(basis));
        const report = await runWithTenant(basisTenant, () =>
          reportsService.getEmployeePerformance({ employeeId: employee.id, ...WIDE_PERIOD }),
        );
        return report.employees[0];
      };

      const totalValueResult = await getFor("total_value");
      expect(totalValueResult.attributedAmount).toBe(600); // 500 + 100
      expect(totalValueResult.repairNotesCount).toBe(1);
      expect(totalValueResult.salesCount).toBe(1);

      const marginResult = await getFor("margin");
      expect(marginResult.attributedAmount).toBe(570); // (500-20) + (100-10)

      const laborOnlyResult = await getFor("labor_only");
      expect(laborOnlyResult.attributedAmount).toBe(460); // (500-40) + (100-100)
    });

    it("excludes notes outside the period and prorates salary for a partial period", async () => {
      const periodTenant = `${tenantId}2`;

      const employee = await runWithTenant(periodTenant, () =>
        userDao.create({
          firstName: "Tech",
          lastName: "Dos",
          email: `tech.${periodTenant}@test.local`,
          password: "x",
          role: "employee",
          salaryAmount: 3000,
          payCycle: "monthly",
        } as Partial<User>),
      );

      await runWithTenant(periodTenant, () =>
        repairNoteDao.create({
          controlNumber: 1,
          customerName: "Dentro",
          totalValue: 200,
          receivedAt: "2026-01-10",
          receivedTime: "12:00",
          assignedEmployeeId: employee.id,
          localId: "1",
          publicRef: generatePublicRef(),
        } as Partial<RepairNote>),
      );
      await runWithTenant(periodTenant, () =>
        repairNoteDao.create({
          controlNumber: 2,
          customerName: "Fuera",
          totalValue: 9999,
          receivedAt: "2026-02-15",
          receivedTime: "12:00",
          assignedEmployeeId: employee.id,
          localId: "1",
          publicRef: generatePublicRef(),
        } as Partial<RepairNote>),
      );

      const report = await runWithTenant(periodTenant, () =>
        reportsService.getEmployeePerformance({
          employeeId: employee.id,
          periodStart: "2026-01-01",
          periodEnd: "2026-01-10",
        }),
      );

      expect(report.employees[0].attributedAmount).toBe(200);
      expect(report.employees[0].repairNotesCount).toBe(1);
      // 10 dias de 30 => salario prorrateado, nunca el mes completo.
      expect(report.employees[0].salaryAmount).toBe(1000);
    });
  });

  describe("getAccessorySales", () => {
    it("groups by item and computes total revenue and average ticket", async () => {
      const salesTenant = `${tenantId}3`;

      const itemA = await runWithTenant(salesTenant, () =>
        inventoryItemDao.create({ localId: "1", name: "Funda", kind: "accessory", costPrice: 5, salePrice: 15 } as Partial<InventoryItem>),
      );
      const itemB = await runWithTenant(salesTenant, () =>
        inventoryItemDao.create({ localId: "1", name: "Cable", kind: "accessory", costPrice: 3, salePrice: 10 } as Partial<InventoryItem>),
      );

      const saleA = await runWithTenant(salesTenant, () =>
        saleDao.create({ localId: "1", saleNumber: 1, cashSessionId: "1", subtotal: 30, totalValue: 30 } as Partial<Sale>),
      );
      await runWithTenant(salesTenant, () =>
        saleItemDao.create({
          saleId: saleA.id,
          lineType: "inventory_item",
          referenceId: itemA.id,
          quantity: 2,
          unitPrice: 15,
        } as Partial<SaleItem>),
      );

      const saleB = await runWithTenant(salesTenant, () =>
        saleDao.create({ localId: "1", saleNumber: 2, cashSessionId: "1", subtotal: 10, totalValue: 10 } as Partial<Sale>),
      );
      await runWithTenant(salesTenant, () =>
        saleItemDao.create({
          saleId: saleB.id,
          lineType: "inventory_item",
          referenceId: itemB.id,
          quantity: 1,
          unitPrice: 10,
        } as Partial<SaleItem>),
      );

      const report = await runWithTenant(salesTenant, () => reportsService.getAccessorySales(WIDE_PERIOD));

      expect(report.salesCount).toBe(2);
      expect(report.totalRevenue).toBe(40);
      expect(report.averageTicket).toBe(20);
      expect(report.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Funda", quantity: 2, revenue: 30 }),
          expect.objectContaining({ label: "Cable", quantity: 1, revenue: 10 }),
        ]),
      );
    });

    it("groups by day when groupBy=day", async () => {
      const dayTenant = `${tenantId}4`;
      const item = await runWithTenant(dayTenant, () =>
        inventoryItemDao.create({ localId: "1", name: "Mica", kind: "accessory", costPrice: 2, salePrice: 8 } as Partial<InventoryItem>),
      );
      const sale = await runWithTenant(dayTenant, () =>
        saleDao.create({ localId: "1", saleNumber: 1, cashSessionId: "1", subtotal: 8, totalValue: 8 } as Partial<Sale>),
      );
      await runWithTenant(dayTenant, () =>
        saleItemDao.create({
          saleId: sale.id,
          lineType: "inventory_item",
          referenceId: item.id,
          quantity: 1,
          unitPrice: 8,
        } as Partial<SaleItem>),
      );

      const report = await runWithTenant(dayTenant, () =>
        reportsService.getAccessorySales({ ...WIDE_PERIOD, groupBy: "day" }),
      );

      expect(report.data).toHaveLength(1);
      expect(report.data[0]?.key).toBe(new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }));
      expect(report.data[0]?.revenue).toBe(8);
    });
  });

  describe("getRepairNotesByType", () => {
    it("aggregates notes by service type and by status", async () => {
      const typeTenant = `${tenantId}5`;

      const repairType = await runWithTenant(typeTenant, () => serviceTypeDao.create({ name: "Reparación" }));
      const maintenanceType = await runWithTenant(typeTenant, () => serviceTypeDao.create({ name: "Mantenimiento" }));

      const noteA = await runWithTenant(typeTenant, () =>
        repairNoteDao.create({
          controlNumber: 1,
          customerName: "A",
          totalValue: 200,
          receivedAt: today(),
          receivedTime: "12:00",
          status: "received",
          localId: "1",
          publicRef: generatePublicRef(),
        } as Partial<RepairNote>),
      );
      const addDevice = (repairNoteId: string, position: number) =>
        AppDataSource.getRepository(RepairNoteDevice).save({
          tenantId: typeTenant,
          repairNoteId,
          position,
          brand: "Marca",
          model: "Modelo",
          reportedFailure: "Falla",
        });
      const deviceA = await addDevice(noteA.id, 0);
      await runWithTenant(typeTenant, () =>
        repairNoteServiceTypeDao.create({ repairNoteId: noteA.id, repairNoteDeviceId: deviceA.id, serviceTypeId: repairType.id }),
      );

      const noteB = await runWithTenant(typeTenant, () =>
        repairNoteDao.create({
          controlNumber: 2,
          customerName: "B",
          totalValue: 300,
          receivedAt: today(),
          receivedTime: "12:00",
          status: "done",
          localId: "1",
          publicRef: generatePublicRef(),
        } as Partial<RepairNote>),
      );
      const deviceB1 = await addDevice(noteB.id, 0);
      const deviceB2 = await addDevice(noteB.id, 1);
      await runWithTenant(typeTenant, () =>
        repairNoteServiceTypeDao.create({ repairNoteId: noteB.id, repairNoteDeviceId: deviceB1.id, serviceTypeId: repairType.id }),
      );
      await runWithTenant(typeTenant, () =>
        repairNoteServiceTypeDao.create({ repairNoteId: noteB.id, repairNoteDeviceId: deviceB2.id, serviceTypeId: repairType.id }),
      );
      await runWithTenant(typeTenant, () =>
        repairNoteServiceTypeDao.create({ repairNoteId: noteB.id, repairNoteDeviceId: deviceB2.id, serviceTypeId: maintenanceType.id }),
      );

      const report = await runWithTenant(typeTenant, () => reportsService.getRepairNotesByType(WIDE_PERIOD));

      expect(report.totalNotes).toBe(2);
      expect(report.totalRevenue).toBe(500);
      expect(report.byType.find((t) => t.type === repairType.id)).toEqual(
        expect.objectContaining({ label: "Reparación", count: 2, totalValue: 500 }),
      );
      expect(report.byType.find((t) => t.type === maintenanceType.id)).toEqual(
        expect.objectContaining({ label: "Mantenimiento", count: 1, totalValue: 300 }),
      );
      expect(report.byStatus).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: "received", count: 1, totalValue: 200 }),
          expect.objectContaining({ status: "done", count: 1, totalValue: 300 }),
        ]),
      );
    });
  });
});

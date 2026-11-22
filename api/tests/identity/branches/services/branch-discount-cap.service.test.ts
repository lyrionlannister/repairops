import "reflect-metadata";
import { Decimal } from "decimal.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";
import { DiscountCapError } from "../../../../src/identity/branches/services/branch-discount-cap.service.js";
import { makeDiscountCapService } from "../../../support/authz-deps.js";
import { setupStaff } from "../../../support/staff.js";

describe("BranchDiscountCapService", () => {
  const tenantId = `${Date.now()}21`;
  const otherTenantId = `${Date.now()}22`;
  let branchId = "";
  let foreignBranchId = "";
  let service: ReturnType<typeof makeDiscountCapService>;
  const inTenant = <T>(fn: () => Promise<T>) => runWithTenant(tenantId, fn);

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = makeDiscountCapService();
    ({ branchId } = await setupStaff(AppDataSource, tenantId, ["owner"]));
    ({ branchId: foreignBranchId } = await setupStaff(AppDataSource, otherTenantId, ["owner"]));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("sin tope fijado nadie da descuento; el dueño no tiene tope", async () => {
    expect((await inTenant(() => service.maxDiscountFor(branchId, ["cashier"])))?.toFixed(2)).toBe(
      "0.00",
    );
    expect(await inTenant(() => service.maxDiscountFor(branchId, ["owner"]))).toBeNull();
  });

  it("con varios roles vale el tope mayor", async () => {
    await inTenant(() =>
      service.replaceForBranch(branchId, [
        { role: "cashier", maxDiscountPercent: 10 },
        { role: "employee", maxDiscountPercent: "15.5" },
      ]),
    );
    const cap = await inTenant(() => service.maxDiscountFor(branchId, ["cashier", "employee"]));
    expect(cap?.equals(new Decimal("15.5"))).toBe(true);
    expect(
      (await inTenant(() => service.maxDiscountFor(branchId, ["technician"])))?.toFixed(2),
    ).toBe("0.00");
  });

  it("valida rango, roles repetidos y el dueño", async () => {
    await expect(
      inTenant(() =>
        service.replaceForBranch(branchId, [{ role: "cashier", maxDiscountPercent: 101 }]),
      ),
    ).rejects.toBeInstanceOf(DiscountCapError);
    await expect(
      inTenant(() =>
        service.replaceForBranch(branchId, [
          { role: "cashier", maxDiscountPercent: 5 },
          { role: "cashier", maxDiscountPercent: 6 },
        ]),
      ),
    ).rejects.toThrow("repetido");
    await expect(
      inTenant(() =>
        service.replaceForBranch(branchId, [{ role: "owner", maxDiscountPercent: 5 }]),
      ),
    ).rejects.toThrow("Rol inválido");
  });

  it("no toca sucursales de otro taller", async () => {
    expect(
      await inTenant(() =>
        service.replaceForBranch(foreignBranchId, [{ role: "cashier", maxDiscountPercent: 50 }]),
      ),
    ).toBeNull();
    expect(await inTenant(() => service.getForBranch(foreignBranchId))).toBeNull();
    expect(await runWithTenant(otherTenantId, () => service.getForBranch(foreignBranchId))).toEqual(
      [],
    );
  });
});

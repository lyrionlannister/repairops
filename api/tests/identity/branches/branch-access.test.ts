import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../src/core/config/data-source.js";
import { Branch } from "../../../src/identity/branches/entities/branch.entity.js";
import { UserBranch } from "../../../src/identity/branches/entities/user-branch.entity.js";
import { RepairNote } from "../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteDao } from "../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import { BranchDao } from "../../../src/identity/branches/daos/branch.dao.js";
import { UserBranchDao } from "../../../src/identity/branches/daos/user-branch.dao.js";
import { BranchAccessService } from "../../../src/identity/branches/services/branch-access.service.js";
import { BranchService } from "../../../src/identity/branches/services/branch.service.js";
import { BranchAssignmentError, UserBranchService } from "../../../src/identity/branches/services/user-branch.service.js";
import { BranchAccessError, getBranchScope, runWithTenant, type BranchScope } from "../../../src/core/tenancy/tenant-context.js";
import { tenantMiddleware } from "../../../src/core/tenancy/tenant.middleware.js";
import { generatePublicRef } from "../../../src/commerce/repair-notes/utils/public-ref.js";
import { setupStaff } from "../../support/staff.js";

// Integracion contra Postgres real: un tenant con dos sucursales (A y B), un owner y personal
// de cada sucursal. Otro tenant aparte para comprobar que sus sucursales nunca se aceptan.
describe("acceso por sucursal", () => {
  const tenantId = `${Date.now()}71`;
  const otherTenantId = `${Date.now()}72`;
  let branchA = "";
  let branchB = "";
  let foreignBranch = "";
  let cashierA = "";
  let ownerScope: BranchScope | null = null;
  let scopeA: BranchScope;
  let dao: RepairNoteDao;
  let access: BranchAccessService;
  let branchService: BranchService;
  let userBranchService: UserBranchService;
  let tokens: Record<string, string>;

  beforeAll(async () => {
    await AppDataSource.initialize();
    const first = await setupStaff(AppDataSource, tenantId, ["owner", "cashier"]);
    branchA = first.branchId;
    cashierA = first.userIds["cashier"] as string;
    tokens = first.tokens;
    [{ id: branchB }] = await AppDataSource.query(`INSERT INTO branches (tenant_id, nombre) VALUES ($1, 'B') RETURNING id::text AS id`, [tenantId]);
    foreignBranch = (await setupStaff(AppDataSource, otherTenantId, ["owner"])).branchId;
    scopeA = { readIds: [branchA], writeIds: [branchA], primaryId: branchA };

    dao = new RepairNoteDao(AppDataSource.getRepository(RepairNote));
    const branchDao = new BranchDao(AppDataSource.getRepository(Branch));
    access = new BranchAccessService(branchDao);
    branchService = new BranchService(branchDao);
    userBranchService = new UserBranchService(new UserBranchDao(AppDataSource.getRepository(UserBranch)), branchDao);

    for (const [index, localId] of [branchA, branchB].entries()) {
      await runWithTenant(tenantId, () =>
        dao.create({
          localId,
          controlNumber: index + 1,
          customerName: `Cliente ${index}`,
          brand: "A",
          model: "B",
          reportedFailure: "x",
          receivedAt: "2026-01-01",
          publicRef: generatePublicRef(),
        } as Partial<RepairNote>),
      );
    }
  });

  afterAll(async () => {
    await AppDataSource.query(`DELETE FROM tenants WHERE id = ANY($1::bigint[])`, [[tenantId, otherTenantId]]);
    await AppDataSource.destroy();
  });

  describe("DAO con alcance", () => {
    it("el owner (sin alcance) ve las notas de todas las sucursales", async () => {
      const notes = await runWithTenant(tenantId, () => dao.findAllOrdered(), ownerScope);
      expect(notes.map((n) => String(n.localId)).sort()).toEqual([branchA, branchB].sort());
    });

    it("el personal solo ve su sucursal principal y no lee por id una nota de otra", async () => {
      const notes = await runWithTenant(tenantId, () => dao.findAllOrdered(), scopeA);
      expect(notes.map((n) => String(n.localId))).toEqual([branchA]);

      const all = await runWithTenant(tenantId, () => dao.findAllOrdered(), ownerScope);
      const noteB = all.find((n) => String(n.localId) === branchB)!;
      expect(await runWithTenant(tenantId, () => dao.findById(noteB.id), scopeA)).toBeNull();
      expect(await runWithTenant(tenantId, () => dao.findById(noteB.id), ownerScope)).not.toBeNull();
    });

    it("el personal no escribe en otra sucursal, y sin sucursal usa su principal", async () => {
      const base = { controlNumber: 99, customerName: "X", brand: "A", model: "B", reportedFailure: "x", receivedAt: "2026-01-01", publicRef: generatePublicRef() };
      await expect(runWithTenant(tenantId, () => dao.create({ ...base, localId: branchB } as Partial<RepairNote>), scopeA)).rejects.toBeInstanceOf(BranchAccessError);
      const created = await runWithTenant(tenantId, () => dao.create({ ...base, controlNumber: 100, publicRef: generatePublicRef() } as Partial<RepairNote>), scopeA);
      expect(String(created.localId)).toBe(branchA);
    });

    it("sin sucursales asignadas no ve nada", async () => {
      const none: BranchScope = { readIds: [], writeIds: [], primaryId: null };
      expect(await runWithTenant(tenantId, () => dao.findAllOrdered(), none)).toEqual([]);
    });
  });

  describe("BranchAccessService", () => {
    it("owner: sin branchId son todas; con uno, una del tenant; una ajena se rechaza", async () => {
      expect(await runWithTenant(tenantId, () => access.resolveReadBranch(undefined), ownerScope)).toBeNull();
      expect(await runWithTenant(tenantId, () => access.resolveReadBranch("all"), ownerScope)).toBeNull();
      expect(await runWithTenant(tenantId, () => access.resolveReadBranch(branchB), ownerScope)).toBe(branchB);
      await expect(runWithTenant(tenantId, () => access.resolveReadBranch(foreignBranch), ownerScope)).rejects.toBeInstanceOf(BranchAccessError);
      await expect(runWithTenant(tenantId, () => access.resolveReadBranch("999999999"), ownerScope)).rejects.toBeInstanceOf(BranchAccessError);
      await expect(runWithTenant(tenantId, () => access.resolveWriteBranch(undefined), ownerScope)).rejects.toBeInstanceOf(BranchAccessError);
    });

    it("owner no escribe en una sucursal desactivada", async () => {
      await AppDataSource.query(`UPDATE branches SET activa = false WHERE id = $1`, [branchB]);
      await expect(runWithTenant(tenantId, () => access.resolveWriteBranch(branchB), ownerScope)).rejects.toThrow("desactivada");
      await AppDataSource.query(`UPDATE branches SET activa = true WHERE id = $1`, [branchB]);
    });

    it("personal: su principal por defecto; nunca todas ni otra sucursal", async () => {
      expect(await runWithTenant(tenantId, () => access.resolveReadBranch(undefined), scopeA)).toBe(branchA);
      expect(await runWithTenant(tenantId, () => access.resolveWriteBranch(undefined), scopeA)).toBe(branchA);
      await expect(runWithTenant(tenantId, () => access.resolveReadBranch("all"), scopeA)).rejects.toBeInstanceOf(BranchAccessError);
      await expect(runWithTenant(tenantId, () => access.resolveReadBranch(branchB), scopeA)).rejects.toBeInstanceOf(BranchAccessError);
      await expect(runWithTenant(tenantId, () => access.resolveWriteBranch(branchB), scopeA)).rejects.toBeInstanceOf(BranchAccessError);
    });
  });

  describe("GET /branches", () => {
    it("el owner recibe todas; el personal solo las suyas, con la principal marcada", async () => {
      const owner = await runWithTenant(tenantId, () => branchService.getAll(), ownerScope);
      expect(owner.map((b) => String(b.id)).sort()).toEqual([branchA, branchB].sort());
      const staff = await runWithTenant(tenantId, () => branchService.getAll(), scopeA);
      expect(staff.map((b) => [String(b.id), b.isPrimary])).toEqual([[branchA, true]]);
    });
  });

  describe("sucursales de un usuario", () => {
    it("el personal necesita al menos una sucursal, del tenant, y una principal entre ellas", async () => {
      const run = <T>(fn: () => Promise<T>) => runWithTenant(tenantId, fn, ownerScope);
      await expect(run(() => userBranchService.normalize("cashier", [], undefined))).rejects.toBeInstanceOf(BranchAssignmentError);
      await expect(run(() => userBranchService.normalize("cashier", [foreignBranch], undefined))).rejects.toThrow("no existe");
      await expect(run(() => userBranchService.normalize("cashier", [branchA], branchB))).rejects.toThrow("principal");
      expect(await run(() => userBranchService.normalize("cashier", [branchA, branchB], undefined))).toEqual({ branchIds: [branchA, branchB], primaryBranchId: branchA });
      expect(await run(() => userBranchService.normalize("owner", [branchA], branchA))).toEqual({ branchIds: [], primaryBranchId: null });
    });

    it("reemplazar deja una sola principal y se lee de vuelta", async () => {
      await runWithTenant(tenantId, () => userBranchService.assign(cashierA, { branchIds: [branchA, branchB], primaryBranchId: branchB }), ownerScope);
      const map = await runWithTenant(tenantId, () => userBranchService.getAssignments(), ownerScope);
      expect(map.get(cashierA)).toEqual({ branchIds: expect.arrayContaining([branchA, branchB]), primaryBranchId: branchB });
      await runWithTenant(tenantId, () => userBranchService.assign(cashierA, { branchIds: [branchA], primaryBranchId: branchA }), ownerScope);
    });

    it("la base impide dos principales para el mismo usuario", async () => {
      await expect(
        AppDataSource.query(`INSERT INTO user_branches (tenant_id, user_id, branch_id, is_primary) VALUES ($1, $2, $3, true)`, [tenantId, cashierA, branchB]),
      ).rejects.toThrow(/UQ_user_branches_one_primary/);
    });
  });

  describe("tenantMiddleware", () => {
    async function scopeFor(role: "owner" | "cashier", id: string) {
      let captured: BranchScope | null | undefined;
      const next = vi.fn(() => {
        captured = getBranchScope();
      });
      await tenantMiddleware({ user: { id, email: "x", tenantId, role } } as never, {} as never, next);
      return { captured, next };
    }

    it("el owner no lleva alcance; el personal lleva sus sucursales activas", async () => {
      expect((await scopeFor("owner", "1")).captured).toBeNull();
      expect((await scopeFor("cashier", cashierA)).captured).toEqual({ readIds: [branchA], writeIds: [branchA], primaryId: branchA });
    });

    it("una sucursal desactivada deja de contar", async () => {
      await AppDataSource.query(`UPDATE branches SET activa = false WHERE id = $1`, [branchA]);
      expect((await scopeFor("cashier", cashierA)).captured).toEqual({ readIds: [], writeIds: [], primaryId: null });
      await AppDataSource.query(`UPDATE branches SET activa = true WHERE id = $1`, [branchA]);
    });
  });

  it("los tokens de prueba existen para cada rol", () => {
    expect(Object.keys(tokens).sort()).toEqual(["cashier", "owner"]);
  });
});

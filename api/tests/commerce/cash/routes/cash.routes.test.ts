import "reflect-metadata";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { requireJwtSecret } from "../../../../src/identity/auth/jwt-secret.js";
import { Local } from "../../../../src/app_platform/local/entities/local.entity.js";
import { LocalDao } from "../../../../src/app_platform/local/daos/local.dao.js";
import { LocalService } from "../../../../src/app_platform/local/services/local.service.js";
import { CashSession } from "../../../../src/commerce/cash/entities/cash-session.entity.js";
import { CashSessionDao } from "../../../../src/commerce/cash/daos/cash-session.dao.js";
import { CashMovement } from "../../../../src/commerce/cash/entities/cash-movement.entity.js";
import { CashMovementDao } from "../../../../src/commerce/cash/daos/cash-movement.dao.js";
import { CashService } from "../../../../src/commerce/cash/services/cash.service.js";
import { CashController } from "../../../../src/commerce/cash/controllers/cash.controller.js";
import { createCashRouter } from "../../../../src/commerce/cash/routes/cash.routes.js";
import { User, type UserRole } from "../../../../src/identity/auth/entities/user.entity.js";
import { UserDao } from "../../../../src/identity/auth/daos/user.dao.js";
import { BranchAccessService } from "../../../../src/identity/branches/services/branch-access.service.js";
import { BranchDao } from "../../../../src/identity/branches/daos/branch.dao.js";
import { Branch } from "../../../../src/identity/branches/entities/branch.entity.js";
import { setupStaff } from "../../../support/staff.js";

// Integration test contra Postgres real + el router real -- prueba el
// criterio de aceptacion de la Fase 1: un tecnico no puede abrir/cerrar
// caja ni registrar movimientos NI POR API, aunque la pantalla ya le
// oculte el item de menu "Caja" (ver sign-in-layout.tsx).
describe("cash routes: permisos por rol (modulo Caja)", () => {
  let app: express.Express;
  const tenantId = `${Date.now()}5`;
  let localId = "";

  // Sucursal real y un usuario por rol (el personal asignado a ella): ver tests/support/staff.ts.
  let tokens: Record<string, string> = {};
  const tokenFor = (role: UserRole) => tokens[role] as string;

  beforeAll(async () => {
    await AppDataSource.initialize();
    ({ branchId: localId, tokens } = await setupStaff(AppDataSource, tenantId, ["owner", "cashier", "technician"]));

    const localService = new LocalService(new LocalDao(AppDataSource.getRepository(Local)));
    const cashService = new CashService(
      new CashSessionDao(AppDataSource.getRepository(CashSession)),
      new CashMovementDao(AppDataSource.getRepository(CashMovement)),
      localService,
      new UserDao(AppDataSource.getRepository(User)),
    );
    const controller = new CashController(cashService, new BranchAccessService(new BranchDao(AppDataSource.getRepository(Branch))));

    app = express();
    app.use(express.json());
    app.use("/cash", createCashRouter(controller));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("rejects a technician opening a cash session (403), but allows read", async () => {
    const technicianToken = tokenFor("technician");

    const openRes = await request(app)
      .post("/cash/sessions")
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ localId, openingBalance: 100 });
    expect(openRes.status).toBe(403);

    const readRes = await request(app)
      .get("/cash/sessions")
      .set("Authorization", `Bearer ${technicianToken}`);
    expect(readRes.status).toBe(200);
  });

  it("allows a cashier to open a session, register a movement, and close it", async () => {
    const cashierToken = tokenFor("cashier");

    const openRes = await request(app)
      .post("/cash/sessions")
      .set("Authorization", `Bearer ${cashierToken}`)
      .send({ localId, openingBalance: 100 });
    expect(openRes.status).toBe(201);
    const sessionId = openRes.body.id;

    const movementRes = await request(app)
      .post(`/cash/sessions/${sessionId}/movements`)
      .set("Authorization", `Bearer ${cashierToken}`)
      .send({ type: "income", method: "efectivo", amount: 50, createdByEmployeeId: "1" });
    expect(movementRes.status).toBe(201);

    const closeRes = await request(app)
      .post(`/cash/sessions/${sessionId}/close`)
      .set("Authorization", `Bearer ${cashierToken}`)
      .send({ closingBalance: 150 });
    expect(closeRes.status).toBe(200);
  });

  it("rejects a technician registering a movement or closing an existing session", async () => {
    const cashierToken = tokenFor("cashier");
    const technicianToken = tokenFor("technician");

    const openRes = await request(app)
      .post("/cash/sessions")
      .set("Authorization", `Bearer ${cashierToken}`)
      .send({ localId, openingBalance: 100 });
    const sessionId = openRes.body.id;

    const movementRes = await request(app)
      .post(`/cash/sessions/${sessionId}/movements`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ type: "income", method: "efectivo", amount: 50 });
    expect(movementRes.status).toBe(403);

    const closeRes = await request(app)
      .post(`/cash/sessions/${sessionId}/close`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ closingBalance: 100 });
    expect(closeRes.status).toBe(403);
  });

  it("rejects requests without a valid token", async () => {
    const res = await request(app).post("/cash/sessions").send({ localId, openingBalance: 100 });
    expect(res.status).toBe(401);
  });
});

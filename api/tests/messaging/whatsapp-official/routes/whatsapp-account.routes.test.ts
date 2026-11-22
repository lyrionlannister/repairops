import "reflect-metadata";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import type { UserRole } from "../../../../src/identity/auth/entities/user.entity.js";
import { createWhatsappAccountRouter } from "../../../../src/messaging/whatsapp-official/routes/whatsapp-account.routes.js";
import type { WhatsappAccountController } from "../../../../src/messaging/whatsapp-official/controllers/whatsapp-account.controller.js";
import { setupStaff } from "../../../support/staff.js";

// GET /templates reconcilia con Meta y da de alta plantillas allá: el controller
// se reemplaza por stubs para probar solo el permiso, sin llamar a Meta.
describe("whatsapp-account routes: permisos", () => {
  let app: express.Express;
  const tenantId = `${Date.now()}83`;
  let tokens: Record<string, string> = {};
  const ok = vi.fn((_req: express.Request, res: express.Response) => {
    res.status(200).json({});
  });

  beforeAll(async () => {
    await AppDataSource.initialize();
    ({ tokens } = await setupStaff(AppDataSource, tenantId, ["owner", "cashier", "employee", "technician"]));
    const controller = { getStatus: ok, connectAccount: ok, getTemplates: ok } as unknown as WhatsappAccountController;
    app = express();
    app.use(express.json());
    app.use("/whatsapp-official", createWhatsappAccountRouter(controller));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it.each<UserRole>(["cashier", "employee", "technician"])("GET /templates rechaza a %s (403)", async (role) => {
    const res = await request(app).get("/whatsapp-official/templates").set("Authorization", `Bearer ${tokens[role]}`);
    expect(res.status).toBe(403);
  });

  it("GET /templates deja pasar al dueño", async () => {
    const res = await request(app).get("/whatsapp-official/templates").set("Authorization", `Bearer ${tokens["owner"]}`);
    expect(res.status).toBe(200);
  });
});

import "reflect-metadata";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../src/core/config/data-source.js";
import { createAutomationAdminRouter } from "../../../src/app_platform/automation/routes/automation-admin.routes.js";
import { AutomationAdminController } from "../../../src/app_platform/automation/controllers/automation-admin.controller.js";
import { createN8nIntegrationRouter } from "../../../src/app_platform/integrations/routes/n8n-integration.routes.js";
import { N8nIntegrationController } from "../../../src/app_platform/integrations/controllers/n8n-integration.controller.js";
import { setupStaff } from "../../support/staff.js";

describe("automation y n8n: solo admin de plataforma", () => {
  let app: express.Express;
  const tenantId = `${Date.now()}81`;
  const adminTenantId = `${Date.now()}82`;
  let tokens: Record<string, string> = {};
  let adminToken = "";

  beforeAll(async () => {
    await AppDataSource.initialize();
    ({ tokens } = await setupStaff(AppDataSource, tenantId, ["owner", "cashier"]));
    const admin = await setupStaff(AppDataSource, adminTenantId, ["owner"]);
    await AppDataSource.query(`UPDATE usuarios SET es_platform_admin = true WHERE id = $1`, [admin.userIds["owner"]]);
    adminToken = admin.tokens["owner"] as string;

    app = express();
    app.use(express.json());
    app.use("/automation", createAutomationAdminRouter(new AutomationAdminController()));
    app.use("/integrations/n8n", createN8nIntegrationRouter(new N8nIntegrationController()));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const paths = ["/automation/config", "/integrations/n8n"];

  it.each(paths)("%s rechaza al dueño y al cajero de un taller (403)", async (path) => {
    for (const role of ["owner", "cashier"]) {
      const read = await request(app).get(path).set("Authorization", `Bearer ${tokens[role]}`);
      expect(read.status).toBe(403);
      const write = await request(app).patch(path).set("Authorization", `Bearer ${tokens[role]}`).send({});
      expect(write.status).toBe(403);
    }
  });

  it.each(paths)("%s deja pasar al admin de plataforma", async (path) => {
    const res = await request(app).get(path).set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

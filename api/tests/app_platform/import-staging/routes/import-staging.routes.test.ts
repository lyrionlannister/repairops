import "reflect-metadata";
import express from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { TENANT_PUBLIC_ID_HEADER } from "../../../../src/messaging/n8n/n8n-public.routes.js";
import { ImportStagingController } from "../../../../src/app_platform/import-staging/controllers/import-staging.controller.js";
import { createImportStagingRouter } from "../../../../src/app_platform/import-staging/routes/import-staging.routes.js";
import type { ImportStagingService } from "../../../../src/app_platform/import-staging/services/import-staging.service.js";

// /callback y /progress son llamadas de n8n sin JWT: mismo gate que
// /api/v1/n8n/* (secreto compartido + header X-Tenant-Public-Id). El
// tenantId del body nunca se confía solo: debe coincidir con el tenant
// resuelto del header.
const INTERNAL_TOKEN = "test-internal-token";
const TENANT_PUBLIC_ID = "11111111-1111-4111-8111-111111111111";
const TENANT_INTERNAL_ID = "42";

const service = {
  applyCallback: vi.fn().mockResolvedValue(undefined),
  applyProgress: vi.fn().mockResolvedValue(undefined),
} as unknown as ImportStagingService;

describe("import-staging routes: /callback y /progress exigen tenant válido por header", () => {
  let app: express.Express;
  let previousToken: string | undefined;

  beforeAll(() => {
    previousToken = process.env.N8N_INTERNAL_TOKEN;
    process.env.N8N_INTERNAL_TOKEN = INTERNAL_TOKEN;
    // Solo el public_id conocido resuelve a un tenant; cualquier otro, no.
    vi.spyOn(AppDataSource, "query").mockImplementation(
      async (_sql: string, params?: unknown[]) => {
        const publicId = Array.isArray(params) ? params[0] : undefined;
        return publicId === TENANT_PUBLIC_ID ? [{ id: TENANT_INTERNAL_ID }] : [];
      },
    );
    app = express();
    app.use(express.json());
    app.use("/import-staging", createImportStagingRouter(new ImportStagingController(service)));
  });

  afterAll(() => {
    if (previousToken === undefined) delete process.env.N8N_INTERNAL_TOKEN;
    else process.env.N8N_INTERNAL_TOKEN = previousToken;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const callbackBody = (tenantId = TENANT_INTERNAL_ID) => ({
    tenantId,
    importId: "imp-1",
    rows: [{ brand: "Samsung", model: "A52", price: 1500 }],
  });
  const progressBody = (tenantId = TENANT_INTERNAL_ID) => ({
    tenantId,
    importId: "imp-1",
    chunksTotal: 3,
    itemsInChunk: 5,
  });
  const withSecret = (req: request.Test) => req.set("X-Internal-Token", INTERNAL_TOKEN);
  const withTenant = (req: request.Test) => req.set(TENANT_PUBLIC_ID_HEADER, TENANT_PUBLIC_ID);

  it("POST /callback sin secreto rechaza con 401", async () => {
    const res = await withTenant(request(app).post("/import-staging/callback")).send(
      callbackBody(),
    );
    expect(res.status).toBe(401);
    expect(service.applyCallback).not.toHaveBeenCalled();
  });

  it("POST /callback con secreto pero sin header de tenant rechaza con 401", async () => {
    const res = await withSecret(request(app).post("/import-staging/callback")).send(
      callbackBody(),
    );
    expect(res.status).toBe(401);
    expect(service.applyCallback).not.toHaveBeenCalled();
  });

  it("POST /callback con header de tenant inexistente rechaza con 401", async () => {
    const res = await withSecret(
      withTenant(request(app).post("/import-staging/callback")).set(
        TENANT_PUBLIC_ID_HEADER,
        "22222222-2222-4222-8222-222222222222",
      ),
    ).send(callbackBody());
    expect(res.status).toBe(401);
    expect(service.applyCallback).not.toHaveBeenCalled();
  });

  it("POST /callback con tenantId del body distinto al del header rechaza con 401", async () => {
    const res = await withSecret(withTenant(request(app).post("/import-staging/callback"))).send(
      callbackBody("99"),
    );
    expect(res.status).toBe(401);
    expect(service.applyCallback).not.toHaveBeenCalled();
  });

  it("POST /callback con secreto y tenant válido aplica el callback con el id interno", async () => {
    const res = await withSecret(withTenant(request(app).post("/import-staging/callback"))).send(
      callbackBody(),
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(service.applyCallback).toHaveBeenCalledWith(TENANT_INTERNAL_ID, "imp-1", {
      rows: [{ brand: "Samsung", model: "A52", price: 1500 }],
    });
  });

  it("POST /callback con error aplica el error al staging del tenant", async () => {
    const res = await withSecret(withTenant(request(app).post("/import-staging/callback"))).send({
      tenantId: TENANT_INTERNAL_ID,
      importId: "imp-1",
      error: "El archivo no se pudo leer",
    });
    expect(res.status).toBe(200);
    expect(service.applyCallback).toHaveBeenCalledWith(TENANT_INTERNAL_ID, "imp-1", {
      error: "El archivo no se pudo leer",
    });
  });

  it("POST /progress sin secreto rechaza con 401", async () => {
    const res = await withTenant(request(app).post("/import-staging/progress")).send(
      progressBody(),
    );
    expect(res.status).toBe(401);
    expect(service.applyProgress).not.toHaveBeenCalled();
  });

  it("POST /progress con secreto pero sin header de tenant rechaza con 401", async () => {
    const res = await withSecret(request(app).post("/import-staging/progress")).send(
      progressBody(),
    );
    expect(res.status).toBe(401);
    expect(service.applyProgress).not.toHaveBeenCalled();
  });

  it("POST /progress con tenantId del body distinto al del header rechaza con 401", async () => {
    const res = await withSecret(withTenant(request(app).post("/import-staging/progress"))).send(
      progressBody("99"),
    );
    expect(res.status).toBe(401);
    expect(service.applyProgress).not.toHaveBeenCalled();
  });

  it("POST /progress con secreto y tenant válido aplica el progreso", async () => {
    const res = await withSecret(withTenant(request(app).post("/import-staging/progress"))).send(
      progressBody(),
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(service.applyProgress).toHaveBeenCalledWith(TENANT_INTERNAL_ID, "imp-1", 3, 5);
  });
});

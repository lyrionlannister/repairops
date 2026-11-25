import "reflect-metadata";
import express from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import AppDataSource from "../../../src/core/config/data-source.js";
import { getCurrentTenantId } from "../../../src/core/tenancy/tenant-context.js";
import {
  TENANT_PUBLIC_ID_HEADER,
  createN8nPublicRouter,
} from "../../../src/messaging/n8n/n8n-public.routes.js";
import type { MessageTemplateDao } from "../../../src/messaging/message-templates/daos/message-template.dao.js";
import type { PriceListDao } from "../../../src/commerce/price-list/daos/price-list.dao.js";
import type { RepairNoteDao } from "../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import type { RepairNoteDeviceDao } from "../../../src/commerce/repair-notes/daos/repair-note-device.dao.js";

// El tenant ya no viaja en la URL: estas rutas se prueban con el header
// X-Tenant-Public-Id y la resolución contra la base mockeada (sin Postgres).
const INTERNAL_TOKEN = "test-internal-token";
const TENANT_PUBLIC_ID = "11111111-1111-4111-8111-111111111111";
const TENANT_INTERNAL_ID = "42";

let capturedTenantId: string | null = null;

const messageTemplateDao = {
  findByKey: vi.fn().mockImplementation((key: string) => {
    capturedTenantId = getCurrentTenantId();
    return Promise.resolve(key === "saludo" ? { key: "saludo", text: "Hola {{nombre}}" } : null);
  }),
} as unknown as MessageTemplateDao;

const priceListDao = {
  searchByModel: vi
    .fn()
    .mockResolvedValue([
      { brand: "Samsung", model: "A52", price: "1500.00", supplier: { name: "Proveedor Uno" } },
    ]),
} as unknown as PriceListDao;

const repairNoteDao = {
  findByControlNumber: vi.fn().mockImplementation((controlNumber: number) => {
    if (controlNumber !== 123) return Promise.resolve(null);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() - 10);
    return Promise.resolve({
      id: "note-1",
      hasWarranty: true,
      hasExtendedWarranty: false,
      extendedWarrantyDays: null,
      deliveryDate,
      customerName: "Ana",
    });
  }),
} as unknown as RepairNoteDao;

const repairNoteDeviceDao = {
  findByRepairNoteIds: vi
    .fn()
    .mockResolvedValue([
      { brand: "Samsung", model: "A52", reportedFailure: "Pantalla rota", deviceOff: false },
    ]),
} as unknown as RepairNoteDeviceDao;

describe("n8n public routes: tenant por header, no por URL", () => {
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
    app.use(
      "/n8n",
      createN8nPublicRouter(messageTemplateDao, priceListDao, repairNoteDao, repairNoteDeviceDao),
    );
  });

  afterAll(() => {
    if (previousToken === undefined) delete process.env.N8N_INTERNAL_TOKEN;
    else process.env.N8N_INTERNAL_TOKEN = previousToken;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    capturedTenantId = null;
    vi.clearAllMocks();
  });

  const authed = (req: request.Test) =>
    req.set("X-Internal-Token", INTERNAL_TOKEN).set(TENANT_PUBLIC_ID_HEADER, TENANT_PUBLIC_ID);

  it("sin secreto compartido rechaza con 401", async () => {
    const res = await request(app)
      .get("/n8n/message-templates/saludo")
      .set(TENANT_PUBLIC_ID_HEADER, TENANT_PUBLIC_ID);
    expect(res.status).toBe(401);
    expect(messageTemplateDao.findByKey).not.toHaveBeenCalled();
  });

  it("con secreto pero sin header de tenant rechaza con 401", async () => {
    const res = await request(app)
      .get("/n8n/message-templates/saludo")
      .set("X-Internal-Token", INTERNAL_TOKEN);
    expect(res.status).toBe(401);
    expect(messageTemplateDao.findByKey).not.toHaveBeenCalled();
  });

  it("con header de tenant inexistente rechaza con 401", async () => {
    const res = await request(app)
      .get("/n8n/message-templates/saludo")
      .set("X-Internal-Token", INTERNAL_TOKEN)
      .set(TENANT_PUBLIC_ID_HEADER, "22222222-2222-4222-8222-222222222222");
    expect(res.status).toBe(401);
    expect(messageTemplateDao.findByKey).not.toHaveBeenCalled();
  });

  it("con header de tenant que no es uuid rechaza con 401", async () => {
    const res = await request(app)
      .get("/n8n/message-templates/saludo")
      .set("X-Internal-Token", INTERNAL_TOKEN)
      .set(TENANT_PUBLIC_ID_HEADER, "42");
    expect(res.status).toBe(401);
    expect(messageTemplateDao.findByKey).not.toHaveBeenCalled();
  });

  it("con secreto y tenant válido resuelve el template y deja el tenant en contexto", async () => {
    const res = await authed(request(app).get("/n8n/message-templates/saludo"));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ key: "saludo", text: "Hola {{nombre}}" });
    expect(capturedTenantId).toBe(TENANT_INTERNAL_ID);
  });

  it("la ruta vieja con :tenantId ya no existe (404)", async () => {
    const res = await authed(request(app).get("/n8n/42/message-templates/saludo"));
    expect(res.status).toBe(404);
  });

  it("GET /products/search exige el parámetro model", async () => {
    const res = await authed(request(app).get("/n8n/products/search"));
    expect(res.status).toBe(400);
  });

  it("GET /products/search devuelve los productos del tenant del header", async () => {
    const res = await authed(request(app).get("/n8n/products/search").query({ model: "A52" }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { brand: "Samsung", model: "A52", price: 1500, supplier: "Proveedor Uno" },
    ]);
  });

  it("GET /repair-notes/:controlNumber con número inválido responde 400", async () => {
    const res = await authed(request(app).get("/n8n/repair-notes/abc"));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Número de nota inválido", exists: false });
  });

  it("GET /repair-notes/:controlNumber inexistente responde exists:false", async () => {
    const res = await authed(request(app).get("/n8n/repair-notes/999"));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: false });
  });

  it("GET /repair-notes/:controlNumber existente responde con garantía vigente", async () => {
    const res = await authed(request(app).get("/n8n/repair-notes/123"));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      exists: true,
      hasWarranty: true,
      isInWarrantyRange: true,
      customerName: "Ana",
      brand: "Samsung",
      model: "A52",
    });
  });
});

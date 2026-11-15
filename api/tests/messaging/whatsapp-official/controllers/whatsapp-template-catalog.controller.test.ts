import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { WhatsappTemplateCatalogController } from "../../../../src/messaging/whatsapp-official/controllers/whatsapp-template-catalog.controller.js";
import {
  WhatsappTemplateCatalogService,
  WhatsappTemplateCatalogConflictError,
} from "../../../../src/messaging/whatsapp-official/services/whatsapp-template-catalog.service.js";
import type { WhatsappTemplateCatalogEntry } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-catalog-entry.entity.js";
import { WhatsappGraphApiError } from "../../../../src/messaging/whatsapp-official/clients/whatsapp-graph.client.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn(), send: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
}

function makeReq(body: unknown = {}, params: Record<string, string> = {}): Request {
  return { body, params } as unknown as Request;
}

function makeService() {
  return {
    listForTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listSystem: vi.fn(),
    createSystem: vi.fn(),
    updateSystem: vi.fn(),
    deleteSystem: vi.fn(),
  } as unknown as WhatsappTemplateCatalogService;
}

const validCreateBody = {
  key: "promo_verano",
  metaName: "promo_verano",
  category: "MARKETING",
  language: "es_MX",
  text: "Hola {{nombre}}",
  variables: ["nombre"],
};

describe("WhatsappTemplateCatalogController -- empresa", () => {
  it("create returns 400 with validation errors when the body is incomplete", async () => {
    const service = makeService();
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.create(makeReq({ key: "x" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it("create returns 400 with the conflict message when the service rejects a duplicate", async () => {
    const service = makeService();
    vi.mocked(service.create).mockRejectedValue(new WhatsappTemplateCatalogConflictError("Ya existe"));
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.create(makeReq(validCreateBody), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Ya existe" });
  });

  it("create returns 201 with the new entry on success", async () => {
    const service = makeService();
    vi.mocked(service.create).mockResolvedValue(mockEntity<WhatsappTemplateCatalogEntry>({ id: "entry-1" }));
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.create(makeReq(validCreateBody), res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("update returns 404 when the entry doesn't belong to this tenant", async () => {
    const service = makeService();
    vi.mocked(service.update).mockResolvedValue(null);
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.update(makeReq({ text: "nuevo" }, { id: "entry-1" }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("update returns 400 with Meta's message when Meta rejects the edit", async () => {
    const service = makeService();
    vi.mocked(service.update).mockRejectedValue(new WhatsappGraphApiError("Rechazada", 400, {}));
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.update(makeReq({ text: "nuevo" }, { id: "entry-1" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Rechazada" });
  });

  it("remove returns 204 when the service deletes the entry", async () => {
    const service = makeService();
    vi.mocked(service.delete).mockResolvedValue(true);
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.remove(makeReq({}, { id: "entry-1" }), res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("remove returns 404 when the entry doesn't exist for this tenant", async () => {
    const service = makeService();
    vi.mocked(service.delete).mockResolvedValue(false);
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.remove(makeReq({}, { id: "entry-1" }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("WhatsappTemplateCatalogController -- sistema", () => {
  it("createSystem returns 400 with the conflict message when the service rejects a duplicate", async () => {
    const service = makeService();
    vi.mocked(service.createSystem).mockRejectedValue(new WhatsappTemplateCatalogConflictError("Ya existe"));
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.createSystem(makeReq(validCreateBody), res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("listSystem returns 200 with the system entries", async () => {
    const service = makeService();
    vi.mocked(service.listSystem).mockResolvedValue([mockEntity<WhatsappTemplateCatalogEntry>({ id: "sys-1" })]);
    const controller = new WhatsappTemplateCatalogController(service);
    const res = makeRes();

    await controller.listSystem(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([expect.objectContaining({ id: "sys-1" })]);
  });
});

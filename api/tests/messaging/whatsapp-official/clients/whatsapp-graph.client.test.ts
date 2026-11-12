import { describe, expect, it, vi, afterEach } from "vitest";
import {
  createTemplate,
  listTemplates,
  WhatsappGraphApiError,
} from "../../../../src/messaging/whatsapp-official/clients/whatsapp-graph.client.js";
import { templateCatalog } from "../../../../src/messaging/whatsapp-official/templates/catalog.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("whatsapp-graph.client", () => {
  it("listTemplates returns the data array on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "1", name: "order_ready", status: "APPROVED" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const templates = await listTemplates("waba-1", "token-1");
    expect(templates).toEqual([{ id: "1", name: "order_ready", status: "APPROVED" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/waba-1/message_templates"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
      }),
    );
  });

  it("createTemplate throws WhatsappGraphApiError when Meta rejects", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Template name already exists" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createTemplate("waba-1", "token-1", templateCatalog[0]),
    ).rejects.toThrow(WhatsappGraphApiError);
  });
});

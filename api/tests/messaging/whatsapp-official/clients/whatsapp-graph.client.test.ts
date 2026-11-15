import { describe, expect, it, vi, afterEach } from "vitest";
import {
  createTemplate,
  listTemplates,
  sendTextMessage,
  verifyAccountCredentials,
  WhatsappGraphApiError,
  type TemplateDefinition,
} from "../../../../src/messaging/whatsapp-official/clients/whatsapp-graph.client.js";

const orderReadyDefinition: TemplateDefinition = {
  metaName: "orden_lista_recoger",
  category: "UTILITY",
  language: "es_MX",
  text: "Hola {{nombre}}, tu equipo {{modelo}} ya está listo para recoger en nuestra sucursal.",
  variables: ["nombre", "modelo"],
};

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
      createTemplate("waba-1", "token-1", orderReadyDefinition),
    ).rejects.toThrow(WhatsappGraphApiError);
  });

  it("sendTextMessage posts a free-text payload to /{phone_number_id}/messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid-1" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendTextMessage("phone-1", "token-1", "5215500000000", "hola");

    expect(result).toEqual({ messages: [{ id: "wamid-1" }] });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      messaging_product: "whatsapp",
      to: "5215500000000",
      type: "text",
      text: { body: "hola" },
    });
  });

  describe("verifyAccountCredentials", () => {
    it("resolves when the phone number id matches and the waba is reachable", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "phone-1" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        verifyAccountCredentials("waba-1", "phone-1", "token-1"),
      ).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("/phone-1?fields=id"),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
        }),
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("/waba-1/message_templates"),
        expect.anything(),
      );
    });

    it("throws WhatsappGraphApiError when the token is invalid", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid OAuth access token" } }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        verifyAccountCredentials("waba-1", "phone-1", "bad-token"),
      ).rejects.toThrow(WhatsappGraphApiError);
    });

    it("throws WhatsappGraphApiError when the phoneNumberId doesn't match the token", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "other-phone" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        verifyAccountCredentials("waba-1", "phone-1", "token-1"),
      ).rejects.toThrow(WhatsappGraphApiError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws WhatsappGraphApiError when the waba isn't reachable with that token", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "phone-1" }) })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ error: { message: "Unsupported get request" } }),
        });
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        verifyAccountCredentials("waba-1", "phone-1", "token-1"),
      ).rejects.toThrow(WhatsappGraphApiError);
    });
  });
});

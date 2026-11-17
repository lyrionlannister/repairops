import { describe, expect, it } from "vitest";
import { extractIncomingMessages } from "../../../../src/messaging/whatsapp-official/helpers/whatsapp-webhook.helpers.js";

const payload = (messages: unknown[]) => ({
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { phone_number_id: "pn-1" },
            contacts: [{ wa_id: "5215500000000", profile: { name: "Ana" } }],
            messages,
          },
        },
      ],
    },
  ],
});

const base = { from: "5215500000000", id: "wamid.1" };

describe("extractIncomingMessages", () => {
  it("extrae un texto", () => {
    const [message] = extractIncomingMessages(payload([{ ...base, type: "text", text: { body: "hola" } }]));
    expect(message).toMatchObject({ phoneNumberId: "pn-1", from: "5215500000000", messageType: "text", body: "hola", contactName: "Ana" });
  });

  it.each(["image", "audio", "video", "document", "sticker"])("extrae %s con su media id, MIME y pie de foto", (type) => {
    const [message] = extractIncomingMessages(
      payload([{ ...base, type, [type]: { id: "media-1", mime_type: "x/y", sha256: "abc", caption: "mi foto" } }]),
    );
    expect(message).toMatchObject({
      messageType: type,
      body: "mi foto",
      media: { id: "media-1", mimeType: "x/y", sha256: "abc" },
    });
  });

  it("un archivo sin caption deja el body vacio", () => {
    const [message] = extractIncomingMessages(payload([{ ...base, type: "audio", audio: { id: "m", mime_type: "audio/ogg" } }]));
    expect(message?.body).toBe("");
  });

  it("extrae una ubicacion con coordenadas de 6 decimales", () => {
    const [message] = extractIncomingMessages(
      payload([{ ...base, type: "location", location: { latitude: 19.4326, longitude: -99.1332, name: "Zocalo" } }]),
    );
    expect(message).toMatchObject({ messageType: "location", body: "Zocalo", location: { lat: "19.432600", lng: "-99.133200" } });
  });

  it("ignora tipos desconocidos, estados y mensajes incompletos sin error", () => {
    const messages = extractIncomingMessages(
      payload([
        { ...base, type: "reaction", reaction: { emoji: "x" } },
        { ...base, type: "image", image: {} },
        { ...base, type: "location", location: {} },
        { type: "text", text: { body: "sin from" } },
      ]),
    );
    expect(messages).toEqual([]);
    expect(extractIncomingMessages({ entry: [{ changes: [{ value: { statuses: [{}] } }] }] })).toEqual([]);
    expect(extractIncomingMessages(null)).toEqual([]);
  });
});

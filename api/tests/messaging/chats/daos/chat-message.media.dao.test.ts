import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { ChatMessage } from "../../../../src/messaging/chats/entities/chat-message.entity.js";
import { Tenant } from "../../../../src/core/tenancy/entities/tenant.entity.js";
import { ChatMessageDao } from "../../../../src/messaging/chats/daos/chat-message.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("ChatMessageDao archivos y ubicaciones", () => {
  let dao: ChatMessageDao;
  let tenantA: string;
  let tenantB: string;
  const phone = "5215599990002";

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new ChatMessageDao(AppDataSource.getRepository(ChatMessage));
    const tenants = AppDataSource.getRepository(Tenant);
    tenantA = (await tenants.save(tenants.create({ name: "chat-media-test-a" }))).id;
    tenantB = (await tenants.save(tenants.create({ name: "chat-media-test-b" }))).id;
  });

  afterAll(async () => {
    await AppDataSource.getRepository(Tenant).delete([tenantA, tenantB]);
    await AppDataSource.destroy();
  });

  const image = (waMessageId: string) => ({
    contactPhone: phone,
    direction: "inbound" as const,
    sender: "customer" as const,
    body: "",
    waMessageId,
    messageType: "image" as const,
    mediaKey: `tenants/x/chat/${phone}/${waMessageId}.jpg`,
    mediaMime: "image/jpeg",
    mediaSize: 123,
  });

  it("guarda un archivo y lo encuentra solo en su tenant y conversacion", async () => {
    await runWithTenant(tenantA, () => dao.record(image("wamid.M1")));
    const [saved] = await runWithTenant(tenantA, () => dao.getMessagesByContact(phone));
    expect(saved).toMatchObject({ messageType: "image", mediaMime: "image/jpeg", mediaSize: 123 });

    const own = await runWithTenant(tenantA, () => dao.findMediaMessage(phone, saved.publicId));
    const foreign = await runWithTenant(tenantB, () => dao.findMediaMessage(phone, saved.publicId));
    const otherChat = await runWithTenant(tenantA, () => dao.findMediaMessage("5210000000000", saved.publicId));

    expect(own?.mediaKey).toBe(`tenants/x/chat/${phone}/wamid.M1.jpg`);
    expect(foreign).toBeNull();
    expect(otherChat).toBeNull();
  });

  it("guarda una ubicacion con coordenadas", async () => {
    await runWithTenant(tenantA, () =>
      dao.record({
        contactPhone: phone,
        direction: "inbound",
        sender: "customer",
        body: "",
        waMessageId: "wamid.L1",
        messageType: "location",
        locationLat: "19.432600",
        locationLng: "-99.133200",
      }),
    );
    const messages = await runWithTenant(tenantA, () => dao.getMessagesByContact(phone));
    expect(messages.find((m) => m.waMessageId === "wamid.L1")).toMatchObject({ locationLat: "19.432600", locationLng: "-99.133200" });
  });

  it("los CHECK rechazan un texto con archivo y una ubicacion sin coordenadas", async () => {
    await expect(
      runWithTenant(tenantA, () => dao.record({ ...image("wamid.BAD1"), messageType: "text" })),
    ).rejects.toThrow(/CHK_chat_messages_text_plain/);
    await expect(
      runWithTenant(tenantA, () =>
        dao.record({ contactPhone: phone, direction: "inbound", sender: "customer", body: "", waMessageId: "wamid.BAD2", messageType: "location" }),
      ),
    ).rejects.toThrow(/CHK_chat_messages_location/);
    await expect(
      runWithTenant(tenantA, () => dao.record({ ...image("wamid.BAD3"), mediaSize: null })),
    ).rejects.toThrow(/CHK_chat_messages_media_complete/);
  });
});

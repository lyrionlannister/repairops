import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { ChatMessage } from "../../../../src/messaging/chats/entities/chat-message.entity.js";
import { ChatDailyStat } from "../../../../src/messaging/chats/entities/chat-daily-stat.entity.js";
import { ContactName } from "../../../../src/messaging/chats/entities/contact-name.entity.js";
import { Tenant } from "../../../../src/core/tenancy/entities/tenant.entity.js";
import { ChatMessageDao } from "../../../../src/messaging/chats/daos/chat-message.dao.js";
import { ChatStatsDao } from "../../../../src/messaging/chats/daos/chat-stats.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres, same pattern as
// cash-session.dao.test.ts. chat_messages.tenant_id has a real FK, so the
// two tenants are created for real and deleted (cascade) at the end.
describe("ChatMessageDao / ChatStatsDao tenant isolation", () => {
  let messageDao: ChatMessageDao;
  let statsDao: ChatStatsDao;
  let tenantA: string;
  let tenantB: string;
  const phone = "5215599990001";

  beforeAll(async () => {
    await AppDataSource.initialize();
    messageDao = new ChatMessageDao(AppDataSource.getRepository(ChatMessage));
    statsDao = new ChatStatsDao(AppDataSource.getRepository(ChatDailyStat));
    const tenants = AppDataSource.getRepository(Tenant);
    tenantA = (await tenants.save(tenants.create({ name: "chat-store-test-a" }))).id;
    tenantB = (await tenants.save(tenants.create({ name: "chat-store-test-b" }))).id;
  });

  afterAll(async () => {
    await AppDataSource.getRepository(Tenant).delete([tenantA, tenantB]);
    await AppDataSource.destroy();
  });

  it("lists conversations and messages only for the current tenant", async () => {
    await runWithTenant(tenantA, () =>
      messageDao.record({ contactPhone: phone, direction: "inbound", sender: "customer", body: "hola A", waMessageId: "wamid.A1" }),
    );
    await runWithTenant(tenantB, () =>
      messageDao.record({ contactPhone: phone, direction: "inbound", sender: "customer", body: "hola B", waMessageId: "wamid.B1" }),
    );

    const convA = await runWithTenant(tenantA, () => messageDao.getConversations());
    const msgsA = await runWithTenant(tenantA, () => messageDao.getMessagesByContact(phone));
    const msgsB = await runWithTenant(tenantB, () => messageDao.getMessagesByContact(phone));

    expect(convA).toHaveLength(1);
    expect(convA[0]?.lastContent).toBe("hola A");
    expect(msgsA.map((m) => m.body)).toEqual(["hola A"]);
    expect(msgsB.map((m) => m.body)).toEqual(["hola B"]);
  });

  it("does not duplicate a message when Meta redelivers the same wamid in the same tenant", async () => {
    const input = { contactPhone: phone, direction: "inbound" as const, sender: "customer" as const, body: "dup", waMessageId: "wamid.DUP" };
    await runWithTenant(tenantA, () => messageDao.record(input));
    await runWithTenant(tenantA, () => messageDao.record(input));

    const msgs = await runWithTenant(tenantA, () => messageDao.getMessagesByContact(phone));
    expect(msgs.filter((m) => m.body === "dup")).toHaveLength(1);
  });

  it("accepts the same wamid in another tenant", async () => {
    await runWithTenant(tenantB, () =>
      messageDao.record({ contactPhone: phone, direction: "inbound", sender: "customer", body: "dup", waMessageId: "wamid.DUP" }),
    );
    const msgsB = await runWithTenant(tenantB, () => messageDao.getMessagesByContact(phone));
    expect(msgsB.filter((m) => m.body === "dup")).toHaveLength(1);
  });

  it("findLastInboundAt ignores outbound messages and other tenants", async () => {
    const ownPhone = "5215599990002";
    await runWithTenant(tenantA, () =>
      messageDao.record({ contactPhone: ownPhone, direction: "outbound", sender: "agent", body: "respuesta", waMessageId: "wamid.OUT" }),
    );

    expect(await runWithTenant(tenantA, () => messageDao.findLastInboundAt(ownPhone))).toBeNull();

    await runWithTenant(tenantA, () =>
      messageDao.record({ contactPhone: ownPhone, direction: "inbound", sender: "customer", body: "hola", waMessageId: "wamid.IN" }),
    );
    expect(await runWithTenant(tenantA, () => messageDao.findLastInboundAt(ownPhone))).toBeInstanceOf(Date);
    expect(await runWithTenant(tenantB, () => messageDao.findLastInboundAt(ownPhone))).toBeNull();
  });

  it("the database rejects an inbound message sent by the agent", async () => {
    await expect(
      AppDataSource.getRepository(ChatMessage).insert({
        tenantId: tenantA,
        contactPhone: phone,
        direction: "inbound",
        sender: "agent",
        body: "invalido",
      }),
    ).rejects.toThrow();
  });

  it("counters count each message once and each contact once per day, per tenant", async () => {
    const daily = await runWithTenant(tenantA, () => statsDao.getCountsByDay());
    // A: "hola A", "dup" (una sola vez), "respuesta", "hola" => 4 mensajes hoy.
    expect(daily[daily.length - 1]?.count).toBe(4);

    expect(await runWithTenant(tenantA, () => statsDao.getWeekContactCount())).toBe(2);
    expect(await runWithTenant(tenantB, () => statsDao.getWeekContactCount())).toBe(1);
    expect(await runWithTenant(tenantA, () => statsDao.getLastMessageAt())).not.toBeNull();
  });

  it("purgeBefore removes old messages but keeps the daily counters", async () => {
    await messageDao.purgeBefore(new Date(Date.now() + 60_000));

    expect(await runWithTenant(tenantA, () => messageDao.getMessagesByContact(phone))).toHaveLength(0);
    const daily = await runWithTenant(tenantA, () => statsDao.getCountsByDay());
    expect(daily[daily.length - 1]?.count).toBe(4);
  });

  it("contact_names keeps the same phone with a different name per tenant", async () => {
    const names = AppDataSource.getRepository(ContactName);
    await names.save([
      { tenantId: tenantA, phone, name: "Ana (taller A)" },
      { tenantId: tenantB, phone, name: "Beto (taller B)" },
    ]);

    expect((await names.findOneByOrFail({ tenantId: tenantA, phone })).name).toBe("Ana (taller A)");
    expect((await names.findOneByOrFail({ tenantId: tenantB, phone })).name).toBe("Beto (taller B)");
  });
});

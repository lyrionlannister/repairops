import { describe, expect, it } from "vitest";
import {
  normalizePhone,
  toConversationDto,
  toMessageDto,
} from "../../../../src/messaging/chats/helpers/chats.helpers.js";
import type { ConversationRow } from "../../../../src/messaging/chats/daos/chat-message.dao.js";

describe("normalizePhone", () => {
  it("strips the WhatsApp @c.us suffix", () => {
    expect(normalizePhone("5215512345678@c.us")).toBe("5215512345678");
  });

  it("leaves a session id without the suffix untouched", () => {
    expect(normalizePhone("5215512345678")).toBe("5215512345678");
  });

  it("keeps only digits (a pasted +, spaces or dashes)", () => {
    expect(normalizePhone("+52 155-1234-5678")).toBe("5215512345678");
  });
});

describe("toConversationDto", () => {
  const row: ConversationRow = {
    sessionId: "5215512345678",
    lastId: 42,
    messageCount: 3,
    lastContent: "hola",
    lastDirection: "inbound",
  };

  it("looks up the contact name by normalized phone", () => {
    const names = new Map([["5215512345678", "Juan Perez"]]);
    const dto = toConversationDto(row, names);

    expect(dto.phone).toBe("5215512345678");
    expect(dto.contactName).toBe("Juan Perez");
  });

  it("leaves contactName undefined when there's no match", () => {
    const dto = toConversationDto(row, new Map());
    expect(dto.contactName).toBeUndefined();
  });

  it("shows an outbound last message as type ai", () => {
    const dto = toConversationDto({ ...row, lastDirection: "outbound" }, new Map());
    expect(dto.lastType).toBe("ai");
  });

  it("falls back to empty content and 'human' type when missing", () => {
    const dto = toConversationDto(
      { ...row, lastContent: null as unknown as string, lastDirection: null as unknown as "inbound" },
      new Map(),
    );
    expect(dto.lastContent).toBe("");
    expect(dto.lastType).toBe("human");
  });
});

describe("toMessageDto", () => {
  it("marks outbound messages (AI or agent) as fromMe and type ai", () => {
    const dto = toMessageDto({ id: "1", contactPhone: "5215512345678", body: "hola", direction: "outbound" });
    expect(dto.fromMe).toBe(true);
    expect(dto.type).toBe("ai");
  });

  it("marks inbound messages as customer (type human), not fromMe", () => {
    const dto = toMessageDto({ id: "2", contactPhone: "5215512345678", body: "hola", direction: "inbound" });
    expect(dto.fromMe).toBe(false);
    expect(dto.type).toBe("human");
  });

  it("converts the bigint id to a number and uses the phone as sessionId", () => {
    const dto = toMessageDto({ id: "42", contactPhone: "5215512345678", body: "x", direction: "inbound" });
    expect(dto.id).toBe(42);
    expect(dto.sessionId).toBe("5215512345678");
  });
});

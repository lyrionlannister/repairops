import { describe, expect, it, vi, afterEach } from "vitest";
import { WhatsappInboundQueueService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-inbound-queue.service.js";
import { WhatsappAutomationQueueService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-automation-queue.service.js";
import type { WhatsappWebhookService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-webhook.service.js";
import type { WhatsappAutomationReplyService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-automation-reply.service.js";
import { getCurrentTenantId } from "../../../../src/core/tenancy/tenant-context.js";

const bull = vi.hoisted(() => ({
  add: vi.fn(),
  addBulk: vi.fn(),
  processors: new Map<string, (job: { data: unknown }) => Promise<unknown>>(),
  workerOpts: new Map<string, { concurrency?: number }>(),
}));

vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(function () {
    return { add: bull.add, addBulk: bull.addBulk, close: vi.fn() };
  }),
  Worker: vi.fn().mockImplementation(function (
    name: string,
    processor: never,
    opts: { concurrency?: number },
  ) {
    bull.processors.set(name, processor);
    bull.workerOpts.set(name, opts);
    return { on: vi.fn(), close: vi.fn() };
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
  bull.processors.clear();
  bull.workerOpts.clear();
});

const payload = {
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { phone_number_id: "phone-1" },
            messages: [
              { id: "wamid.A", from: "5215500000000", type: "text", text: { body: "hola" } },
              { id: "wamid.B", from: "5215500000000", type: "text", text: { body: "mi celular" } },
            ],
          },
        },
      ],
    },
  ],
};

describe("WhatsappInboundQueueService", () => {
  it("encola cada mensaje con su wamid como jobId para descartar reenvios de Meta", async () => {
    const service = new WhatsappInboundQueueService({} as WhatsappWebhookService);

    await service.enqueuePayload(payload);

    const jobs = bull.addBulk.mock.calls[0]![0] as {
      data: { body: string };
      opts: { jobId: string };
    }[];
    expect(jobs.map((job) => [job.opts.jobId, job.data.body])).toEqual([
      ["wamid.A", "hola"],
      ["wamid.B", "mi celular"],
    ]);
  });

  it("un payload sin mensajes (p. ej. estados de entrega) no encola nada", async () => {
    const service = new WhatsappInboundQueueService({} as WhatsappWebhookService);

    await service.enqueuePayload({ entry: [{ changes: [{ value: { statuses: [{}] } }] }] });

    expect(bull.addBulk).not.toHaveBeenCalled();
  });

  it("el worker procesa de a uno para conservar el orden del inbox", async () => {
    const handleIncomingMessage = vi.fn().mockResolvedValue(undefined);
    const service = new WhatsappInboundQueueService({
      handleIncomingMessage,
    } as unknown as WhatsappWebhookService);

    service.start();
    await bull.processors.get("whatsapp-inbound")!({ data: { from: "52155", body: "hola" } });

    expect(bull.workerOpts.get("whatsapp-inbound")?.concurrency).toBe(1);
    expect(handleIncomingMessage).toHaveBeenCalledWith({ from: "52155", body: "hola" });
  });
});

describe("WhatsappAutomationQueueService", () => {
  const job = {
    tenantId: "tenant-1",
    accountId: "acc-1",
    from: "5215500000000",
    body: "hola",
    repairNoteId: null,
    sourceMessageId: "wamid.A",
  };

  it("encola un solo intento con jobId derivado del wamid", async () => {
    const service = new WhatsappAutomationQueueService({} as WhatsappAutomationReplyService);

    await service.enqueue(job);

    expect(bull.add).toHaveBeenCalledWith(
      "reply",
      job,
      expect.objectContaining({ jobId: "reply-wamid.A", attempts: 1 }),
    );
  });

  it("el job no lleva el access token de Meta", async () => {
    const service = new WhatsappAutomationQueueService({} as WhatsappAutomationReplyService);

    await service.enqueue(job);

    expect(JSON.stringify(bull.add.mock.calls[0]![1])).not.toMatch(/token/i);
  });

  it("el worker corre la respuesta dentro del tenant del job y en paralelo", async () => {
    let tenantSeen: string | undefined;
    const reply = vi.fn().mockImplementation(async () => {
      tenantSeen = getCurrentTenantId();
    });
    const service = new WhatsappAutomationQueueService({
      reply,
    } as unknown as WhatsappAutomationReplyService);

    service.start();
    await bull.processors.get("whatsapp-automation")!({ data: job });

    expect(tenantSeen).toBe("tenant-1");
    expect(reply).toHaveBeenCalledWith(job);
    expect(bull.workerOpts.get("whatsapp-automation")?.concurrency).toBeGreaterThan(1);
  });
});

import { singleton } from "tsyringe";
import { Queue, Worker } from "bullmq";
import {
  WhatsappWebhookService,
  type IncomingWhatsappMessage,
} from "./whatsapp-webhook.service.js";
import { WhatsappMessageCostService } from "./whatsapp-message-cost.service.js";
import {
  extractIncomingMessages,
  extractStatusUpdates,
} from "../helpers/whatsapp-webhook.helpers.js";
import { queueOptions, retainJobs } from "../../../core/config/queue.js";

const QUEUE_NAME = "whatsapp-inbound";

// Concurrencia 1: mantiene en el inbox el orden en que Meta entrego los
// mensajes. Es rapido porque la llamada a n8n va en su propia cola.
@singleton()
export class WhatsappInboundQueueService {
  private queue: Queue<IncomingWhatsappMessage> | null = null;
  private worker: Worker<IncomingWhatsappMessage> | null = null;

  constructor(
    private whatsappWebhookService: WhatsappWebhookService,
    private whatsappMessageCostService: WhatsappMessageCostService,
  ) {}

  async enqueuePayload(payload: unknown): Promise<void> {
    // Los status de costo se resuelven inline, no por cola: es un UPDATE
    // idempotente (pisa el mismo valor si Meta reenvia), no necesita el orden
    // ni el buffer que si necesitan los mensajes entrantes. Un error aqui
    // nunca debe tumbar el ack del webhook ni bloquear los mensajes.
    for (const update of extractStatusUpdates(payload)) {
      try {
        await this.whatsappMessageCostService.recordStatusUpdate(update);
      } catch (error) {
        console.error("Error registrando costo de status de WhatsApp:", error);
      }
    }

    const messages = extractIncomingMessages(payload);
    if (messages.length === 0) return;

    // jobId = wamid: Meta reenvia el mismo mensaje si no recibe 200 a tiempo,
    // y BullMQ ignora un job con un id que ya existe.
    await this.getQueue().addBulk(
      messages.map((message) => ({
        name: "incoming",
        data: message,
        opts: {
          jobId: message.messageId,
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          ...retainJobs,
        },
      })),
    );
  }

  start(): void {
    this.worker = new Worker<IncomingWhatsappMessage>(
      QUEUE_NAME,
      (job) => this.whatsappWebhookService.handleIncomingMessage(job.data),
      { ...queueOptions, concurrency: 1 },
    );
    this.worker.on("failed", (job, error) => {
      console.error(
        "Mensaje entrante de WhatsApp fallido",
        { jobId: job?.id, attempts: job?.attemptsMade },
        error,
      );
    });
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  private getQueue(): Queue<IncomingWhatsappMessage> {
    this.queue ??= new Queue<IncomingWhatsappMessage>(QUEUE_NAME, queueOptions);
    return this.queue;
  }
}

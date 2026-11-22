import { singleton } from "tsyringe";
import { Queue, Worker } from "bullmq";
import {
  WhatsappAutomationReplyService,
  type AutomationReplyRequest,
} from "./whatsapp-automation-reply.service.js";
import { queueOptions, retainJobs } from "../../../core/config/queue.js";
import { runWithTenant } from "../../../core/tenancy/tenant-context.js";

const QUEUE_NAME = "whatsapp-automation";

// Sin el access token de Meta: el job vive en Redis en texto plano, el worker
// recarga la cuenta (cifrada en Postgres) por id.
export type AutomationJob = AutomationReplyRequest & { tenantId: string; sourceMessageId?: string };

// Concurrencia alta: cada job queda retenido en n8n hasta 3 s sin mensajes
// nuevos del contacto, y el buffer solo acumula si los jobs corren a la vez.
const CONCURRENCY = 50;

@singleton()
export class WhatsappAutomationQueueService {
  private queue: Queue<AutomationJob> | null = null;
  private worker: Worker<AutomationJob> | null = null;

  constructor(private whatsappAutomationReplyService: WhatsappAutomationReplyService) {}

  async enqueue(job: AutomationJob): Promise<void> {
    // Un solo intento y jobId por wamid: un reintento, o un reintento del job
    // entrante que lo encolo, volveria a meter el mensaje al buffer de n8n.
    await this.getQueue().add("reply", job, {
      jobId: job.sourceMessageId ? `reply-${job.sourceMessageId}` : undefined,
      attempts: 1,
      ...retainJobs,
    });
  }

  start(): void {
    this.worker = new Worker<AutomationJob>(
      QUEUE_NAME,
      ({ data }) =>
        runWithTenant(data.tenantId, () => this.whatsappAutomationReplyService.reply(data)),
      { ...queueOptions, concurrency: CONCURRENCY },
    );
    this.worker.on("failed", (job, error) => {
      console.error("Respuesta automatica de WhatsApp fallida", { jobId: job?.id }, error);
    });
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  private getQueue(): Queue<AutomationJob> {
    this.queue ??= new Queue<AutomationJob>(QUEUE_NAME, queueOptions);
    return this.queue;
  }
}

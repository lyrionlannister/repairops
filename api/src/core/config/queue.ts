import type { DefaultJobOptions, QueueOptions } from "bullmq";
import { redisConnectionOptions } from "./redis-client.js";

// Prefijo propio: n8n comparte este Redis y usa sus propias claves (buffer:*).
// maxRetriesPerRequest null lo exige BullMQ para los comandos bloqueantes del Worker.
export const queueOptions: QueueOptions = {
  connection: { ...redisConnectionOptions, maxRetriesPerRequest: null },
  prefix: "repairops-bull",
};

export const retainJobs: Pick<DefaultJobOptions, "removeOnComplete" | "removeOnFail"> = {
  removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
};

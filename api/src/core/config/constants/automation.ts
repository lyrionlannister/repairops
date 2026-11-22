import { optionalEnv } from "../env.js";

export const AUTOMATION = optionalEnv(
  "AUTOMATION_URL",
  "http://automation:5678/webhook/whatsapp-inbound",
);

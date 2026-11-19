import { optionalEnv } from "../env.js";

export const AUTOMATION = optionalEnv(
  "AUTOMATION_URL",
  "http://automation:5678/webhook/97c71c06-20b2-4c12-a8be-16442536f909",
);

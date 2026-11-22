import { optionalEnv } from "../../../core/config/env.js";

export const AUTOMATION_ALLOWED_DOMAINS = optionalEnv("AUTOMATION_ALLOWED_DOMAINS", "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

// Sin lista configurada no se restringe el dominio (entorno local).
export function isAllowedAutomationDomain(hostname: string): boolean {
  if (AUTOMATION_ALLOWED_DOMAINS.length === 0) return true;
  const normalized = hostname.toLowerCase();
  return AUTOMATION_ALLOWED_DOMAINS.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`),
  );
}

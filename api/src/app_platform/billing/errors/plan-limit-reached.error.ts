export type PlanResource = "users" | "branches" | "whatsapp_messages";

const MESSAGES: Record<PlanResource, (limit: number) => string> = {
  users: (limit) => `Tu plan permite ${limit} usuarios activos`,
  branches: (limit) => `Tu plan permite ${limit} sucursales activas`,
  whatsapp_messages: (limit) => `Llegaste al límite de ${limit} mensajes de WhatsApp de este mes`,
};

export class PlanLimitReachedError extends Error {
  readonly code = "plan_limit_reached";

  constructor(
    readonly resource: PlanResource,
    readonly limit: number,
    readonly used: number,
  ) {
    super(MESSAGES[resource](limit));
  }
}

export type PlanResource = "users" | "branches";

export class PlanLimitReachedError extends Error {
  readonly code = "plan_limit_reached";

  constructor(
    readonly resource: PlanResource,
    readonly limit: number,
    readonly used: number,
  ) {
    super(
      resource === "users"
        ? `Tu plan permite ${limit} usuarios activos`
        : `Tu plan permite ${limit} sucursales activas`,
    );
  }
}

import { BranchAccessError } from "../tenancy/tenant-context.js";

// Status HTTP de un error capturado en un controlador: una sucursal no permitida es 403;
// lo demás conserva el status que el controlador ya usaba.
export const errorStatus = (error: unknown, fallback: number): number =>
  error instanceof BranchAccessError ? 403 : fallback;

export const queryString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

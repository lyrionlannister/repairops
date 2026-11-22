import { getRequestActor } from "../../core/tenancy/tenant-context.js";
import type { Permission } from "./permissions.js";

export class ForbiddenError extends Error {
  readonly status = 403;
}

// Fuera de una petición (jobs, webhooks) no hay actor y nadie puede nada: un service
// que pregunte can() desde ahí debe decidir sin permisos, no heredar los de nadie.
export function can(permission: Permission): boolean {
  return getRequestActor()?.permissions.has(permission) ?? false;
}

// true solo si hay un usuario en la petición y no tiene el permiso: es la condición para
// aplicar la variante .own. Un job o webhook (sin actor) no queda restringido.
export function lacks(permission: Permission): boolean {
  const actor = getRequestActor();
  return actor !== null && !actor.permissions.has(permission);
}

export function currentUserId(): string | null {
  return getRequestActor()?.userId ?? null;
}

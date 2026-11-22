import { AsyncLocalStorage } from "node:async_hooks";

// Alcance de sucursales de quien hace la petición. null = sin restricción (owner,
// o un proceso de sistema). Para el personal: `readIds` es lo que ve (su sucursal
// principal) y `writeIds` donde puede registrar (todas las suyas activas).
export interface BranchScope {
  readIds: string[];
  writeIds: string[];
  primaryId: string | null;
}

// Quién hace la petición. Lo carga tenantMiddleware desde la base; los permisos
// son strings aquí para que core no dependa de identity/authz.
export interface RequestActor {
  userId: string;
  roles: readonly string[];
  permissions: ReadonlySet<string>;
}

interface TenantScope {
  tenantId: string | null;
  isSystemScope: boolean;
  branch: BranchScope | null;
  actor: RequestActor | null;
}

export class TenantContextError extends Error {}

// 403: la sucursal pedida no es una de las permitidas del usuario (o no es del tenant).
export class BranchAccessError extends Error {
  readonly status = 403;
}

const storage = new AsyncLocalStorage<TenantScope>();

export function runWithTenant<T>(
  tenantId: string,
  fn: () => T,
  branch: BranchScope | null = null,
  actor: RequestActor | null = null,
): T {
  return storage.run({ tenantId, isSystemScope: false, branch, actor }, fn);
}

// Bypass explícito del filtro de tenant. Usar solo para operaciones de
// sistema de verdad (seeds, callbacks sin JWT que ya validaron el tenant
// por otra vía) — nunca como atajo para "no sé qué tenant es".
export function allowSystemScope<T>(fn: () => T): T {
  return storage.run({ tenantId: null, isSystemScope: true, branch: null, actor: null }, fn);
}

export function getCurrentTenantId(): string {
  const scope = storage.getStore();
  if (!scope) {
    throw new TenantContextError(
      "No hay tenant en contexto. Usa runWithTenant() o, si de verdad es una " +
        "operacion de sistema, allowSystemScope().",
    );
  }
  if (scope.isSystemScope) {
    throw new TenantContextError(
      "El contexto actual es de sistema (sin tenant): esta operacion requiere un tenant.",
    );
  }
  return scope.tenantId as string;
}

export function isSystemScope(): boolean {
  return storage.getStore()?.isSystemScope ?? false;
}

export function getBranchScope(): BranchScope | null {
  return storage.getStore()?.branch ?? null;
}

// null fuera de una petición (jobs, webhooks, seeds): ahí no hay usuario que autorizar.
export function getRequestActor(): RequestActor | null {
  return storage.getStore()?.actor ?? null;
}

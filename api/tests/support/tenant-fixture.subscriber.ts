import { EventSubscriber, type EntitySubscriberInterface, type InsertEvent } from "typeorm";

export const FIXTURE_TENANT_NAME = "test-fixture";

// Con FK a tenants, una prueba de integracion ya no puede insertar con un tenant_id
// inventado. Este suscriptor (solo de pruebas) crea la fila del tenant la primera
// vez que se inserta una entidad con ese tenantId; tests/global-teardown.ts los borra
// al final (la cascada limpia sus datos). Los tenants reales de una prueba (creados
// con el repositorio de Tenant) no se tocan: ON CONFLICT DO NOTHING.
@EventSubscriber()
export class TenantFixtureSubscriber implements EntitySubscriberInterface {
  async beforeInsert(event: InsertEvent<unknown>): Promise<void> {
    const tenantId = (event.entity as { tenantId?: string | null } | undefined)?.tenantId;
    if (!tenantId || !/^\d+$/.test(String(tenantId))) return;
    await event.manager.query(`INSERT INTO "tenants" ("id", "nombre") VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING`, [
      tenantId,
      FIXTURE_TENANT_NAME,
    ]);
  }
}

// Para pruebas cuyo codigo inserta con SQL crudo (el suscriptor no lo ve), p. ej. el
// upsert de local_config: crea los tenants fixture de antemano.
export async function ensureFixtureTenant(manager: { query(sql: string, params?: unknown[]): Promise<unknown> }, ...ids: string[]): Promise<void> {
  for (const id of ids) {
    await manager.query(`INSERT INTO "tenants" ("id", "nombre") VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING`, [id, FIXTURE_TENANT_NAME]);
  }
}

// Sucursal fixture con id explicito (para pruebas que insertan con SQL crudo o necesitan el id antes).
export async function ensureFixtureBranch(manager: { query(sql: string, params?: unknown[]): Promise<unknown> }, tenantId: string, branchId: string): Promise<void> {
  await manager.query(`INSERT INTO "branches" ("id", "tenant_id", "nombre") VALUES ($1, $2, $3) ON CONFLICT ("id") DO NOTHING`, [branchId, tenantId, FIXTURE_TENANT_NAME]);
}

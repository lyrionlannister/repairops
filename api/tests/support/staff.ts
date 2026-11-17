import jwt from "jsonwebtoken";
import { requireJwtSecret } from "../../src/identity/auth/jwt-secret.js";
import type { UserRole } from "../../src/identity/auth/entities/user.entity.js";

type Queryable = { query(sql: string, params?: unknown[]): Promise<any> };

// Para pruebas de rutas: crea (bajo un tenant fixture) una sucursal real y un usuario por rol.
// El personal queda asignado a esa sucursal como principal; el owner no necesita asignación.
// Devuelve la sucursal y un token JWT por rol.
export async function setupStaff(
  ds: Queryable,
  tenantId: string,
  roles: UserRole[],
): Promise<{ branchId: string; tokens: Record<string, string>; userIds: Record<string, string> }> {
  await ds.query(`INSERT INTO tenants (id, nombre) VALUES ($1, 'test-fixture') ON CONFLICT (id) DO NOTHING`, [tenantId]);
  const [{ id: branchId }] = await ds.query(
    `INSERT INTO branches (tenant_id, nombre) VALUES ($1, 'Sucursal de prueba') RETURNING id::text AS id`,
    [tenantId],
  );

  const tokens: Record<string, string> = {};
  const userIds: Record<string, string> = {};
  for (const role of roles) {
    const [{ id }] = await ds.query(
      `INSERT INTO usuarios (tenant_id, rol, nombre, apellido, email, contrasena)
       VALUES ($1, $2, 'Test', $2, $3, 'x') RETURNING id::text AS id`,
      [tenantId, role, `${role}.${tenantId}@test.local`],
    );
    if (role !== "owner") {
      await ds.query(`INSERT INTO user_branches (tenant_id, user_id, branch_id, is_primary) VALUES ($1, $2, $3, true)`, [
        tenantId,
        id,
        branchId,
      ]);
    }
    userIds[role] = id;
    tokens[role] = jwt.sign({ id, email: `${role}@x.com`, tenantId, role }, requireJwtSecret());
  }
  return { branchId, tokens, userIds };
}

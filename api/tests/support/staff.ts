import jwt from "jsonwebtoken";
import { requireJwtSecret } from "../../src/identity/auth/jwt-secret.js";
import type { UserRole } from "../../src/identity/auth/entities/user.entity.js";

type Queryable = { query(sql: string, params?: unknown[]): Promise<any> };

// Para pruebas de rutas: crea (bajo un tenant fixture) una sucursal real y un usuario por rol
// (cada uno con ese único rol en user_roles).
// El personal queda asignado a esa sucursal como principal; el owner no necesita asignación.
// Devuelve la sucursal y un token JWT por rol.
export async function setupStaff(
  ds: Queryable,
  tenantId: string,
  roles: UserRole[],
): Promise<{
  branchId: string;
  branchPublicId: string;
  tokens: Record<string, string>;
  userIds: Record<string, string>;
  userPublicIds: Record<string, string>;
}> {
  await ds.query(
    `INSERT INTO tenants (id, nombre) VALUES ($1, 'test-fixture') ON CONFLICT (id) DO NOTHING`,
    [tenantId],
  );
  const [{ publicId: tenantPublicId }] = await ds.query(
    `SELECT public_id::text AS "publicId" FROM tenants WHERE id = $1`,
    [tenantId],
  );
  const [{ id: branchId, publicId: branchPublicId }] = await ds.query(
    `INSERT INTO branches (tenant_id, nombre) VALUES ($1, 'Sucursal de prueba')
     RETURNING id::text AS id, public_id::text AS "publicId"`,
    [tenantId],
  );

  const tokens: Record<string, string> = {};
  const userIds: Record<string, string> = {};
  const userPublicIds: Record<string, string> = {};
  for (const role of roles) {
    // email_verificado_en ya seteado: estos fixtures prueban permisos/
    // suscripción, no el flujo de verificación (ver tenant.middleware.ts).
    const [{ id, publicId }] = await ds.query(
      `INSERT INTO usuarios (tenant_id, nombre, apellido, email, contrasena, email_verificado_en)
       VALUES ($1, 'Test', $2, $3, 'x', CURRENT_TIMESTAMP) RETURNING id::text AS id, public_id::text AS "publicId"`,
      [tenantId, role, `${role}.${tenantId}@test.local`],
    );
    await ds.query(`INSERT INTO user_roles (tenant_id, user_id, role) VALUES ($1, $2, $3)`, [
      tenantId,
      id,
      role,
    ]);
    if (role !== "owner") {
      await ds.query(
        `INSERT INTO user_branches (tenant_id, user_id, branch_id, is_primary) VALUES ($1, $2, $3, true)`,
        [tenantId, id, branchId],
      );
    }
    userIds[role] = id;
    userPublicIds[role] = publicId;
    tokens[role] = jwt.sign(
      { id: publicId, email: `${role}@x.com`, tenantId: tenantPublicId },
      requireJwtSecret(),
    );
  }
  return { branchId, branchPublicId, tokens, userIds, userPublicIds };
}

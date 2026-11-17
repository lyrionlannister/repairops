import pg from "pg";
import { FIXTURE_TENANT_NAME } from "./support/tenant-fixture.subscriber.js";

// Ids de sucursal que usan las pruebas (local_id tiene FK a branches). Se crean antes de
// la corrida bajo un tenant fixture; si ya existe una sucursal real con ese id, sirve igual.
const FIXTURE_BRANCH_IDS = ["1", "2", "3", "4", "5", "6", "7", "42", "9001", "9002"];

function newClient(): pg.Client | null {
  if (!process.env.DB_NAME) return null;
  return new pg.Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Antes: tenant y sucursales fixture. Despues: se borran los tenants fixture (la cascada
// elimina sus datos y sucursales). Sin base de datos (pruebas sin integracion) no hace nada.
export default async function setup() {
  const client = newClient();
  if (client) {
    try {
      await client.connect();
      const { rows } = await client.query(`INSERT INTO tenants (nombre) VALUES ($1) RETURNING id`, [FIXTURE_TENANT_NAME]);
      for (const id of FIXTURE_BRANCH_IDS) {
        await client.query(`INSERT INTO branches (id, tenant_id, nombre) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`, [
          id,
          rows[0].id,
          FIXTURE_TENANT_NAME,
        ]);
      }
    } catch {
      // sin base de datos: las pruebas de integracion fallaran por su cuenta
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  return async () => {
    const teardown = newClient();
    if (!teardown) return;
    try {
      await teardown.connect();
      await teardown.query(`DELETE FROM tenants WHERE nombre = $1`, [FIXTURE_TENANT_NAME]);
    } catch {
      // nada que limpiar
    } finally {
      await teardown.end().catch(() => undefined);
    }
  };
}

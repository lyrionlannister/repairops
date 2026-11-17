import pg from "pg";
import { FIXTURE_TENANT_NAME } from "./support/tenant-fixture.subscriber.js";

// Borra los tenants que las pruebas crearon solo para cumplir la FK; la cascada
// elimina sus datos. Si la base no esta disponible (pruebas sin integracion), no hace nada.
export default function setup() {
  return async () => {
    if (!process.env.DB_NAME) return;
    const client = new pg.Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    try {
      await client.connect();
      await client.query(`DELETE FROM tenants WHERE nombre = $1`, [FIXTURE_TENANT_NAME]);
    } catch {
      // sin base de datos: nada que limpiar
    } finally {
      await client.end().catch(() => undefined);
    }
  };
}

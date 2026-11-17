// tsyringe (usado por los Dao/Service/Controller via @singleton/@inject)
// necesita este polyfill cargado antes de que cualquier modulo decorado se
// importe -- en runtime lo hace index.ts, aqui no hay index.ts.
import "reflect-metadata";

// Vitest no carga .env automaticamente. JWT_SECRET ya no tiene fallback en
// codigo (ver api/src/auth/jwt-secret.ts) asi que los tests que firman/
// verifican JWT necesitan uno propio, separado de cualquier secreto real.
process.env.JWT_SECRET ??= "test-only-jwt-secret-do-not-use-in-prod";

// Ver tests/support/tenant-fixture.subscriber.ts: las pruebas de integracion con
// tenants inventados necesitan la fila de tenants por la FK. Si no hay variables de
// base de datos (pruebas unitarias puras) no se carga el DataSource.
if (process.env.DB_NAME) {
  const [{ default: AppDataSource }, { TenantFixtureSubscriber }] = await Promise.all([
    import("../src/core/config/data-source.js"),
    import("./support/tenant-fixture.subscriber.js"),
  ]);
  (AppDataSource.options as { subscribers?: unknown[] }).subscribers = [TenantFixtureSubscriber];
}

import "reflect-metadata";
import MigrationDataSource from "../config/migration-data-source.js";

// `typeorm migration:run` fuerza logging: ["query", "error", "schema"] sin
// importar que tan silencioso pidamos estar (MigrationRunCommand.js lo
// hardcodea antes de initialize()), asi que no hay flag de CLI que lo evite.
// Este runner llama runMigrations() directo para loguear solo el nombre de
// cada migracion, no el SQL completo de cada sentencia.
MigrationDataSource.setOptions({ logging: ["migration", "error", "schema"] });

try {
  await MigrationDataSource.initialize();
  await MigrationDataSource.runMigrations({
    transaction: MigrationDataSource.options.migrationsTransactionMode ?? "all",
  });
  await MigrationDataSource.destroy();
  process.exit(0);
} catch (error) {
  console.error("Error durante migration:run:", error);
  if (MigrationDataSource.isInitialized) await MigrationDataSource.destroy();
  process.exit(1);
}

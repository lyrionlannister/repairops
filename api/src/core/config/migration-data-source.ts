import "reflect-metadata";
import { DataSource } from "typeorm";
import { appDataSourceOptions } from "./data-source.js";
import { isProduction } from "./env.js";

// DataSource exclusivo del CLI de TypeORM (migration:generate/run/revert, schema:log).
// Separado de AppDataSource para que el boot de la app y los tests, que importan
// data-source.ts, nunca disparen la carga de los archivos de migración.
// Un solo patrón a la vez: si se listan ambos, TypeORM intenta importar también el
// .ts fuente al correr el CLI compilado en dist, y ese import directo (sin ts-node) falla.
const migrationsGlob = isProduction()
  ? "dist/core/database/migrations/*.js"
  : "src/core/database/migrations/*.ts";

const MigrationDataSource = new DataSource({
  ...appDataSourceOptions,
  migrations: [migrationsGlob],
});

export default MigrationDataSource;

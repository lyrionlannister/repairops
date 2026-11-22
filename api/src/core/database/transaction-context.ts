import { AsyncLocalStorage } from "node:async_hooks";
import type { EntityManager } from "typeorm";
import AppDataSource from "../config/data-source.js";

const storage = new AsyncLocalStorage<EntityManager>();

// Los Daos leen este manager (ver BaseDao.repository): todo lo que corra dentro
// de fn usa la misma conexión y la misma transacción sin pasar el manager a mano.
// Anidado reutiliza la transacción externa.
export function runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (storage.getStore()) return fn();
  return AppDataSource.transaction((manager) => storage.run(manager, fn));
}

export function getTransactionManager(): EntityManager | undefined {
  return storage.getStore();
}

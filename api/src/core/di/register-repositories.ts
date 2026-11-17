import { container } from "tsyringe";
import AppDataSource, { appDataSourceOptions } from "../config/data-source.js";
import { redisClient } from "../config/redis-client.js";
import { REDIS_CLIENT } from "./tokens.js";
import { MEDIA_STORAGE } from "../../messaging/chats/storage/media-storage.js";
import { createMediaStorage } from "../../messaging/chats/storage/create-media-storage.js";
import { repositoryToken, type EntityConstructor } from "./repository-token.js";

// Un repositorio de TypeORM por Entity es todo lo que el contenedor necesita
// para resolver cualquier Dao -- cada Dao pide su repositorio por
// @inject(repositoryToken(Entity)) (ver core/daos). Una Entity nueva que ya
// esté en appDataSourceOptions.entities queda disponible sin tocar este
// archivo. Debe correr despues de AppDataSource.initialize().
export function registerRepositories(): void {
  const entities = [appDataSourceOptions.entities ?? []]
    .flat()
    .filter((entity): entity is EntityConstructor => typeof entity === "function");
  for (const entity of entities) {
    container.registerInstance(repositoryToken(entity), AppDataSource.getRepository(entity));
  }
  container.registerInstance(REDIS_CLIENT, redisClient);
  container.registerInstance(MEDIA_STORAGE, createMediaStorage());
}

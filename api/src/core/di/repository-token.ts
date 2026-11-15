import type { InjectionToken } from "tsyringe";
import type { ObjectLiteral, Repository } from "typeorm";

export type EntityConstructor<T extends ObjectLiteral = ObjectLiteral> = new (
  ...args: any[]
) => T;

const tokensByEntity = new WeakMap<EntityConstructor, symbol>();

// tsyringe tipa un token-clase para que container.resolve() devuelva una
// instancia de esa clase -- aqui se necesita lo opuesto: usar la Entity como
// llave para su Repository<Entity>, nunca para una instancia de la Entity.
// El token real en runtime es un symbol propio por Entity (nunca la clase
// misma), así que el único cast de todo este mecanismo vive aquí, una sola
// vez, y lo que ve cada llamador (InjectionToken<Repository<T>>) es exacto.
export function repositoryToken<T extends ObjectLiteral>(
  entity: EntityConstructor<T>,
): InjectionToken<Repository<T>> {
  let token = tokensByEntity.get(entity);
  if (!token) {
    token = Symbol(entity.name);
    tokensByEntity.set(entity, token);
  }
  return token as unknown as InjectionToken<Repository<T>>;
}

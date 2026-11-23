import type { EntityMetadata } from "typeorm";
import AppDataSource from "../../config/data-source.js";
import { POLYMORPHIC_REFERENCES, REFERENCES_WITHOUT_FK } from "./public-id-tables.js";

const foreignKeysByEntity = new WeakMap<EntityMetadata, ReadonlyMap<string, string>>();
let foreignKeysByName: ReadonlyMap<string, string> | null = null;

export const INTERNAL_ID = /^\d+$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function entityMetadataOf(value: object): EntityMetadata | null {
  return AppDataSource.hasMetadata(value.constructor)
    ? AppDataSource.getMetadata(value.constructor)
    : null;
}

export function entityMetadataOfTable(table: string): EntityMetadata | undefined {
  return AppDataSource.entityMetadatas.find((metadata) => metadata.tableName === table);
}

export function isPublicIdTable(table: string): boolean {
  return entityMetadataOfTable(table)?.hasColumnWithPropertyPath("publicId") ?? false;
}

// Para objetos planos (filas crudas, spreads, bodies) solo se conoce el nombre de la
// clave: se traduce unicamente si ese nombre apunta a la misma tabla en todas las
// entidades que lo declaran como FK; un nombre ambiguo no se adivina.
export function foreignKeyTargetsByName(): ReadonlyMap<string, string> {
  if (foreignKeysByName) return foreignKeysByName;
  const targets = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const metadata of AppDataSource.entityMetadatas) {
    for (const relation of metadata.manyToOneRelations.concat(metadata.oneToOneRelations)) {
      const table = relation.inverseEntityMetadata.tableName;
      for (const column of relation.joinColumns) {
        const known = targets.get(column.propertyName);
        if (known !== undefined && known !== table) ambiguous.add(column.propertyName);
        targets.set(column.propertyName, table);
      }
    }
  }
  for (const name of ambiguous) targets.delete(name);
  for (const [name, table] of REFERENCES_WITHOUT_FK) targets.set(name, table);
  for (const reference of POLYMORPHIC_REFERENCES) targets.delete(reference.idKey);
  for (const [name, table] of targets) if (!isPublicIdTable(table)) targets.delete(name);
  foreignKeysByName = targets;
  return targets;
}

export function foreignKeyTargets(metadata: EntityMetadata): ReadonlyMap<string, string> {
  const cached = foreignKeysByEntity.get(metadata);
  if (cached) return cached;
  const targets = new Map<string, string>();
  for (const relation of metadata.manyToOneRelations.concat(metadata.oneToOneRelations)) {
    const table = relation.inverseEntityMetadata.tableName;
    if (!isPublicIdTable(table)) continue;
    for (const column of relation.joinColumns) targets.set(column.propertyName, table);
  }
  const byName = foreignKeyTargetsByName();
  for (const column of metadata.columns) {
    const table = byName.get(column.propertyName);
    if (table && !targets.has(column.propertyName)) targets.set(column.propertyName, table);
  }
  foreignKeysByEntity.set(metadata, targets);
  return targets;
}

export function referencedTable(
  holder: Record<string, unknown>,
  key: string,
  foreignKeys: ReadonlyMap<string, string>,
): string | null {
  const polymorphic = POLYMORPHIC_REFERENCES.find((reference) => reference.idKey === key);
  if (!polymorphic) return foreignKeys.get(key) ?? null;
  const type = holder[polymorphic.typeKey];
  return typeof type === "string" ? (polymorphic.tables[type] ?? null) : null;
}

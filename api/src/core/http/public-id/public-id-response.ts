import type { NextFunction, Request, Response } from "express";
import AppDataSource from "../../config/data-source.js";
import {
  INTERNAL_ID,
  UUID,
  entityMetadataOf,
  foreignKeyTargets,
  foreignKeyTargetsByName,
  isPublicIdTable,
  referencedTable,
} from "./public-id-metadata.js";
import { EXTERNAL_ID_KEYS } from "./public-id-tables.js";

type IdsByTable = Map<string, Set<string>>;
type PublicIdsByTable = Map<string, Map<string, string>>;

interface NodeKeys {
  isRow: boolean;
  foreignKeys: ReadonlyMap<string, string>;
}

export class PublicIdLeakError extends Error {}

const WRAPPED = Symbol("publicIdResponses");

// Solo un id interno se traduce: un valor que ya es uuid (respuesta traducida dos
// veces, o un campo que ya viaja publico) se deja como esta.
const internalId = (value: unknown): string | null => {
  const text =
    typeof value === "string" || typeof value === "number" || typeof value === "bigint"
      ? String(value)
      : "";
  return INTERNAL_ID.test(text) ? text : null;
};

function isTraversable(value: unknown): value is object {
  if (typeof value !== "object" || value === null) return false;
  if (value instanceof Date || Buffer.isBuffer(value)) return false;
  return Array.isArray(value) || typeof (value as { toJSON?: unknown }).toJSON !== "function";
}

// Una entidad con public_id, o un objeto plano con `id` interno y `publicId` uuid (una
// fila copiada con spread): su `id` sale como el public_id.
function keysOf(node: object): NodeKeys {
  const metadata = entityMetadataOf(node);
  if (metadata) {
    return { isRow: isPublicIdTable(metadata.tableName), foreignKeys: foreignKeyTargets(metadata) };
  }
  const { id, publicId } = node as { id?: unknown; publicId?: unknown };
  const isRow = internalId(id) !== null && typeof publicId === "string" && UUID.test(publicId);
  return { isRow, foreignKeys: foreignKeyTargetsByName() };
}

function idsOf(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const ids = value.map(internalId);
    return ids.length > 0 && ids.every((id): id is string => id !== null) ? ids : null;
  }
  const id = internalId(value);
  return id === null ? null : [id];
}

function collect(value: unknown, pending: IdsByTable): void {
  if (!isTraversable(value)) return;
  if (Array.isArray(value)) {
    for (const item of value) collect(item, pending);
    return;
  }
  const holder = value as Record<string, unknown>;
  const { foreignKeys } = keysOf(value);
  for (const [key, child] of Object.entries(holder)) {
    const table = referencedTable(holder, key, foreignKeys);
    const ids = table ? idsOf(child) : null;
    if (table && ids) {
      const known = pending.get(table) ?? new Set<string>();
      for (const id of ids) known.add(id);
      pending.set(table, known);
    } else {
      collect(child, pending);
    }
  }
}

async function lookup(pending: IdsByTable): Promise<PublicIdsByTable> {
  const found: PublicIdsByTable = new Map();
  await Promise.all(
    [...pending].map(async ([table, ids]) => {
      const rows: Array<{ id: string; publicId: string }> = await AppDataSource.query(
        `SELECT id::text AS id, public_id::text AS "publicId" FROM ${AppDataSource.driver.escape(table)}
         WHERE id = ANY($1::bigint[])`,
        [[...ids]],
      );
      found.set(table, new Map(rows.map((row) => [row.id, row.publicId])));
    }),
  );
  return found;
}

function transform(value: unknown, found: PublicIdsByTable): unknown {
  if (!isTraversable(value)) return value;
  if (Array.isArray(value)) return value.map((item) => transform(item, found));
  const holder = value as Record<string, unknown>;
  const { isRow, foreignKeys } = keysOf(value);
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(holder)) {
    if (isRow && key === "publicId") continue;
    if (isRow && key === "id") {
      output[key] = holder["publicId"];
      continue;
    }
    const table = referencedTable(holder, key, foreignKeys);
    const ids = table ? idsOf(child) : null;
    if (table && ids) {
      const mapped = ids.map((id) => found.get(table)?.get(id) ?? null);
      output[key] = Array.isArray(child) ? mapped : mapped[0];
    } else {
      output[key] = transform(child, found);
    }
  }
  return output;
}

function isIdKey(key: string): boolean {
  return !EXTERNAL_ID_KEYS.has(key) && (key === "id" || /[a-z](Id|Ids)$/.test(key));
}

// Ultima barrera: si despues de traducir queda un id interno en una clave de id (una
// fila cruda sin publicId, una referencia sin declarar), la respuesta no sale.
export function findLeak(value: unknown, path = "$"): string | null {
  if (!isTraversable(value)) return null;
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const leak = findLeak(item, `${path}[${index}]`);
      if (leak) return leak;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value)) {
    if (isIdKey(key) && idsOf(child)) return `${path}.${key}`;
    const leak = findLeak(child, `${path}.${key}`);
    if (leak) return leak;
  }
  return null;
}

export async function toPublicIds(payload: unknown): Promise<unknown> {
  const pending: IdsByTable = new Map();
  collect(payload, pending);
  const found = pending.size > 0 ? await lookup(pending) : new Map<string, Map<string, string>>();
  const output = transform(payload, found);
  const leak = findLeak(output);
  if (leak) throw new PublicIdLeakError(`Id interno en la respuesta: ${leak}`);
  return output;
}

export function publicIdResponses(_req: Request, res: Response, next: NextFunction): void {
  const holder = res as Response & { [WRAPPED]?: true };
  if (holder[WRAPPED]) {
    next();
    return;
  }
  holder[WRAPPED] = true;
  const send = res.json.bind(res);
  res.json = (body?: unknown) => {
    toPublicIds(body).then(
      (output) => send(output),
      (error: unknown) => {
        console.error("No se pudo traducir la respuesta a ids publicos", error);
        res.status(500);
        send({ error: "Error interno del servidor" });
      },
    );
    return res;
  };
  next();
}

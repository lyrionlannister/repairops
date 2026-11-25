import type { Request, RequestHandler, RequestParamHandler } from "express";
import AppDataSource from "../../config/data-source.js";
import { getCurrentTenantId } from "../../tenancy/tenant-context.js";
import {
  UUID,
  entityMetadataOfTable,
  foreignKeyTargetsByName,
  referencedTable,
} from "./public-id-metadata.js";
import { NOT_FOUND_LABELS } from "./public-id-tables.js";

export class PublicIdNotFoundError extends Error {
  readonly status = 404;
}

interface Reference {
  holder: Record<string, unknown> | unknown[];
  key: string | number;
  table: string;
  publicId: string;
}

const notFound = (table: string): PublicIdNotFoundError =>
  new PublicIdNotFoundError(`No encontramos ${NOT_FOUND_LABELS.get(table) ?? "el registro"}.`);

// El filtro de tenant va en la misma query: un public_id de otro tenant no se
// traduce y responde el mismo 404 que uno inexistente. Las filas globales
// (tenant_id NULL, ej. el catalogo de plantillas del sistema) las autoriza su Dao.
async function internalIds(table: string, publicIds: string[]): Promise<Map<string, string>> {
  const valid = [...new Set(publicIds.filter((value) => UUID.test(value)))];
  if (valid.length === 0) return new Map();
  const tenantColumn = entityMetadataOfTable(table)?.findColumnWithPropertyName("tenantId");
  const tenantFilter = !tenantColumn
    ? ""
    : tenantColumn.isNullable
      ? " AND (tenant_id = $2 OR tenant_id IS NULL)"
      : " AND tenant_id = $2";
  const rows: Array<{ id: string; publicId: string }> = await AppDataSource.query(
    `SELECT id::text AS id, public_id::text AS "publicId" FROM ${AppDataSource.driver.escape(table)}
     WHERE public_id = ANY($1::uuid[])${tenantFilter}`,
    tenantColumn ? [valid, getCurrentTenantId()] : [valid],
  );
  return new Map(rows.map((row) => [row.publicId.toLowerCase(), row.id]));
}

export async function resolvePublicId(table: string, value: unknown): Promise<string> {
  const publicId = typeof value === "string" ? value.toLowerCase() : "";
  const id = (await internalIds(table, [publicId])).get(publicId);
  if (!id) throw notFound(table);
  return id;
}

function addReference(
  references: Reference[],
  holder: Reference["holder"],
  key: Reference["key"],
  table: string,
  value: unknown,
): void {
  if (value === null || value === undefined || value === "") return;
  // Un id interno (numero o texto no-uuid) nunca se acepta: se trata como inexistente.
  if (typeof value !== "string") throw notFound(table);
  references.push({ holder, key, table, publicId: value.toLowerCase() });
}

// tenantId nunca se toma del cliente (el tenant sale del JWT), asi que no se traduce.
function collect(value: unknown, references: Reference[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collect(item, references);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  const holder = value as Record<string, unknown>;
  const byName = foreignKeyTargetsByName();
  for (const [key, child] of Object.entries(holder)) {
    const table = key === "tenantId" ? null : referencedTable(holder, key, byName);
    if (!table) {
      collect(child, references);
      continue;
    }
    if (Array.isArray(child)) {
      child.forEach((item, index) => addReference(references, child, index, table, item));
    } else {
      addReference(references, holder, key, table, child);
    }
  }
}

async function replace(references: Reference[]): Promise<void> {
  const byTable = new Map<string, string[]>();
  for (const reference of references) {
    byTable.set(reference.table, [...(byTable.get(reference.table) ?? []), reference.publicId]);
  }
  const resolved = new Map<string, Map<string, string>>();
  await Promise.all(
    [...byTable].map(async ([table, publicIds]) =>
      resolved.set(table, await internalIds(table, publicIds)),
    ),
  );
  for (const reference of references) {
    const id = resolved.get(reference.table)?.get(reference.publicId);
    if (!id) throw notFound(reference.table);
    (reference.holder as Record<string | number, unknown>)[reference.key] = id;
  }
}

const RESOLVED = Symbol("publicIdsResolved");

// Express 5 expone req.query como getter que re-parsea la URL en cada acceso: mutar
// el objeto no persiste, hay que fijar la copia traducida como propiedad propia.
// Una peticion que atraviesa varios routers pasa varias veces por tenantMiddleware:
// solo la primera traduce (la segunda veria ids internos y responderia 404).
export async function resolveRequestPublicIds(req: Pick<Request, "body" | "query">): Promise<void> {
  const marked = req as typeof req & { [RESOLVED]?: true };
  if (marked[RESOLVED]) return;
  marked[RESOLVED] = true;
  const references: Reference[] = [];
  collect(req.body, references);
  const query: Record<string, unknown> = { ...req.query };
  collect(query, references);
  if (references.length === 0) return;
  await replace(references);
  Object.defineProperty(req, "query", {
    value: query,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

function resolveInto(
  table: string,
  value: unknown,
  onResolved: (id: string) => void,
  res: Parameters<RequestHandler>[1],
  next: Parameters<RequestHandler>[2],
): void {
  resolvePublicId(table, value).then(
    (id) => {
      onResolved(id);
      next();
    },
    (error: unknown) => {
      if (error instanceof PublicIdNotFoundError) res.status(404).json({ error: error.message });
      else next(error);
    },
  );
}

// Para rutas cuyo tenantMiddleware va por ruta (no en router.use): router.param corre
// antes de los middlewares de la ruta, sin tenant en contexto todavia.
export function resolvePublicIdParam(table: string, name = "id"): RequestHandler {
  return (req, res, next) => {
    resolveInto(table, req.params[name], (id) => (req.params[name] = id), res, next);
  };
}

// Un segmento que no es uuid (ej. "counts" frente a /:id) no es un id de esta ruta:
// se deja pasar a la siguiente en vez de responder 404, igual que si /:id no existiera.
export function publicIdParam(table: string): RequestParamHandler {
  return (req, res, next, value: unknown, name: string) => {
    if (typeof value !== "string" || !UUID.test(value)) {
      next("route");
      return;
    }
    resolveInto(table, value, (id) => (req.params[name] = id), res, next);
  };
}

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LookupQueryDto, PageQueryDto } from "../dtos/page-query.dto.js";
import { BusinessError } from "../../http/business-error.js";
import { flattenValidationErrors } from "./validation-errors.js";
import type { PageRequest } from "../types/page.types.js";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_LOOKUP_LIMIT = 20;

const firstValue = (value: unknown): unknown => (Array.isArray(value) ? value[0] : value);

const pick = (query: Record<string, unknown>, keys: string[]): Record<string, unknown> =>
  Object.fromEntries(
    keys
      .map((key): [string, unknown] => [key, firstValue(query[key])])
      .filter(([, value]) => value !== undefined && value !== ""),
  );

async function validated<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<T> {
  const dto = plainToInstance(cls, plain);
  const errors = await validate(dto, { stopAtFirstError: true });
  if (errors.length > 0) throw new BusinessError(flattenValidationErrors(errors).join(". "), 400);
  return dto;
}

// Sin `page` en la query, el endpoint conserva su respuesta historica (array completo):
// las pantallas migran una por una sin romper a las que aun no lo hacen.
export async function readPageQuery(query: Record<string, unknown>): Promise<PageRequest | null> {
  if (firstValue(query["page"]) === undefined) return null;
  const dto = await validated(PageQueryDto, pick(query, ["page", "pageSize", "search"]));
  return {
    page: dto.page,
    pageSize: dto.pageSize ?? DEFAULT_PAGE_SIZE,
    search: dto.search?.trim() || undefined,
  };
}

export async function readLookupQuery(
  query: Record<string, unknown>,
): Promise<{ search?: string; limit: number }> {
  const dto = await validated(LookupQueryDto, pick(query, ["search", "limit"]));
  return { search: dto.search?.trim() || undefined, limit: dto.limit ?? DEFAULT_LOOKUP_LIMIT };
}

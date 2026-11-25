import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { readLookupQuery, readPageQuery } from "../../../../src/core/common/utils/page-query.js";
import { BusinessError } from "../../../../src/core/http/business-error.js";

describe("readPageQuery", () => {
  it("keeps the legacy full list when page is absent", async () => {
    expect(await readPageQuery({ search: "ana" })).toBeNull();
  });

  it("parses page, default size and trimmed search", async () => {
    expect(await readPageQuery({ page: "2", search: "  ana " })).toEqual({
      page: 2,
      pageSize: 10,
      search: "ana",
    });
    expect(await readPageQuery({ page: "1", pageSize: "25", search: "   " })).toEqual({
      page: 1,
      pageSize: 25,
      search: undefined,
    });
  });

  it("rejects invalid values with a 400 in Spanish", async () => {
    await expect(readPageQuery({ page: "0" })).rejects.toMatchObject({
      status: 400,
      message: "La página debe ser 1 o mayor",
    });
    await expect(readPageQuery({ page: "1", pageSize: "500" })).rejects.toMatchObject({
      message: "El tamaño de página no puede ser mayor a 100",
    });
    await expect(readPageQuery({ page: "abc" })).rejects.toBeInstanceOf(BusinessError);
  });
});

describe("readLookupQuery", () => {
  it("defaults the limit and caps it", async () => {
    expect(await readLookupQuery({})).toEqual({ search: undefined, limit: 20 });
    await expect(readLookupQuery({ limit: "51" })).rejects.toMatchObject({ status: 400 });
  });
});

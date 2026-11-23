import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { UpdateLocalDto } from "../../../../src/app_platform/local/dtos/update-local.dto.js";

const parse = async (body: Record<string, unknown>) => {
  const dto = plainToInstance(UpdateLocalDto, body);
  const errors = await validate(dto, { whitelist: true });
  return { dto: dto as unknown as Record<string, unknown>, errors };
};

describe("UpdateLocalDto", () => {
  it("descarta claves que el dueño no puede cambiar (tenantId, id, publicId)", async () => {
    const { dto, errors } = await parse({ name: "Taller", tenantId: "5", id: "1", publicId: "x" });
    expect(errors).toHaveLength(0);
    expect(dto).toEqual({ name: "Taller" });
  });

  it("solo acepta folios enteros desde 1", async () => {
    for (const nextQuoteNumber of [0, -3, 1.5, "10"]) {
      const { errors } = await parse({ nextQuoteNumber });
      expect(errors.length).toBeGreaterThan(0);
    }
    expect((await parse({ nextQuoteNumber: 100, nextCutNumber: 1 })).errors).toHaveLength(0);
  });
});

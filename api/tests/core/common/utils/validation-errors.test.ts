import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { IsNumber, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { flattenValidationErrors } from "../../../../src/core/common/utils/validation-errors.js";

class LineDto {
  @IsString()
  referenceId!: string;

  @IsNumber()
  unitPrice!: number;
}

class ParentDto {
  @IsString()
  localId!: string;

  @ValidateNested({ each: true })
  @Type(() => LineDto)
  items!: LineDto[];
}

describe("flattenValidationErrors", () => {
  it("includes top-level constraint messages", async () => {
    const dto = plainToInstance(ParentDto, { localId: 123, items: [] });
    const errors = await validate(dto);
    expect(flattenValidationErrors(errors)).toContain("localId must be a string");
  });

  it("descends into @ValidateNested children instead of returning an empty array", async () => {
    const dto = plainToInstance(ParentDto, {
      localId: "1",
      items: [{ referenceId: "x", unitPrice: "not-a-number" }],
    });
    const errors = await validate(dto);
    const messages = flattenValidationErrors(errors);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some((m) => m.includes("unitPrice"))).toBe(true);
  });
});

import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { getMetadataStorage } from "class-validator";

const modules = import.meta.glob<Record<string, unknown>>("../../../src/**/*.dto.ts", {
  eager: true,
});

const ENGLISH = /\b(must|should|required|invalid|not found|is not)\b/i;

function dtoClasses(): Array<{ file: string; target: Function }> {
  return Object.entries(modules).flatMap(([file, exports]) =>
    Object.values(exports)
      .filter((value): value is Function => typeof value === "function")
      .map((target) => ({ file, target })),
  );
}

describe("mensajes de validación de los DTOs", () => {
  it("todo decorador de class-validator tiene un message propio en español", () => {
    const storage = getMetadataStorage();
    const problems: string[] = [];
    let checked = 0;

    for (const { file, target } of dtoClasses()) {
      for (const meta of storage.getTargetValidationMetadatas(target, "", true, false)) {
        if (meta.type === "conditionalValidation") continue;
        checked++;
        const where = `${file} ${target.name}.${meta.propertyName} (${meta.name ?? meta.type})`;
        if (typeof meta.message !== "string" || meta.message.length === 0)
          problems.push(`sin message: ${where}`);
        else if (ENGLISH.test(meta.message) || /^[a-z]+[A-Z]\w*\b/.test(meta.message)) {
          problems.push(
            `mensaje en inglés o con nombre de propiedad: ${where} -> "${meta.message}"`,
          );
        }
      }
    }

    expect(checked).toBeGreaterThan(200);
    expect(problems).toEqual([]);
  });
});

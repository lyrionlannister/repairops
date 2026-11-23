import { describe, expect, it } from "vitest";
import { resolveCreditDueDate } from "../../../../src/commerce/customers/utils/credit-due-date.js";

describe("resolveCreditDueDate", () => {
  const today = "2026-11-22";

  it("exige fecha límite en un pago a crédito", () => {
    expect(() => resolveCreditDueDate("credito", undefined, today)).toThrow("fecha límite");
    expect(() => resolveCreditDueDate("credito", "", today)).toThrow("fecha límite");
  });

  it("rechaza fechas inválidas o anteriores a hoy", () => {
    expect(() => resolveCreditDueDate("credito", "22/11/2026", today)).toThrow("inválida");
    expect(() => resolveCreditDueDate("credito", "2026-11-21", today)).toThrow("anterior a hoy");
  });

  it("acepta hoy o una fecha futura", () => {
    expect(resolveCreditDueDate("credito", today, today)).toBe(today);
    expect(resolveCreditDueDate("credito", "2026-12-15", today)).toBe("2026-12-15");
  });

  it("ignora la fecha en métodos que no son crédito", () => {
    expect(resolveCreditDueDate("efectivo", "2026-12-15", today)).toBeNull();
    expect(resolveCreditDueDate("tarjeta", undefined, today)).toBeNull();
  });
});

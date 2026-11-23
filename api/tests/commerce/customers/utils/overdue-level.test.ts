import { describe, expect, it } from "vitest";
import { overdueLevel } from "../../../../src/commerce/customers/utils/overdue-level.js";

describe("overdueLevel", () => {
  it.each([
    ["0.00", "0.00", "none"],
    ["100.00", "24.99", "none"],
    ["100.00", "25.00", "low"],
    ["100.00", "35.00", "low"],
    ["100.00", "35.01", "medium"],
    ["100.00", "50.00", "medium"],
    ["100.00", "50.01", "high"],
    ["0.30", "0.10", "low"],
  ])("saldo %s con %s en mora es %s", (balance, overdue, level) => {
    expect(overdueLevel(balance, overdue)).toBe(level);
  });
});

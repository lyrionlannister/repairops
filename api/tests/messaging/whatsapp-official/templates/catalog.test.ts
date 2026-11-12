import { describe, expect, it } from "vitest";
import { templateCatalog } from "../../../../src/messaging/whatsapp-official/templates/catalog.js";

describe("templateCatalog", () => {
  it("has exactly order_ready at the close of this phase", () => {
    expect(templateCatalog.map((t) => t.key)).toEqual(["order_ready"]);
  });

  it("every entry has the expected shape", () => {
    for (const entry of templateCatalog) {
      expect(entry.key).toBeTruthy();
      expect(entry.metaName).toBeTruthy();
      expect(["UTILITY", "MARKETING"]).toContain(entry.category);
      expect(entry.language).toBeTruthy();
      expect(entry.text).toBeTruthy();
      expect(Array.isArray(entry.variables)).toBe(true);
      expect(entry.triggerEvent).toBeTruthy();
    }
  });

  it("order_ready uses NAMED placeholders matching its variables", () => {
    const entry = templateCatalog.find((t) => t.key === "order_ready")!;
    for (const variable of entry.variables) {
      expect(entry.text).toContain(`{{${variable}}}`);
    }
  });
});

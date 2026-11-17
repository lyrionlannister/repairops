import { describe, expect, it } from "vitest";
import { buildBrandPalette, contrastRatio, DEFAULT_BRAND_PALETTE } from "../../../../src/app_platform/local/utils/brand-palette.js";

describe("buildBrandPalette", () => {
  it("sin color devuelve la paleta azul actual", () => {
    const palette = buildBrandPalette(null);
    expect(palette).toEqual(DEFAULT_BRAND_PALETTE);
    expect([palette.dark, palette.light, palette.border, palette.footer]).toEqual([
      "#1e40af",
      "#eff6ff",
      "#bfdbfe",
      "#2563eb",
    ]);
  });

  it.each(["#ffd600", "#ffffff", "#000000", "#dc2626", "#0f766e", "#7c3aed"])(
    "%s: texto legible sobre fondos derivados",
    (color) => {
      const palette = buildBrandPalette(color);
      expect(palette.base).toBe(color);
      expect(contrastRatio(palette.dark, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.onBrand, palette.base)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.dark, palette.light)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("un amarillo lleva texto oscuro sobre el encabezado", () => {
    expect(buildBrandPalette("#ffd600").onBrand).not.toBe("#ffffff");
  });

  it("un valor mal formado cae a la paleta por defecto", () => {
    expect(buildBrandPalette("red")).toEqual(DEFAULT_BRAND_PALETTE);
  });
});

import { describe, expect, it } from "vitest";
import {
  extractPublicRef,
  generatePublicRef,
  normalizePublicRef,
  PUBLIC_REF_ALPHABET,
} from "../../../../src/commerce/repair-notes/utils/public-ref.js";

describe("generatePublicRef", () => {
  it("genera 8 caracteres solo del alfabeto Crockford", () => {
    for (let i = 0; i < 200; i++) {
      const ref = generatePublicRef();
      expect(ref).toHaveLength(8);
      expect([...ref].every((char) => PUBLIC_REF_ALPHABET.includes(char))).toBe(true);
    }
  });

  it("no repite referencias en una muestra grande", () => {
    const refs = new Set(Array.from({ length: 5000 }, generatePublicRef));
    expect(refs.size).toBe(5000);
  });
});

describe("normalizePublicRef", () => {
  it("pasa a mayusculas y corrige O, I y L", () => {
    expect(normalizePublicRef("7f3k2a9b")).toBe("7F3K2A9B");
    expect(normalizePublicRef("o0il1ll1")).toBe("00111111");
  });
});

describe("extractPublicRef", () => {
  it("lee el ref del mensaje prellenado del QR", () => {
    expect(extractPublicRef("Hola, quiero consultar la nota #1042 de Celulares Pérez (ref: 7F3K2A9B)")).toBe("7F3K2A9B");
  });

  it("tolera minusculas y errores de tecleo", () => {
    expect(extractPublicRef("nota 1 (REF: 7f3k2a9b)")).toBe("7F3K2A9B");
    expect(extractPublicRef("(ref: oi3k2a9b)")).toBe("013K2A9B");
  });

  it("devuelve null sin ref o con uno mal formado", () => {
    expect(extractPublicRef("hola, buen dia")).toBeNull();
    expect(extractPublicRef("(ref: 12345)")).toBeNull();
    expect(extractPublicRef("(ref: UUUUUUUU)")).toBeNull();
  });
});

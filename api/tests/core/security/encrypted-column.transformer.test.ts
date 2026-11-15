import { describe, expect, it, beforeAll } from "vitest";
import { encryptedColumnTransformer } from "../../../src/core/security/encrypted-column.transformer.js";

describe("encryptedColumnTransformer", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);
  });

  it("round-trips a value through to/from", () => {
    const plain = "EAAGm0PX4ZsAbSuperSecretAccessToken123";
    const stored = encryptedColumnTransformer.to(plain);
    expect(stored).not.toBe(plain);
    expect(encryptedColumnTransformer.from(stored)).toBe(plain);
  });

  it("produces a different ciphertext each call (random IV)", () => {
    const plain = "same-value";
    const a = encryptedColumnTransformer.to(plain);
    const b = encryptedColumnTransformer.to(plain);
    expect(a).not.toBe(b);
  });

  it("passes through null/undefined", () => {
    expect(encryptedColumnTransformer.to(null)).toBeNull();
    expect(encryptedColumnTransformer.from(null)).toBeNull();
  });
});

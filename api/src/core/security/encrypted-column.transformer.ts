import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { ValueTransformer } from "typeorm";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// ENCRYPTION_KEY es hex de 64 caracteres (32 bytes) -- una sola clave para
// toda la plataforma (decisión ya cerrada con el usuario: no KDF por tenant,
// ver SPEC-fase4-whatsapp-oficial.md). Se lee en cada uso, no al importar el
// módulo, para que un test pueda definir la env var antes de instanciar.
function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY debe ser un string hex de 64 caracteres (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

// Columna guarda "iv:authTag:ciphertext" en hex -- todo lo necesario para
// descifrar vive en la misma celda, sin tabla aparte de IVs.
export const encryptedColumnTransformer: ValueTransformer = {
  to(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
  },

  from(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const [ivHex, authTagHex, ciphertextHex] = value.split(":");
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, "hex")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  },
};

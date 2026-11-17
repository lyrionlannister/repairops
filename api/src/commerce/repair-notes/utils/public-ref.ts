import { randomInt } from "node:crypto";

// Crockford base32: sin I, L, O, U para que no se confundan al leer o teclear.
export const PUBLIC_REF_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const PUBLIC_REF_LENGTH = 8;

const REF_PATTERN = /^[0-9A-HJKMNP-TV-Z]{8}$/;

// 8 caracteres = 40 bits: no se puede adivinar. Es un identificador de
// consulta (resumen de estado por WhatsApp), nunca de acceso.
export function generatePublicRef(): string {
  let ref = "";
  for (let i = 0; i < PUBLIC_REF_LENGTH; i++) ref += PUBLIC_REF_ALPHABET[randomInt(PUBLIC_REF_ALPHABET.length)];
  return ref;
}

// Convencion Crockford para tolerar errores de tecleo: mayusculas, I/L -> 1, O -> 0.
export function normalizePublicRef(raw: string): string {
  return raw.trim().toUpperCase().replace(/[IL]/g, "1").replace(/O/g, "0");
}

// Busca "(ref: XXXXXXXX)" en el texto de un mensaje; null si no hay uno valido.
export function extractPublicRef(text: string): string | null {
  const match = /ref:\s*([0-9a-z]{8})\b/i.exec(text);
  if (!match?.[1]) return null;
  const ref = normalizePublicRef(match[1]);
  return REF_PATTERN.test(ref) ? ref : null;
}

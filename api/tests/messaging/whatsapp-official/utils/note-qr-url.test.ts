import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { buildNoteQrUrl } from "../../../../src/messaging/whatsapp-official/utils/note-qr-url.js";

const base = { displayPhoneNumber: "5215512345678", controlNumber: 1042, localName: "Celulares Pérez", publicRef: "7F3K2A9B" };

describe("buildNoteQrUrl", () => {
  it("arma la URL wa.me con el mensaje codificado", () => {
    const url = buildNoteQrUrl(base)!;
    expect(url.startsWith("https://wa.me/5215512345678?text=")).toBe(true);
    const text = decodeURIComponent(url.split("?text=")[1]!);
    expect(text).toBe("Hola, quiero consultar la nota #1042 de Celulares Pérez (ref: 7F3K2A9B)");
    expect(url).not.toContain("#");
    expect(url).not.toContain(" ");
  });

  it("deja solo digitos en el numero", () => {
    expect(buildNoteQrUrl({ ...base, displayPhoneNumber: "+52 1 55 1234-5678" })).toContain("wa.me/5215512345678?");
  });

  it("devuelve null sin numero: nunca un QR roto", () => {
    expect(buildNoteQrUrl({ ...base, displayPhoneNumber: null })).toBeNull();
    expect(buildNoteQrUrl({ ...base, displayPhoneNumber: "" })).toBeNull();
  });

  it("trunca el nombre a 40 caracteres como maximo", () => {
    const url = buildNoteQrUrl({ ...base, localName: "X".repeat(80) })!;
    const text = decodeURIComponent(url.split("?text=")[1]!);
    const name = /de (X+) \(ref/.exec(text)![1]!;
    expect(name.length).toBeLessThanOrEqual(40);
    expect(name.length).toBeGreaterThan(20);
  });

  it("recorta el nombre con acentos para que quepa en la version 8 con correccion L", () => {
    const worst = buildNoteQrUrl({
      displayPhoneNumber: "521551234567890",
      controlNumber: 999999,
      localName: "É".repeat(40),
      publicRef: "ZZZZZZZZ",
    })!;
    expect(QRCode.create(worst, { errorCorrectionLevel: "L" }).version).toBeLessThanOrEqual(8);
    expect(decodeURIComponent(worst)).toContain("(ref: ZZZZZZZZ)");
  });

  it("el peor caso ASCII tambien cabe en la version 8", () => {
    const worst = buildNoteQrUrl({
      displayPhoneNumber: "521551234567890",
      controlNumber: 999999,
      localName: "W".repeat(40),
      publicRef: "ZZZZZZZZ",
    })!;
    expect(QRCode.create(worst, { errorCorrectionLevel: "L" }).version).toBeLessThanOrEqual(8);
  });
});

import { describe, expect, it } from "vitest";
import { buildNoteStatusReply } from "../../../../src/messaging/whatsapp-official/utils/note-status-reply.js";

describe("buildNoteStatusReply", () => {
  it.each([
    ["received", "Recibimos tu equipo y pronto lo revisaremos."],
    ["in_repair", "Tu equipo está en reparación."],
    ["done", "¡Tu equipo ya está listo! Ya puedes pasar por él."],
    ["delivered", "Tu equipo ya fue entregado."],
    ["cancelled", "Esta nota fue cancelada. Si tienes dudas, escríbenos."],
  ])("%s", (status, text) => {
    expect(buildNoteStatusReply(7, "Celulares Pérez", status)).toBe(`Nota #7 de Celulares Pérez:\n${text}`);
  });

  it("un estado desconocido no genera respuesta", () => {
    expect(buildNoteStatusReply(7, "Taller", "otro")).toBeNull();
  });
});

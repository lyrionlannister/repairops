const STATUS_TEXT: Record<string, string> = {
  received: "Recibimos tu equipo y pronto lo revisaremos.",
  in_repair: "Tu equipo está en reparación.",
  done: "¡Tu equipo ya está listo! Ya puedes pasar por él.",
  delivered: "Tu equipo ya fue entregado.",
  cancelled: "Esta nota fue cancelada. Si tienes dudas, escríbenos.",
};

// Respuesta automatica por ref: solo confirma el estado. Nunca incluye saldo,
// fechas ni datos del cliente. Un estado desconocido no genera respuesta.
export function buildNoteStatusReply(controlNumber: number, localName: string | null | undefined, status: string): string | null {
  const text = STATUS_TEXT[status];
  if (!text) return null;
  const name = (localName ?? "").trim() || "el taller";
  return `Nota #${controlNumber} de ${name}:\n${text}`;
}

const MAX_NAME_LENGTH = 40;
// Capacidad en bytes de un QR version 8 con correccion L es 154. Con el nombre
// codificado (acentos ocupan 6 caracteres) la URL puede pasarse: se recorta el
// nombre hasta que quepa, para que el QR siga siendo de modulos grandes y legible
// en una impresora termica.
const MAX_URL_LENGTH = 150;

export interface NoteQrInput {
  displayPhoneNumber: string | null | undefined;
  controlNumber: number;
  localName: string | null | undefined;
  publicRef: string;
}

// Unica fuente de la URL del QR: el cliente y el PDF solo dibujan lo que
// devuelve esta funcion. Sin numero de WhatsApp no hay QR (null), nunca un
// QR roto.
export function buildNoteQrUrl({ displayPhoneNumber, controlNumber, localName, publicRef }: NoteQrInput): string | null {
  const phone = (displayPhoneNumber ?? "").replace(/\D/g, "");
  if (!phone) return null;

  const urlFor = (name: string) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quiero consultar la nota #${controlNumber} de ${name} (ref: ${publicRef})`)}`;

  let name = (localName ?? "").trim().slice(0, MAX_NAME_LENGTH) || "el taller";
  let url = urlFor(name);
  while (url.length > MAX_URL_LENGTH && name.length > 1) {
    name = name.slice(0, -1).trimEnd();
    url = urlFor(name);
  }
  return url;
}

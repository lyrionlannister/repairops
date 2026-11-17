import QRCode from "qrcode";

// Matriz del QR como trazo SVG: cada modulo oscuro es un cuadrito de 1x1.
// Nivel de correccion L: la URL de la nota cabe en una version baja y el QR
// queda con modulos grandes, que es lo que una impresora termica necesita.
export function buildQrPath(text: string): { path: string; size: number } {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "L" });
  const size = modules.size;
  let path = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (modules.get(row, col)) path += `M${col} ${row}h1v1h-1z`;
    }
  }
  return { path, size };
}

import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import type { RepairNoteRecord } from "../hooks/use-repair-notes";
import type { LocalRecord } from "../../../app_platform/local/hooks/use-local";
import { fmtCurrency } from "../utils/format";

export interface ThermalReceiptProps {
  note: RepairNoteRecord;
  local: LocalRecord | null;
  serviceTypeNames: string[];
  widthMm: 58 | 80;
}

// Ticket térmico: ancho fijo en mm (el navegador lo imprime a tamaño físico
// real vía @page en print.module.css de la página), tipografía grande y
// pocos adornos -- una impresora térmica no tiene la resolución de un PDF
// carta. El código de barras codifica el número de control para que el
// mismo ticket se pueda localizar escaneándolo (GET /repair-notes/by-control-number/:n).
export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ note, local, serviceTypeNames, widthMm }) => {
  const total = Number(note.totalValue);
  const advance = note.requiresAdvance ? Number(note.advanceValue ?? 0) : 0;
  const balance = total - advance;

  return (
    <div
      style={{
        width: `${widthMm}mm`,
        fontFamily: "'Courier New', monospace",
        color: "#000",
        fontSize: widthMm === 58 ? 10 : 11,
        lineHeight: 1.35,
        padding: "2mm",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "2mm" }}>
        <div style={{ fontSize: widthMm === 58 ? 13 : 15, fontWeight: 700, textTransform: "uppercase" }}>
          {local?.name ?? "Taller de reparación"}
        </div>
        {local?.address && <div>{local.address}</div>}
        {local?.phone && <div>Tel. {local.phone}</div>}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

      <div style={{ textAlign: "center", marginBottom: "2mm" }}>
        <div style={{ fontSize: 9 }}>NOTA DE REPARACIÓN</div>
        <div style={{ fontSize: widthMm === 58 ? 20 : 24, fontWeight: 700 }}>N° {note.controlNumber}</div>
        <div style={{ fontSize: 9 }}>{note.receivedAt}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

      <div>Cliente: {note.customerName}</div>
      {note.contactNumber && <div>Tel: {note.contactNumber}</div>}
      <div>
        Equipo: {note.brand} {note.model}
      </div>
      <div>Falla: {note.reportedFailure}</div>
      {serviceTypeNames.length > 0 && <div>Servicio: {serviceTypeNames.join(", ")}</div>}

      <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Costo total</span>
        <strong>{fmtCurrency(total)}</strong>
      </div>
      {note.requiresAdvance && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Anticipo</span>
            <span>{fmtCurrency(advance)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Saldo a liquidar</span>
            <span>{fmtCurrency(balance)}</span>
          </div>
        </>
      )}

      {local?.warrantyClause && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />
          <div style={{ fontSize: 8 }}>{local.warrantyClause}</div>
        </>
      )}

      <div style={{ marginTop: "3mm", display: "flex", justifyContent: "center" }}>
        <Barcode
          value={String(note.controlNumber)}
          format="CODE128"
          width={widthMm === 58 ? 1.4 : 1.8}
          height={widthMm === 58 ? 36 : 44}
          fontSize={widthMm === 58 ? 10 : 12}
          margin={0}
        />
      </div>

      {note.whatsappQrUrl && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "4mm 0 2mm", textAlign: "center", fontSize: 8, lineHeight: 0 }}>
            <span style={{ background: "#fff", padding: "0 2mm", position: "relative", top: "-1.2mm" }}>✂ CORTAR AQUÍ</span>
          </div>
          <div style={{ textAlign: "center", fontWeight: 700, fontSize: widthMm === 58 ? 10 : 11 }}>CONSULTA TU NOTA POR WHATSAPP</div>
          <div style={{ display: "flex", justifyContent: "center", margin: "2mm 0" }}>
            <QRCodeSVG
              value={note.whatsappQrUrl}
              level="L"
              marginSize={0}
              fgColor="#000000"
              bgColor="#ffffff"
              style={{ width: widthMm === 58 ? "31mm" : "37mm", height: widthMm === 58 ? "31mm" : "37mm" }}
            />
          </div>
          <div style={{ textAlign: "center", fontSize: 9 }}>Escanea y envía el mensaje. Ref. {note.publicRef}</div>
        </>
      )}
    </div>
  );
};


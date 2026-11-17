import type { CSSProperties, FC, ReactNode } from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import type { RepairNoteRecord } from "../hooks/use-repair-notes";
import type { LocalRecord } from "../../../app_platform/local/hooks/use-local";
import { fmtCurrency } from "../utils/format";
import { formatTicketDate, initialsOf } from "../utils/ticket-format";

export interface ThermalReceiptProps {
  note: RepairNoteRecord;
  local: LocalRecord | null;
  serviceTypeNames: string[];
  widthMm: 58 | 80;
}

// Tamaños del diseño por ancho de rollo (px a 96 dpi; el navegador imprime el ancho en mm reales).
const SIZES = {
  80: { pad: "14px 14px 22px", base: 11, name: 16, small: 9.5, label: 9, falla: 8.5, folio: 32, saldo: 20, legal: 8, logo: 38, qr: "37mm", barcode: 190, barcodeH: 40 },
  58: { pad: "11px 10px 18px", base: 10, name: 13, small: 8.5, label: 8, falla: 7.5, folio: 26, saldo: 20, legal: 7.5, logo: 32, qr: "31mm", barcode: 150, barcodeH: 34 },
} as const;

const BLACK = "#000000";
const WHITE = "#ffffff";

const Dashed: FC<{ margin: string }> = ({ margin }) => <div style={{ margin, borderTop: `1px dashed ${BLACK}` }} />;

const Leader: FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <div style={{ display: "flex", alignItems: "baseline" }}>
    <span>{label}</span>
    <span style={{ flexGrow: 1, borderBottom: `1px dotted ${BLACK}`, margin: "0 4px" }} />
    <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
  </div>
);

// Ticket térmico en negro puro, según el diseño "Tickets de nota con QR". Ancho
// fijo en mm (se imprime a tamaño físico real con @page desde la página de
// impresión). El código de barras codifica el número de control para localizar
// la nota escaneándolo; el QR abre WhatsApp con la referencia de la nota.
export const ThermalReceipt: FC<ThermalReceiptProps> = ({ note, local, serviceTypeNames, widthMm }) => {
  const s = SIZES[widthMm];
  const wide = widthMm === 80;
  const total = Number(note.totalValue);
  const advance = note.requiresAdvance ? Number(note.advanceValue ?? 0) : 0;
  const balance = total - advance;
  const name = local?.name ?? "Taller de reparación";

  const label: CSSProperties = { fontSize: s.label, letterSpacing: 1, fontWeight: 500 };
  const rows: Array<[string, ReactNode, boolean]> = [
    ["CLIENTE", note.customerName, true],
    ...(note.contactNumber ? ([["TELÉFONO", note.contactNumber, false]] as Array<[string, ReactNode, boolean]>) : []),
    ["EQUIPO", `${note.brand} ${note.model}`, true],
    ...(serviceTypeNames.length > 0
      ? ([["SERVICIO", serviceTypeNames.join(", "), false]] as Array<[string, ReactNode, boolean]>)
      : []),
  ];

  return (
    <div
      style={{
        width: `${widthMm}mm`,
        boxSizing: "border-box",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        color: BLACK,
        background: WHITE,
        padding: s.pad,
        fontSize: s.base,
        lineHeight: 1.4,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: wide ? 3 : 2, textAlign: "center" }}>
        {local?.logo ? (
          <img
            src={local.logo}
            alt=""
            style={{ width: s.logo, height: s.logo, objectFit: "contain", filter: "grayscale(1) contrast(200%)" }}
          />
        ) : (
          <div
            style={{
              width: s.logo,
              height: s.logo,
              background: BLACK,
              color: WHITE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: wide ? 16 : 14,
              letterSpacing: 1,
            }}
          >
            {initialsOf(name)}
          </div>
        )}
        <div style={{ marginTop: 4, fontSize: s.name, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{name}</div>
        {local?.address && <div style={{ fontSize: s.small }}>{local.address}</div>}
        {local?.phone && <div style={{ fontSize: s.small }}>Tel. {local.phone}</div>}
      </div>

      <div style={{ margin: wide ? "12px 0 10px" : "10px 0 8px", borderTop: `2px solid ${BLACK}`, borderBottom: `1px solid ${BLACK}`, height: 3 }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: wide ? 9 : 8, letterSpacing: wide ? 3 : 2, fontWeight: 500 }}>NOTA DE REPARACIÓN</div>
        <div
          style={{
            margin: "6px auto 0",
            background: BLACK,
            color: WHITE,
            padding: "6px 0 4px",
            fontSize: s.folio,
            fontWeight: 700,
            letterSpacing: 1,
            lineHeight: 1,
          }}
        >
          Nº {note.controlNumber}
        </div>
        <div style={{ marginTop: 6, fontSize: wide ? 10 : 9 }}>
          {formatTicketDate(note.receivedAt)} · {note.receivedTime}
        </div>
      </div>

      <Dashed margin={wide ? "12px 0 8px" : "10px 0 7px"} />

      {wide ? (
        <div style={{ display: "grid", gridTemplateColumns: "62px 1fr", rowGap: 4, columnGap: 6 }}>
          {rows.map(([key, value, bold]) => (
            <div key={key} style={{ display: "contents" }}>
              <div style={label}>{key}</div>
              <div style={{ fontWeight: bold ? 700 : 400 }}>{value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.map(([key, value, bold]) => (
            <div key={key}>
              <div style={label}>{key}</div>
              <div style={{ fontWeight: bold ? 700 : 400 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: wide ? 8 : 7, border: `1px solid ${BLACK}`, padding: wide ? "5px 7px" : "4px 6px" }}>
        <div style={{ fontSize: s.falla, letterSpacing: 1, fontWeight: 500 }}>FALLA REPORTADA</div>
        <div style={{ marginTop: 2 }}>{note.reportedFailure}</div>
      </div>

      <Dashed margin={wide ? "10px 0 8px" : "9px 0 7px"} />

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Leader label="Costo total" value={fmtCurrency(total)} bold />
        {note.requiresAdvance && <Leader label="Anticipo" value={fmtCurrency(advance)} />}
      </div>
      <div
        style={{
          marginTop: wide ? 7 : 6,
          borderTop: `2px solid ${BLACK}`,
          borderBottom: `2px solid ${BLACK}`,
          padding: wide ? "6px 0" : "5px 0",
          display: "flex",
          flexDirection: wide ? "row" : "column",
          alignItems: wide ? "baseline" : "center",
          justifyContent: "space-between",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: wide ? 10 : 8.5, fontWeight: 700, letterSpacing: 1 }}>SALDO A LIQUIDAR</span>
        <span style={{ fontSize: s.saldo, fontWeight: 700 }}>{fmtCurrency(balance)}</span>
      </div>

      {local?.warrantyClause && (
        <div style={{ marginTop: wide ? 9 : 8, fontSize: s.legal, lineHeight: 1.35, textAlign: "justify" }}>{local.warrantyClause}</div>
      )}

      {note.whatsappQrUrl && (
        <>
          <div style={{ margin: `${wide ? 12 : 11}px ${wide ? -14 : -10}px 0`, borderTop: `1px dashed ${BLACK}`, position: "relative", height: 0 }}>
            <span style={{ position: "absolute", left: wide ? 10 : 8, top: -9, background: WHITE, padding: "0 4px", fontSize: 11, lineHeight: 1 }}>✂</span>
          </div>

          <div
            style={{
              marginTop: wide ? 14 : 13,
              border: `2px solid ${BLACK}`,
              padding: wide ? "10px 10px 9px" : "8px 6px 7px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: wide ? 12 : 11, fontWeight: 700, letterSpacing: wide ? 1 : 0.5, textTransform: "uppercase" }}>¿Cómo va tu equipo?</div>
            <div style={{ marginTop: 2, fontSize: s.small }}>Escanea y consúltalo por WhatsApp</div>
            <QRCodeSVG
              value={note.whatsappQrUrl}
              level="L"
              marginSize={0}
              fgColor={BLACK}
              bgColor={WHITE}
              style={{ marginTop: 8, width: s.qr, height: s.qr, display: "block" }}
            />
            <div style={{ marginTop: 7, fontSize: wide ? 9 : 8, letterSpacing: wide ? 2 : 1.5, fontWeight: 500 }}>REF · {note.publicRef}</div>
            <div
              style={{
                marginTop: 7,
                width: "100%",
                borderTop: `1px solid ${BLACK}`,
                paddingTop: wide ? 6 : 5,
                fontSize: wide ? 9 : 8,
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              <div><span style={{ fontWeight: 700 }}>1</span> {wide ? "Abre la cámara y apunta al QR" : "Apunta la cámara al QR"}</div>
              <div><span style={{ fontWeight: 700 }}>2</span> {wide ? "Envía el mensaje ya escrito" : "Envía el mensaje escrito"}</div>
              <div><span style={{ fontWeight: 700 }}>3</span> Recibe el estado de tu nota</div>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: wide ? 14 : 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <Barcode
          value={String(note.controlNumber)}
          format="CODE128"
          width={wide ? 1.8 : 1.4}
          height={s.barcodeH}
          displayValue={false}
          margin={0}
        />
        <div style={{ fontSize: wide ? 10 : 9, letterSpacing: 4 }}>{note.controlNumber}</div>
      </div>

      <div style={{ marginTop: wide ? 12 : 10, textAlign: "center", fontSize: wide ? 10 : 9, fontWeight: 700, letterSpacing: wide ? 1 : 0.5 }}>
        ¡GRACIAS POR TU CONFIANZA!
      </div>
      <div style={{ marginTop: 2, textAlign: "center", fontSize: wide ? 8.5 : 8 }}>Conserva este ticket para recoger tu equipo</div>
    </div>
  );
};

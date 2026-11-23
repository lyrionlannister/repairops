import type { CSSProperties, FC, ReactNode } from "react";
import { describeDevices } from "../utils/devices";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import {
  ThermalTicket,
  TicketBand,
  TicketDashed,
  TicketLeader,
} from "@common/components/ticket/thermal-ticket";
import {
  TICKET_BLACK,
  TICKET_SIZES,
  TICKET_WHITE,
  formatTicketDate,
} from "@common/utils/ticket-format";
import { fmtCurrency } from "../utils/format";
import type { ThermalReceiptProps } from "../props/thermal-receipt-props";

export const ThermalReceipt: FC<ThermalReceiptProps> = ({
  note,
  local,
  serviceTypeNames,
  widthMm,
}) => {
  const s = TICKET_SIZES[widthMm];
  const wide = widthMm === 80;
  const total = Number(note.totalValue);
  const advance = note.requiresAdvance ? Number(note.advanceValue ?? 0) : 0;
  const balance = total - advance;

  const label: CSSProperties = { fontSize: s.label, letterSpacing: 1, fontWeight: 500 };
  const rows: Array<[string, ReactNode, boolean]> = [
    ["CLIENTE", note.customerName, true],
    ...(note.contactNumber
      ? ([["TELÉFONO", note.contactNumber, false]] as Array<[string, ReactNode, boolean]>)
      : []),
    [note.devices.length > 1 ? "EQUIPOS" : "EQUIPO", describeDevices(note.devices), true],
    ...(serviceTypeNames.length > 0
      ? ([["SERVICIO", serviceTypeNames.join(", "), false]] as Array<[string, ReactNode, boolean]>)
      : []),
  ];

  return (
    <ThermalTicket
      local={local}
      widthMm={widthMm}
      documentLabel="NOTA DE REPARACIÓN"
      folio={`Nº ${note.controlNumber}`}
      dateLine={`${formatTicketDate(note.receivedAt)} · ${note.receivedTime}`}
    >
      <TicketDashed margin={wide ? "12px 0 8px" : "10px 0 7px"} />

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

      <div
        style={{
          marginTop: wide ? 8 : 7,
          border: `1px solid ${TICKET_BLACK}`,
          padding: wide ? "5px 7px" : "4px 6px",
        }}
      >
        <div style={{ fontSize: s.falla, letterSpacing: 1, fontWeight: 500 }}>FALLA REPORTADA</div>
        {note.devices.map((device, index) => (
          <div key={index} style={{ marginTop: 2 }}>
            {note.devices.length > 1 && <strong>{`${index + 1}. ${device.brand} ${device.model}: `}</strong>}
            {device.reportedFailure}
            {device.deviceOff && " (apagado)"}
          </div>
        ))}
      </div>

      <TicketDashed margin={wide ? "10px 0 8px" : "9px 0 7px"} />

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <TicketLeader label="Costo total" value={fmtCurrency(total)} bold />
        {note.requiresAdvance && <TicketLeader label="Anticipo" value={fmtCurrency(advance)} />}
      </div>
      <TicketBand widthMm={widthMm} label="SALDO A LIQUIDAR" value={fmtCurrency(balance)} />

      {local?.warrantyClause && (
        <div
          style={{
            marginTop: wide ? 9 : 8,
            fontSize: s.legal,
            lineHeight: 1.35,
            textAlign: "justify",
          }}
        >
          {local.warrantyClause}
        </div>
      )}

      {note.whatsappQrUrl && (
        <>
          <div
            style={{
              margin: `${wide ? 12 : 11}px ${wide ? -14 : -10}px 0`,
              borderTop: `1px dashed ${TICKET_BLACK}`,
              position: "relative",
              height: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: wide ? 10 : 8,
                top: -9,
                background: TICKET_WHITE,
                padding: "0 4px",
                fontSize: 11,
                lineHeight: 1,
              }}
            >
              ✂
            </span>
          </div>

          <div
            style={{
              marginTop: wide ? 14 : 13,
              border: `2px solid ${TICKET_BLACK}`,
              padding: wide ? "10px 10px 9px" : "8px 6px 7px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: wide ? 12 : 11,
                fontWeight: 700,
                letterSpacing: wide ? 1 : 0.5,
                textTransform: "uppercase",
              }}
            >
              ¿Cómo va tu equipo?
            </div>
            <div style={{ marginTop: 2, fontSize: s.small }}>Escanea y consúltalo por WhatsApp</div>
            <QRCodeSVG
              value={note.whatsappQrUrl}
              level="L"
              marginSize={0}
              fgColor={TICKET_BLACK}
              bgColor={TICKET_WHITE}
              style={{ marginTop: 8, width: s.qr, height: s.qr, display: "block" }}
            />
            <div
              style={{
                marginTop: 7,
                fontSize: wide ? 9 : 8,
                letterSpacing: wide ? 2 : 1.5,
                fontWeight: 500,
              }}
            >
              REF · {note.publicRef}
            </div>
            <div
              style={{
                marginTop: 7,
                width: "100%",
                borderTop: `1px solid ${TICKET_BLACK}`,
                paddingTop: wide ? 6 : 5,
                fontSize: wide ? 9 : 8,
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              <div>
                <span style={{ fontWeight: 700 }}>1</span>{" "}
                {wide ? "Abre la cámara y apunta al QR" : "Apunta la cámara al QR"}
              </div>
              <div>
                <span style={{ fontWeight: 700 }}>2</span>{" "}
                {wide ? "Envía el mensaje ya escrito" : "Envía el mensaje escrito"}
              </div>
              <div>
                <span style={{ fontWeight: 700 }}>3</span> Recibe el estado de tu nota
              </div>
            </div>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: wide ? 14 : 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
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

      <div
        style={{
          marginTop: wide ? 12 : 10,
          textAlign: "center",
          fontSize: wide ? 10 : 9,
          fontWeight: 700,
          letterSpacing: wide ? 1 : 0.5,
        }}
      >
        ¡GRACIAS POR TU CONFIANZA!
      </div>
      <div style={{ marginTop: 2, textAlign: "center", fontSize: wide ? 8.5 : 8 }}>
        Conserva este ticket para recoger tu equipo
      </div>
    </ThermalTicket>
  );
};

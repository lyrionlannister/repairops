import type { FC } from "react";
import { TICKET_BLACK, TICKET_SIZES, TICKET_WHITE, initialsOf } from "../../utils/ticket-format";
import type {
  TicketBandProps,
  TicketDashedProps,
  TicketLeaderProps,
  ThermalTicketProps,
} from "../../props/thermal-ticket-props";

export const TicketDashed: FC<TicketDashedProps> = ({ margin }) => (
  <div style={{ margin, borderTop: `1px dashed ${TICKET_BLACK}` }} />
);

export const TicketLeader: FC<TicketLeaderProps> = ({ label, value, bold }) => (
  <div style={{ display: "flex", alignItems: "baseline" }}>
    <span>{label}</span>
    <span style={{ flexGrow: 1, borderBottom: `1px dotted ${TICKET_BLACK}`, margin: "0 4px" }} />
    <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
  </div>
);

export const TicketBand: FC<TicketBandProps> = ({ widthMm, label, value }) => {
  const wide = widthMm === 80;
  return (
    <div
      style={{
        marginTop: wide ? 7 : 6,
        borderTop: `2px solid ${TICKET_BLACK}`,
        borderBottom: `2px solid ${TICKET_BLACK}`,
        padding: wide ? "6px 0" : "5px 0",
        display: "flex",
        flexDirection: wide ? "row" : "column",
        alignItems: wide ? "baseline" : "center",
        justifyContent: "space-between",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: wide ? 10 : 8.5, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: TICKET_SIZES[widthMm].saldo, fontWeight: 700 }}>{value}</span>
    </div>
  );
};

// Marco común de todo ticket térmico: datos del taller, doble regla y bloque de folio.
export const ThermalTicket: FC<ThermalTicketProps> = ({
  local,
  widthMm,
  documentLabel,
  folio,
  dateLine,
  children,
}) => {
  const s = TICKET_SIZES[widthMm];
  const wide = widthMm === 80;
  const name = local?.name ?? "Taller de reparación";

  return (
    <div
      style={{
        width: `${widthMm}mm`,
        boxSizing: "border-box",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        color: TICKET_BLACK,
        background: TICKET_WHITE,
        padding: s.pad,
        fontSize: s.base,
        lineHeight: 1.4,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: wide ? 3 : 2,
          textAlign: "center",
        }}
      >
        {local?.logo ? (
          <img
            src={local.logo}
            alt=""
            style={{
              width: s.logo,
              height: s.logo,
              objectFit: "contain",
              filter: "grayscale(1) contrast(200%)",
            }}
          />
        ) : (
          <div
            style={{
              width: s.logo,
              height: s.logo,
              background: TICKET_BLACK,
              color: TICKET_WHITE,
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
        <div
          style={{
            marginTop: 4,
            fontSize: s.name,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {name}
        </div>
        {local?.address && <div style={{ fontSize: s.small }}>{local.address}</div>}
        {local?.phone && <div style={{ fontSize: s.small }}>Tel. {local.phone}</div>}
      </div>

      <div
        style={{
          margin: wide ? "12px 0 10px" : "10px 0 8px",
          borderTop: `2px solid ${TICKET_BLACK}`,
          borderBottom: `1px solid ${TICKET_BLACK}`,
          height: 3,
        }}
      />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: wide ? 9 : 8, letterSpacing: wide ? 3 : 2, fontWeight: 500 }}>
          {documentLabel}
        </div>
        <div
          style={{
            margin: "6px auto 0",
            background: TICKET_BLACK,
            color: TICKET_WHITE,
            padding: "6px 0 4px",
            fontSize: s.folio,
            fontWeight: 700,
            letterSpacing: 1,
            lineHeight: 1,
          }}
        >
          {folio}
        </div>
        <div style={{ marginTop: 6, fontSize: wide ? 10 : 9 }}>{dateLine}</div>
      </div>

      {children}
    </div>
  );
};

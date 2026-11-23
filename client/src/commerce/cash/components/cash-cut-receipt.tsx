import type { CSSProperties, FC } from "react";
import {
  ThermalTicket,
  TicketBand,
  TicketDashed,
  TicketLeader,
} from "@common/components/ticket/thermal-ticket";
import { TICKET_BLACK, TICKET_SIZES, formatTicketDate } from "@common/utils/ticket-format";
import {
  METHOD_LABELS,
  ORIGIN_LABELS,
  VARIANCE_LABELS,
  formatMoney,
  formatTime,
  varianceKind,
} from "../utils/format";
import type { CashMovementMethod } from "../types/cash";
import type { CashCutReceiptProps } from "../props/cash-cut-receipt-props";

const localDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-CA") : undefined;

export const CashCutReceipt: FC<CashCutReceiptProps> = ({ detail, local, widthMm }) => {
  const { cut, summary, expectedCash } = detail;
  const s = TICKET_SIZES[widthMm];
  const wide = widthMm === 80;
  const kind = varianceKind(cut.variance);
  const cash = summary.byMethod.efectivo;
  const label: CSSProperties = {
    fontSize: s.label,
    letterSpacing: 1,
    fontWeight: 500,
    marginBottom: 3,
  };

  return (
    <ThermalTicket
      local={local}
      widthMm={widthMm}
      documentLabel="CORTE DE CAJA"
      folio={`Nº ${cut.cutNumber}`}
      dateLine={`${formatTicketDate(localDate(cut.closedAt))} · ${cut.closedAt ? formatTime(cut.closedAt) : ""}`}
    >
      <TicketDashed margin={wide ? "12px 0 8px" : "10px 0 7px"} />

      <div style={label}>TURNO</div>
      <TicketLeader label={`Abrió ${formatTime(cut.openedAt)}`} value={cut.openedByName ?? "—"} />
      <TicketLeader
        label={`Cerró ${cut.closedAt ? formatTime(cut.closedAt) : ""}`}
        value={cut.closedByName ?? "—"}
      />
      <TicketLeader label="Movimientos" value={String(cut.movementCount)} />

      <TicketDashed margin={wide ? "10px 0 8px" : "9px 0 7px"} />

      <div style={label}>POR MÉTODO</div>
      {(Object.keys(METHOD_LABELS) as CashMovementMethod[]).map((method) => {
        const amounts = summary.byMethod[method];
        return (
          <div key={method} style={{ marginBottom: 2 }}>
            <TicketLeader
              label={METHOD_LABELS[method]}
              value={`+${formatMoney(amounts?.income ?? "0")}`}
            />
            {amounts && amounts.expense !== "0.00" && (
              <div style={{ paddingLeft: wide ? 12 : 8 }}>
                <TicketLeader label="egresos" value={`-${formatMoney(amounts.expense)}`} />
              </div>
            )}
          </div>
        );
      })}

      {summary.byOrigin.length > 0 && (
        <>
          <TicketDashed margin={wide ? "10px 0 8px" : "9px 0 7px"} />
          <div style={label}>POR ORIGEN</div>
          {summary.byOrigin.map((origin) => (
            <TicketLeader
              key={origin.origin}
              label={`${ORIGIN_LABELS[origin.origin]} (${origin.count})`}
              value={formatMoney(origin.income ?? "0")}
            />
          ))}
        </>
      )}

      <TicketDashed margin={wide ? "10px 0 8px" : "9px 0 7px"} />

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <TicketLeader label="Ingresos" value={formatMoney(summary.totalIncome)} bold />
        <TicketLeader label="Egresos" value={formatMoney(summary.totalExpense)} />
        <TicketLeader label="Neto del turno" value={formatMoney(summary.net)} bold />
      </div>

      <TicketDashed margin={wide ? "10px 0 8px" : "9px 0 7px"} />

      <div style={label}>EFECTIVO EN CAJA</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <TicketLeader label="Fondo inicial" value={formatMoney(cut.openingBalance)} />
        <TicketLeader label="+ Ingresos" value={formatMoney(cash?.income ?? "0")} />
        <TicketLeader label="- Egresos" value={formatMoney(cash?.expense ?? "0")} />
        <TicketLeader label="Esperado" value={formatMoney(expectedCash)} bold />
        <TicketLeader label="Contado" value={formatMoney(cut.closingBalance)} bold />
      </div>
      <TicketBand
        widthMm={widthMm}
        label={VARIANCE_LABELS[kind].toUpperCase()}
        value={formatMoney(cut.variance?.replace(/^-/, "") ?? "0")}
      />

      {cut.varianceReason && (
        <div
          style={{
            marginTop: wide ? 8 : 7,
            border: `1px solid ${TICKET_BLACK}`,
            padding: wide ? "5px 7px" : "4px 6px",
          }}
        >
          <div style={{ fontSize: s.falla, letterSpacing: 1, fontWeight: 500 }}>MOTIVO</div>
          <div style={{ marginTop: 2 }}>{cut.varianceReason}</div>
        </div>
      )}

      <div
        style={{
          marginTop: wide ? 34 : 28,
          display: "flex",
          flexDirection: "column",
          gap: wide ? 30 : 26,
        }}
      >
        {[`Entregó: ${cut.closedByName ?? ""}`, "Recibió"].map((line) => (
          <div
            key={line}
            style={{
              borderTop: `1px solid ${TICKET_BLACK}`,
              paddingTop: 3,
              textAlign: "center",
              fontSize: s.small,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </ThermalTicket>
  );
};

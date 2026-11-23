import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { RepairNotePdfData } from "./repair-note.pdf-data.js";
import { createNoteStyles } from "../theme.js";
import { formatMoney } from "../format-money.js";
import { DocumentHeader } from "../components/header.js";
import { TintCard, PlainCard } from "../components/info-card.js";
import { TotalsCard } from "../components/totals.js";
import { Signatures } from "../components/signatures.js";
import { QrPanel } from "../components/qr-panel.js";
import { FooterBand } from "../components/footer-band.js";
import { longDate, shortDate } from "../format-date.js";

const DEFAULT_CONDITIONS =
  "Aviso: La empresa no se hace responsable por equipos con más de 10 días de haber ingresado al taller de " +
  "servicio a partir de la fecha. Costo de almacenaje: $10.00/día. A los 20 días el equipo saldrá a remate. " +
  "Garantía de 1 mes a partir de la fecha de entrega sobre la falla reparada; la garantía no aplica en equipos " +
  "mojados y golpeados. En pantallas estrelladas o con rayas, NO APLICA GARANTÍA.";

// Nota de reparación en una sola hoja carta, según el diseño "Tickets de nota con QR".
export const RepairNoteDocument: React.FC<{ data: RepairNotePdfData }> = ({ data }) => {
  const styles = createNoteStyles(data.palette);
  const name = data.local.name ?? "Reparación de Celulares y Tablets";
  const single = data.devices.length === 1 ? data.devices[0] : null;
  const deviceTitle = single ? `${single.brand} ${single.model}` : `${data.devices.length} equipos`;
  const serviceLine = [
    single && single.serviceTypeNames.length > 0 && `Servicio: ${single.serviceTypeNames.join(", ")}`,
    single?.deviceOff && "Equipo apagado",
  ]
    .filter(Boolean)
    .join(" · ");
  const warranty = data.hasWarranty
    ? `Con garantía${data.hasExtendedWarranty ? ` extendida (${data.extendedWarrantyDays ?? "?"} días)` : ""}`
    : "Sin garantía";
  const falla = single
    ? [{ label: "FALLA REPORTADA", text: single.reportedFailure }]
    : data.devices.map((device, index) => ({
        label: [
          `EQUIPO ${index + 1} · ${device.brand} ${device.model}`,
          device.serviceTypeNames.length > 0 && device.serviceTypeNames.join(", "),
          device.deviceOff && "APAGADO",
        ]
          .filter(Boolean)
          .join(" · ")
          .toUpperCase(),
        text: device.reportedFailure,
      }));
  if (data.additionalFindings) falla.push({ label: "HALLAZGOS ADICIONALES", text: data.additionalFindings });
  const hasTechnicianInfo = Boolean(data.assignedEmployeeName || data.technicianNotes);

  const totalsRows: Array<{ label: string; value: string }> = [{ label: "Costo total", value: formatMoney(data.totalValue) }];
  if (data.requiresAdvance) totalsRows.push({ label: "Anticipo", value: formatMoney(data.advanceValue) });
  if (data.deliveryDate) totalsRows.push({ label: "Entrega estimada", value: shortDate(data.deliveryDate) });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <DocumentHeader
          styles={styles}
          local={data.local}
          folioLabel="NOTA DE REPARACIÓN"
          folioValue={`Nº ${data.controlNumber}`}
          folioDate={`${longDate(data.receivedAt)} · ${data.receivedTime}`}
        />

        <View style={styles.body}>
          <View style={styles.twoCols} wrap={false}>
            <TintCard styles={styles} label="CLIENTE" title={data.customerName} sub={data.contactNumber ? `Tel. ${data.contactNumber}` : null} />
            <TintCard styles={styles} label="EQUIPO" title={deviceTitle} sub={serviceLine || null} />
          </View>

          <PlainCard styles={styles} blocks={falla} />

          {hasTechnicianInfo && (
            <View style={styles.plainCard} wrap={false}>
              <Text style={styles.cardLabel}>OBSERVACIONES DEL TÉCNICO</Text>
              {data.assignedEmployeeName && <Text style={styles.cardText}>Técnico: {data.assignedEmployeeName}</Text>}
              {data.technicianNotes && <Text style={styles.cardText}>{data.technicianNotes}</Text>}
            </View>
          )}

          <View style={styles.twoCols} wrap={false}>
            <View style={styles.conditions}>
              <Text style={styles.cardLabel}>CONDICIONES</Text>
              <Text style={styles.warrantyLine}>{warranty}</Text>
              <Text style={styles.conditionsText}>{data.local.warrantyClause ?? DEFAULT_CONDITIONS}</Text>
            </View>
            <TotalsCard styles={styles} rows={totalsRows} balanceLabel="SALDO A LIQUIDAR" balanceValue={formatMoney(data.balance)} />
          </View>

          <Signatures styles={styles} labels={["Firma del cliente", `Recibe: ${name}`]} />
        </View>

        <QrPanel styles={styles} url={data.qrUrl} publicRef={data.publicRef} />

        <FooterBand styles={styles} left="Conserva esta nota para recoger tu equipo" right="¡Gracias por tu confianza!" />
      </Page>
    </Document>
  );
};

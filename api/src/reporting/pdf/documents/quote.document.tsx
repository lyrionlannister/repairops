import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { QuotePdfData } from "./quote.pdf-data.js";
import { createNoteStyles } from "../theme.js";
import { formatMoney } from "../format-money.js";
import { longDate, shortDate } from "../format-date.js";
import { DocumentHeader } from "../components/header.js";
import { TintCard, PlainCard } from "../components/info-card.js";
import { TotalsCard } from "../components/totals.js";
import { Signatures } from "../components/signatures.js";
import { FooterBand } from "../components/footer-band.js";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

// Cotización en una sola hoja carta, mismo diseño que la nota de reparación
// (repair-note.document.tsx) vía los componentes compartidos de components/.
export const QuoteDocument: React.FC<{ data: QuotePdfData }> = ({ data }) => {
  const styles = createNoteStyles(data.palette);
  const name = data.local.name ?? "Reparación de Celulares y Tablets";
  const isRepair = data.kind === "repair";
  const serviceLine = data.serviceTypeNames.length > 0 ? `Servicio: ${data.serviceTypeNames.join(", ")}` : null;

  const totalsRows: Array<{ label: string; value: string }> = [
    { label: "Válida hasta", value: shortDate(data.validUntil) },
    { label: "Estado", value: STATUS_LABELS[data.status] ?? data.status },
  ];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <DocumentHeader
          styles={styles}
          local={data.local}
          folioLabel="COTIZACIÓN"
          folioValue={`Nº ${data.id}`}
          folioDate={longDate(data.createdAt)}
        />

        <View style={styles.body}>
          <View style={styles.twoCols} wrap={false}>
            <TintCard styles={styles} label="CLIENTE" title={data.customerName} sub={data.contactNumber ? `Tel. ${data.contactNumber}` : null} />
            {isRepair && (
              <TintCard styles={styles} label="EQUIPO" title={`${data.brand} ${data.model}`} sub={serviceLine} />
            )}
          </View>

          {isRepair && data.reportedFailure && (
            <PlainCard styles={styles} blocks={[{ label: "FALLA REPORTADA", text: data.reportedFailure }]} />
          )}

          <View style={styles.tableCard} wrap={false}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.colDescription, styles.tableHeaderCell]}>Descripción</Text>
              <Text style={[styles.colQty, styles.tableHeaderCell]}>Cant.</Text>
              <Text style={[styles.colPrice, styles.tableHeaderCell]}>Precio</Text>
              <Text style={[styles.colSubtotal, styles.tableHeaderCell]}>Subtotal</Text>
            </View>
            {data.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colPrice}>{formatMoney(item.unitPrice)}</Text>
                <Text style={styles.colSubtotal}>{formatMoney(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.twoCols} wrap={false}>
            <View style={{ flex: 1 }} />
            <TotalsCard styles={styles} rows={totalsRows} balanceLabel="TOTAL" balanceValue={formatMoney(data.totalValue)} />
          </View>

          <Signatures styles={styles} labels={["Firma de conformidad del cliente", `Elaboró: ${name}`]} />
        </View>

        <FooterBand styles={styles} left="Cotización sujeta a la vigencia indicada" right="¡Gracias por tu confianza!" />
      </Page>
    </Document>
  );
};

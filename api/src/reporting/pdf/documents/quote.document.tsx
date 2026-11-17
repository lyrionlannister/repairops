import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { QuotePdfData } from "./quote.pdf-data.js";
import { createStyles } from "../theme.js";
import { formatMoney } from "../format-money.js";
import { Header } from "../components/header.js";
import { Field } from "../components/info-card.js";
import { TotalBar } from "../components/totals.js";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};

export const QuoteDocument: React.FC<{ data: QuotePdfData }> = ({ data }) => {
  const styles = createStyles(data.palette);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header
          styles={styles}
          local={data.local}
          side={
            <>
              <Text style={styles.docTitle}>Cotización</Text>
              <Text style={styles.docDate}>Fecha: {formatDate(data.createdAt)}</Text>
            </>
          }
        />

        <View style={styles.row}>
          <Field styles={styles} label="Cliente" value={data.customerName} flex />
          <Field styles={styles} label="Contacto" value={data.contactNumber ?? "—"} flex />
          <Field styles={styles} label="Válida hasta" value={formatDate(data.validUntil)} flex />
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDescription, styles.headerCell]}>Descripción</Text>
            <Text style={[styles.colQuantity, styles.headerCell]}>Cant.</Text>
            <Text style={[styles.colPrice, styles.headerCell]}>Precio</Text>
            <Text style={[styles.colSubtotal, styles.headerCell]}>Subtotal</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatMoney(item.unitPrice)}</Text>
              <Text style={styles.colSubtotal}>{formatMoney(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <TotalBar styles={styles} label="TOTAL" value={formatMoney(data.totalValue)} />

        <Text style={styles.status}>{STATUS_LABELS[data.status] ?? data.status}</Text>
      </Page>
    </Document>
  );
};

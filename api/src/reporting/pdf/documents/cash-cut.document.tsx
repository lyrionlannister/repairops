import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { CashCutPdfData } from "./cash-cut.pdf-data.js";
import { createNoteStyles } from "../theme.js";
import { formatMoney } from "../format-money.js";
import { longDate } from "../format-date.js";
import { DocumentHeader } from "../components/header.js";
import { TintCard, PlainCard } from "../components/info-card.js";
import { TotalsCard } from "../components/totals.js";
import { Signatures } from "../components/signatures.js";
import { FooterBand } from "../components/footer-band.js";

// Corte de caja en carta, con el mismo lenguaje visual que la nota y la cotización.
export const CashCutDocument: React.FC<{ data: CashCutPdfData }> = ({ data }) => {
  const styles = createNoteStyles(data.palette);
  const varianceLabel = data.variance.startsWith("-")
    ? "FALTANTE"
    : data.variance === "0.00"
      ? "SIN DIFERENCIA"
      : "SOBRANTE";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <DocumentHeader
          styles={styles}
          local={data.local}
          folioLabel="CORTE DE CAJA"
          folioValue={`Nº ${data.id}`}
          folioDate={longDate(data.closedDate)}
        />

        <View style={styles.body}>
          <View style={styles.twoCols} wrap={false}>
            <TintCard
              styles={styles}
              label="APERTURA"
              title={data.openedByName}
              sub={data.openedAt}
            />
            <TintCard
              styles={styles}
              label="CIERRE"
              title={data.closedByName}
              sub={data.closedAt}
            />
          </View>

          <View style={styles.twoCols} wrap={false}>
            <View style={[styles.tableCard, { flex: 1 }]}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.colDescription, styles.tableHeaderCell]}>Método</Text>
                <Text style={[styles.colPrice, styles.tableHeaderCell]}>Ingresos</Text>
                <Text style={[styles.colSubtotal, styles.tableHeaderCell]}>Egresos</Text>
              </View>
              {data.byMethod.map((row) => (
                <View key={row.label} style={styles.tableRow}>
                  <Text style={styles.colDescription}>{row.label}</Text>
                  <Text style={styles.colPrice}>{formatMoney(row.income)}</Text>
                  <Text style={styles.colSubtotal}>{formatMoney(row.expense)}</Text>
                </View>
              ))}
            </View>

            <TotalsCard
              styles={styles}
              rows={[
                { label: "Fondo inicial", value: formatMoney(data.openingBalance) },
                { label: "+ Ingresos en efectivo", value: formatMoney(data.cashIncome) },
                { label: "- Egresos en efectivo", value: formatMoney(data.cashExpense) },
                { label: "Efectivo esperado", value: formatMoney(data.expectedCash) },
                { label: "Efectivo contado", value: formatMoney(data.countedCash) },
              ]}
              balanceLabel={varianceLabel}
              balanceValue={formatMoney(data.variance)}
            />
          </View>

          {data.varianceReason && (
            <PlainCard
              styles={styles}
              blocks={[{ label: "MOTIVO DE LA DIFERENCIA", text: data.varianceReason }]}
            />
          )}

          {data.byOrigin.length > 0 && (
            <View style={styles.tableCard} wrap={false}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.colDescription, styles.tableHeaderCell]}>Origen</Text>
                <Text style={[styles.colQty, styles.tableHeaderCell]}>Mov.</Text>
                <Text style={[styles.colPrice, styles.tableHeaderCell]}>Ingresos</Text>
                <Text style={[styles.colSubtotal, styles.tableHeaderCell]}>Egresos</Text>
              </View>
              {data.byOrigin.map((row) => (
                <View key={row.label} style={styles.tableRow}>
                  <Text style={styles.colDescription}>{row.label}</Text>
                  <Text style={styles.colQty}>{row.count}</Text>
                  <Text style={styles.colPrice}>{formatMoney(row.income)}</Text>
                  <Text style={styles.colSubtotal}>{formatMoney(row.expense)}</Text>
                </View>
              ))}
              <View style={styles.tableRow}>
                <Text style={[styles.colDescription, { fontWeight: 700 }]}>Neto del turno</Text>
                <Text style={styles.colQty} />
                <Text style={styles.colPrice}>{formatMoney(data.totalIncome)}</Text>
                <Text style={styles.colSubtotal}>{formatMoney(data.totalExpense)}</Text>
              </View>
            </View>
          )}

          {data.movements.length > 0 && (
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow} fixed>
                <Text style={[styles.colQty, styles.tableHeaderCell, { textAlign: "left", width: 58 }]}>
                  Hora
                </Text>
                <Text style={[styles.colPrice, styles.tableHeaderCell, { textAlign: "left" }]}>
                  Tipo
                </Text>
                <Text style={[styles.colPrice, styles.tableHeaderCell, { textAlign: "left" }]}>
                  Método
                </Text>
                <Text style={[styles.colDescription, styles.tableHeaderCell]}>Concepto</Text>
                <Text style={[styles.colSubtotal, styles.tableHeaderCell]}>Monto</Text>
              </View>
              {data.movements.map((row, index) => (
                <View key={index} style={styles.tableRow} wrap={false}>
                  <Text style={[styles.colQty, { textAlign: "left", width: 58 }]}>{row.time}</Text>
                  <Text style={[styles.colPrice, { textAlign: "left" }]}>{row.type}</Text>
                  <Text style={[styles.colPrice, { textAlign: "left" }]}>{row.method}</Text>
                  <Text style={styles.colDescription}>{row.note}</Text>
                  <Text style={styles.colSubtotal}>
                    {row.type === "Egreso" ? "-" : ""}
                    {formatMoney(row.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Signatures styles={styles} labels={[`Entregó: ${data.closedByName}`, "Recibió"]} />
        </View>

        <FooterBand
          styles={styles}
          left={`Neto del turno ${formatMoney(data.net)}`}
          right="Corte de caja"
        />
      </Page>
    </Document>
  );
};

import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { RepairNotePdfData } from "./repair-note.pdf-data.js";
import { createStyles } from "../theme.js";
import { formatMoney } from "../format-money.js";
import { Header } from "../components/header.js";
import { Check, Field, SectionLabel } from "../components/info-card.js";
import { Signatures } from "../components/signatures.js";
import { LegalFooter } from "../components/legal-footer.js";
import { QrPanel } from "../components/qr-panel.js";
import { TotalsGrid } from "../components/totals.js";

const LEGAL_NOTICE =
  "Aviso: La empresa no se hace responsable por equipos con más de 10 días de haber ingresado al taller de " +
  "servicio a partir de la fecha. Costo de almacenaje: $10.00/día. A los 20 días el equipo saldrá a remate. " +
  "Garantía de 1 mes a partir de la fecha de entrega sobre la falla reparada; la garantía no aplica en equipos " +
  "mojados y golpeados. En pantallas estrelladas o con rayas, NO APLICA GARANTÍA.";

const dateParts = (value: string | null) => {
  if (!value) return { dia: "--", mes: "--", anio: "--" };
  const [y = "--", m = "--", d = "--"] = value.split("-");
  return { dia: d, mes: m, anio: y };
};

export const RepairNoteDocument: React.FC<{ data: RepairNotePdfData }> = ({ data }) => {
  const styles = createStyles(data.palette);
  const received = dateParts(data.receivedAt);
  const delivery = dateParts(data.deliveryDate);
  const hasTechnicianInfo = Boolean(data.assignedEmployeeName || data.technicianNotes);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header
          styles={styles}
          local={data.local}
          subtitle="Cambio de Cristales · Software y Cambios de Compañías · Cambio de Touch o Pantallas"
          side={
            <>
              <Text style={styles.sideLabel}>Número de Control</Text>
              <Text style={styles.folio}>N° {data.controlNumber}</Text>
              <View style={styles.dateRow}>
                {[
                  { label: "DÍA", value: received.dia },
                  { label: "MES", value: received.mes },
                  { label: "AÑO", value: received.anio.slice(-2) },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.dateBox}>
                    <Text style={styles.dateBoxLabel}>{label}</Text>
                    <Text style={styles.dateBoxValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </>
          }
        />

        <View style={styles.row}>
          <Field styles={styles} label="Nombre del Cliente" value={data.customerName} flex />
          <Field styles={styles} label="Celular / Contacto" value={data.contactNumber ?? ""} />
        </View>

        <SectionLabel styles={styles}>Datos del Equipo</SectionLabel>
        <View style={styles.sectionBody}>
          <View style={styles.rowFlush}>
            <Field styles={styles} label="Marca" value={data.brand} />
            <Field styles={styles} label="Modelo" value={data.model} flex />
          </View>
          <Field styles={styles} label="Falla Reportada" value={data.reportedFailure} />
          {data.additionalFindings && (
            <Field styles={styles} label="Hallazgos Adicionales" value={data.additionalFindings} />
          )}
        </View>

        <SectionLabel styles={styles}>Tipo de Servicio Requerido por el Cliente</SectionLabel>
        <View style={styles.sectionBody}>
          <View style={styles.checksRow}>
            {data.serviceTypeNames.map((name) => (
              <Check key={name} styles={styles} checked label={name} />
            ))}
            <Check styles={styles} checked={data.deviceOff} label="Equipo Apagado" />
          </View>
          <View style={styles.checksRow}>
            <Check styles={styles} checked={data.hasWarranty} label="Con Garantía" />
            <Check styles={styles} checked={!data.hasWarranty} label="Sin Garantía" />
            {data.hasExtendedWarranty && (
              <Text style={styles.note}>Garantía extendida: {data.extendedWarrantyDays} días</Text>
            )}
          </View>
        </View>

        {hasTechnicianInfo && (
          <>
            <SectionLabel styles={styles}>Observaciones del Técnico</SectionLabel>
            <View style={styles.sectionBody}>
              {data.assignedEmployeeName && (
                <Field styles={styles} label="Técnico" value={data.assignedEmployeeName} />
              )}
              {data.technicianNotes && <Text style={styles.bodyText}>{data.technicianNotes}</Text>}
            </View>
          </>
        )}

        <QrPanel styles={styles} url={data.qrUrl} publicRef={data.publicRef} />

        <Signatures styles={styles} labels={["Ejecutivo Responsable", "Firma de Autorización del Cliente"]} />

        <LegalFooter styles={styles}>{LEGAL_NOTICE}</LegalFooter>

        <TotalsGrid
          styles={styles}
          cells={[
            { label: "Costo de Reparación", value: formatMoney(data.totalValue) },
            { label: "Anticipo", value: data.requiresAdvance ? formatMoney(data.advanceValue) : "—" },
            {
              label: "Fecha de Entrega",
              value: data.deliveryDate ? `${delivery.dia}/${delivery.mes}/${delivery.anio}` : "—",
            },
            { label: "Total a Liquidar", value: formatMoney(data.balance) },
          ]}
        />
      </Page>
    </Document>
  );
};

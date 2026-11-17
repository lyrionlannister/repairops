import { StyleSheet } from "@react-pdf/renderer";
import type { BrandPalette } from "../../app_platform/local/utils/brand-palette.js";

// Unico lugar donde los documentos de carta definen color, tipografia y
// tamanos. Los colores de marca salen de la paleta del tenant; el resto
// (tinta, grises, rojo del folio) es fijo y semantico.
export const INK = "#111827";
export const MUTED = "#6b7280";
export const FAINT = "#9ca3af";
export const LINE = "#e5e7eb";
export const SOFT_LINE = "#f3f4f6";
export const FOLIO_RED = "#dc2626";
export const QR_INK = "#000000";
export const QR_PAPER = "#ffffff";

// Diseño "Tickets de nota con QR": franja de encabezado oscura con logo/folio,
// tarjetas de dos tonos, tarjeta de totales, firmas al fondo y franja final.
// Única definición de este layout -- todo documento de carta (nota, cotización)
// comparte estos estilos vía los componentes de components/, nunca redefine
// su propio JSX de encabezado/tarjetas/totales.
export const createNoteStyles = (p: BrandPalette) =>
  StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 9.75, color: INK, flexDirection: "column" },
    header: { backgroundColor: p.dark, paddingVertical: 24, paddingHorizontal: 36, flexDirection: "row", alignItems: "center", gap: 15 },
    logoBox: { width: 48, height: 48, borderRadius: 10, backgroundColor: QR_PAPER, alignItems: "center", justifyContent: "center" },
    logo: { width: 40, height: 40, objectFit: "contain" },
    logoInitials: { fontSize: 18, fontWeight: 700, color: p.dark },
    company: { flex: 1, gap: 2 },
    companyName: { fontSize: 18, fontWeight: 700, color: p.onBrand },
    companyLine: { fontSize: 9.4, color: p.border },
    folioCard: { backgroundColor: QR_PAPER, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16, alignItems: "flex-end" },
    folioLabel: { fontSize: 7.9, fontWeight: 700, color: MUTED },
    folio: { fontSize: 27, fontWeight: 700, color: FOLIO_RED },
    folioDate: { fontSize: 8.6, color: MUTED },
    body: { flexGrow: 1, paddingTop: 21, paddingHorizontal: 36, gap: 13.5 },
    twoCols: { flexDirection: "row", gap: 13.5 },
    tintCard: { flex: 1, backgroundColor: p.light, borderWidth: 1, borderColor: p.border, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 13.5 },
    plainCard: { borderWidth: 1, borderColor: LINE, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 13.5 },
    cardLabelTint: { fontSize: 7.9, fontWeight: 700, color: p.dark },
    cardLabel: { fontSize: 7.9, fontWeight: 700, color: MUTED },
    cardTitle: { fontSize: 12, fontWeight: 700, marginTop: 4 },
    cardSub: { fontSize: 9.75, color: MUTED, marginTop: 1 },
    cardText: { fontSize: 10.5, marginTop: 4 },
    conditions: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 13.5, gap: 4 },
    conditionsText: { fontSize: 8.6, color: "#374151", lineHeight: 1.4 },
    warrantyLine: { fontSize: 8.6, fontWeight: 700, color: p.dark },
    tableCard: { borderWidth: 1, borderColor: LINE, borderRadius: 9, overflow: "hidden" },
    tableHeaderRow: { flexDirection: "row", backgroundColor: p.light, paddingVertical: 6, paddingHorizontal: 13.5 },
    tableHeaderCell: { fontSize: 7.9, fontWeight: 700, color: p.dark, textTransform: "uppercase" },
    tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 13.5, borderTopWidth: 1, borderTopColor: SOFT_LINE },
    colDescription: { flex: 1, fontSize: 9.75 },
    colQty: { width: 40, fontSize: 9.75, textAlign: "right" },
    colPrice: { width: 65, fontSize: 9.75, textAlign: "right" },
    colSubtotal: { width: 70, fontSize: 9.75, textAlign: "right", fontWeight: 700 },
    totalsCard: { width: 218, borderWidth: 1, borderColor: LINE, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 13.5, gap: 5 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between" },
    totalsKey: { color: MUTED },
    totalsVal: { fontWeight: 700 },
    balanceRow: { marginTop: 2, borderTopWidth: 1.5, borderTopColor: p.dark, paddingTop: 7, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    balanceLabel: { fontSize: 8.6, fontWeight: 700, color: p.dark },
    balanceValue: { fontSize: 16.5, fontWeight: 700, color: p.dark },
    signatures: { marginTop: "auto", flexDirection: "row", gap: 30, paddingTop: 12, paddingBottom: 14, paddingHorizontal: 6 },
    signatureBox: { flex: 1, borderTopWidth: 1, borderTopColor: FAINT, paddingTop: 4, textAlign: "center", fontSize: 8.6, color: MUTED },
    qrPanel: { marginHorizontal: 36, marginTop: 13.5, marginBottom: 21, flexDirection: "row", alignItems: "center", gap: 19.5, backgroundColor: p.light, borderWidth: 1, borderColor: p.border, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 19.5 },
    qrFrame: { backgroundColor: QR_PAPER, borderWidth: 1, borderColor: p.border, borderRadius: 9, padding: 7.5, alignItems: "center", gap: 3 },
    qrRef: { fontSize: 7.5, fontWeight: 700, color: MUTED },
    qrText: { flex: 1, gap: 6 },
    qrTitle: { fontSize: 15, fontWeight: 700, color: p.dark },
    qrHint: { fontSize: 10, color: "#1f2937" },
    step: { flexDirection: "row", alignItems: "center", gap: 7.5 },
    stepDot: { width: 16.5, height: 16.5, borderRadius: 8.25, backgroundColor: p.dark, color: p.onBrand, fontSize: 9, fontWeight: 700, textAlign: "center", paddingTop: 3.5 },
    footer: { backgroundColor: p.base, paddingVertical: 7.5, paddingHorizontal: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 8.25 },
    footerLeft: { color: p.border },
    footerRight: { color: p.onBrand, fontWeight: 700 },
  });

export type NoteStyles = ReturnType<typeof createNoteStyles>;

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
export const PAPER_TINT = "#f9fafb";
export const FOLIO_RED = "#dc2626";
export const QR_INK = "#000000";
export const QR_PAPER = "#ffffff";

export const createStyles = (p: BrandPalette) =>
  StyleSheet.create({
    page: { padding: 24, fontFamily: "Helvetica", fontSize: 10, color: INK },
    accentBar: { height: 4, backgroundColor: p.base, marginBottom: 10 },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 10, borderBottom: 1, borderBottomColor: LINE },
    logoBox: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
    logo: { width: 56, height: 56, objectFit: "contain" },
    logoPlaceholder: { width: 50, height: 50, borderWidth: 1.5, borderColor: "#d1d5db", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
    logoPlaceholderText: { fontSize: 7, color: FAINT, textAlign: "center" },
    companyInfo: { flex: 1 },
    companyName: { fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: p.dark },
    companySubtitle: { fontSize: 7.5, color: MUTED, marginTop: 3 },
    companyPhone: { fontSize: 9, fontWeight: 700, color: INK, marginTop: 3 },
    companyAddress: { fontSize: 7.5, color: MUTED, marginTop: 1 },
    headerSide: { alignItems: "flex-end", gap: 6, minWidth: 120 },
    sideLabel: { fontSize: 7, fontWeight: 700, textTransform: "uppercase", color: MUTED, textAlign: "right" },
    folio: { fontSize: 30, fontWeight: 700, color: FOLIO_RED, textAlign: "right" },
    docTitle: { fontSize: 18, fontWeight: 700, color: p.dark, textAlign: "right" },
    docDate: { fontSize: 8, color: MUTED, textAlign: "right" },
    dateRow: { flexDirection: "row", gap: 2 },
    dateBox: { textAlign: "center", backgroundColor: p.light, borderWidth: 1, borderColor: p.border, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 7, minWidth: 30 },
    dateBoxLabel: { fontSize: 6, fontWeight: 700, color: p.dark, textTransform: "uppercase" },
    dateBoxValue: { fontSize: 12, fontWeight: 700, color: INK },
    row: { flexDirection: "row", gap: 20, paddingVertical: 8, borderBottom: 1, borderBottomColor: SOFT_LINE },
    rowFlush: { flexDirection: "row", gap: 20, paddingTop: 0, paddingBottom: 8 },
    field: { flexDirection: "column", gap: 2 },
    fieldFlex: { flexDirection: "column", gap: 2, flex: 1 },
    fieldLabel: { fontSize: 7, fontWeight: 700, color: MUTED, textTransform: "uppercase" },
    fieldValue: { fontSize: 10, marginBottom: 4, color: INK, borderBottom: 1, borderBottomColor: LINE, paddingBottom: 2 },
    sectionLabel: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingHorizontal: 12, backgroundColor: p.light, borderTop: 1, borderTopColor: p.border, borderBottom: 1, borderBottomColor: p.border },
    sectionLabelBar: { width: 2.5, height: 10, backgroundColor: p.dark },
    sectionLabelText: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: p.dark },
    sectionBody: { paddingVertical: 8, paddingHorizontal: 12, borderBottom: 1, borderBottomColor: SOFT_LINE },
    checksRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 6 },
    checkItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    checkBoxOn: { width: 9, height: 9, borderRadius: 2, backgroundColor: p.dark, borderWidth: 1, borderColor: p.dark },
    checkBoxOff: { width: 9, height: 9, borderRadius: 2, borderWidth: 1, borderColor: FAINT },
    checkLabelOn: { fontSize: 8.5, color: INK },
    checkLabelOff: { fontSize: 8.5, color: MUTED },
    note: { fontSize: 8.5, color: p.dark, fontWeight: 700 },
    bodyText: { fontSize: 9, color: "#374151", lineHeight: 1.4, marginTop: 6 },
    signatures: { flexDirection: "row", gap: 36, paddingVertical: 14, paddingHorizontal: 24, borderBottom: 1, borderBottomColor: LINE },
    signatureBox: { flex: 1 },
    signatureLine: { borderTop: 1.5, borderTopColor: "#d1d5db", marginTop: 32, paddingTop: 3, textAlign: "center", fontSize: 7.5, color: MUTED },
    legalNote: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 6.5, lineHeight: 1.5, color: FAINT, backgroundColor: PAPER_TINT, borderBottom: 2, borderBottomColor: p.dark },
    totalsGrid: { flexDirection: "row", flexWrap: "wrap", backgroundColor: p.footer },
    totalsCell: { width: "50%", paddingVertical: 8, paddingHorizontal: 12 },
    totalsLabel: { fontSize: 6.5, fontWeight: 700, textTransform: "uppercase", color: p.onBrand, opacity: 0.85, marginBottom: 2 },
    totalsValue: { fontSize: 13, fontWeight: 700, color: p.onBrand },
    totalBar: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", backgroundColor: p.footer, marginTop: 10, paddingVertical: 10, paddingHorizontal: 16 },
    totalBarLabel: { fontSize: 9, color: p.onBrand, opacity: 0.85, marginRight: 10 },
    totalBarValue: { fontSize: 16, fontWeight: 700, color: p.onBrand },
    table: { marginTop: 10 },
    tableHeader: { flexDirection: "row", backgroundColor: p.light, paddingVertical: 5, paddingHorizontal: 8 },
    tableRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderBottom: 1, borderBottomColor: SOFT_LINE },
    colDescription: { flex: 1, fontSize: 9 },
    colQuantity: { width: 50, fontSize: 9, textAlign: "right" },
    colPrice: { width: 70, fontSize: 9, textAlign: "right" },
    colSubtotal: { width: 70, fontSize: 9, textAlign: "right" },
    headerCell: { fontSize: 7.5, fontWeight: 700, color: p.dark, textTransform: "uppercase" },
    status: { marginTop: 10, alignSelf: "flex-end", fontSize: 8, fontWeight: 700, color: p.dark, textTransform: "uppercase" },
    qrPanel: { flexDirection: "row", alignItems: "center", gap: 14, marginVertical: 10, marginHorizontal: 12, padding: 10, backgroundColor: p.light, borderWidth: 1, borderColor: p.border, borderRadius: 6 },
    qrFrame: { padding: 5, backgroundColor: QR_PAPER, borderRadius: 4 },
    qrText: { flex: 1, gap: 3 },
    qrTitle: { fontSize: 11, fontWeight: 700, color: p.dark },
    qrHint: { fontSize: 8.5, color: "#374151", lineHeight: 1.4 },
    qrRef: { fontSize: 8, color: MUTED, marginTop: 2 },
  });

export type PdfStyles = ReturnType<typeof createStyles>;

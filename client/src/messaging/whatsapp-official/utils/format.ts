import type { WhatsappTemplateSyncStatus } from "../hooks/use-whatsapp-templates";
import type { WhatsappTemplateCatalogEntryRow, WhatsappTemplateCategory } from "../hooks/use-whatsapp-template-catalog";

export const EMPTY_CONNECT_FORM = { wabaId: "", phoneNumberId: "", accessToken: "" };

export const EMPTY_CATALOG_FORM = {
  key: "",
  metaName: "",
  category: "UTILITY" as WhatsappTemplateCategory,
  language: "es_MX",
  text: "",
  variablesText: "",
};

export const CATEGORY_OPTIONS: { value: WhatsappTemplateCategory; label: string }[] = [
  { value: "UTILITY", label: "Utilidad" },
  { value: "MARKETING", label: "Marketing" },
  { value: "AUTHENTICATION", label: "Autenticación" },
];

export const STATUS_BADGE: Record<WhatsappTemplateSyncStatus, { label: string; color: "success" | "warning" | "error" }> = {
  APPROVED: { label: "Aprobada", color: "success" },
  PENDING: { label: "Pendiente de Meta", color: "warning" },
  REJECTED: { label: "Rechazada", color: "error" },
};

export const parseVariables = (variablesText: string): string[] =>
  variablesText
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

export type CatalogFormData = typeof EMPTY_CATALOG_FORM;

export const entryToCatalogForm = (entry: WhatsappTemplateCatalogEntryRow): CatalogFormData => ({
  key: entry.key,
  metaName: entry.metaName,
  category: entry.category,
  language: entry.language,
  text: entry.text,
  variablesText: entry.variables.join(", "),
});

export const formatSyncedAt = (value: string | null | undefined): string => (value ? new Date(value).toLocaleString() : "—");

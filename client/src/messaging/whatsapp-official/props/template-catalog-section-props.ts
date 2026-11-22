import type { TemplateStatusByEntry } from "../types/template-status-by-entry";

export interface TemplateCatalogSectionProps {
  scope: "tenant" | "system";
  title: string;
  description: string;
  readOnly?: boolean;
  statusByEntryId?: TemplateStatusByEntry;
}

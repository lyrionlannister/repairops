import type { WhatsappTemplateCatalogEntryRow } from "../types/whatsapp-template-catalog";
import type { TemplateStatusByEntry } from "../types/template-status-by-entry";

export interface TemplateCatalogTableProps {
  entries: WhatsappTemplateCatalogEntryRow[];
  statusByEntryId?: TemplateStatusByEntry;
  readOnly: boolean;
  onEdit: (entry: WhatsappTemplateCatalogEntryRow) => void;
  onDelete: (entry: WhatsappTemplateCatalogEntryRow) => void;
}

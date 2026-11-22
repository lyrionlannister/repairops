export interface WhatsappTemplateStatusRow {
  id: string;
  catalogEntryId: string;
  metaTemplateId: string | null;
  status: WhatsappTemplateSyncStatus;
  lastSyncedAt: string | null;
}

export type WhatsappTemplateSyncStatus = "PENDING" | "APPROVED" | "REJECTED";

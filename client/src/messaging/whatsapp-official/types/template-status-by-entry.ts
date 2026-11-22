import type { WhatsappTemplateSyncStatus } from "./whatsapp-templates";

export type TemplateStatusByEntry = Map<string, { status: WhatsappTemplateSyncStatus; lastSyncedAt: string | null }>;

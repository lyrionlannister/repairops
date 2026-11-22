import { useMemo } from "react";
import type { WhatsappTemplateStatusRow, WhatsappTemplateSyncStatus } from "./use-whatsapp-templates";

export type TemplateStatusByEntry = Map<string, { status: WhatsappTemplateSyncStatus; lastSyncedAt: string | null }>;

export const useTemplateStatusByEntry = (templates: WhatsappTemplateStatusRow[]): TemplateStatusByEntry =>
  useMemo(
    () => new Map(templates.map((t) => [t.catalogEntryId, { status: t.status, lastSyncedAt: t.lastSyncedAt }])),
    [templates],
  );

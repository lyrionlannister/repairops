import { useMemo } from "react";
import type { WhatsappTemplateStatusRow, WhatsappTemplateSyncStatus } from "./use-whatsapp-templates";

export const useTemplateStatusByEntry = (templates: WhatsappTemplateStatusRow[]) =>
  useMemo(
    () =>
      new Map<string, { status: WhatsappTemplateSyncStatus; lastSyncedAt: string | null }>(
        templates.map((t) => [t.catalogEntryId, { status: t.status, lastSyncedAt: t.lastSyncedAt }]),
      ),
    [templates],
  );

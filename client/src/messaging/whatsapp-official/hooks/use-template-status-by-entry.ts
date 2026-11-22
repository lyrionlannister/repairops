import { useMemo } from "react";
import type { WhatsappTemplateStatusRow } from "../types/whatsapp-templates";
import type { TemplateStatusByEntry } from "../types/template-status-by-entry";

export const useTemplateStatusByEntry = (templates: WhatsappTemplateStatusRow[]): TemplateStatusByEntry =>
  useMemo(
    () => new Map(templates.map((t) => [t.catalogEntryId, { status: t.status, lastSyncedAt: t.lastSyncedAt }])),
    [templates],
  );

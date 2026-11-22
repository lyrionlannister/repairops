import { useMemo, useState } from "react";
import type { MessageTemplate } from "../types/message-templates";

export const useMessageTemplatesPage = (templates: MessageTemplate[]) => {
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter(
      (template) =>
        template.key.toLowerCase().includes(term) ||
        (template.description ?? "").toLowerCase().includes(term),
    );
  }, [search, templates]);

  return { search, setSearch, filteredTemplates };
};

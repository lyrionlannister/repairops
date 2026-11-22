import { useState } from "react";
import type { Conversation } from "../types/conversations";

export const useChatsPage = (conversations: Conversation[]) => {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.sessionId.toLowerCase().includes(q) ||
      (c.contactName?.toLowerCase().includes(q) ?? false) ||
      c.phone.includes(q)
    );
  });

  return { search, setSearch, filtered };
};

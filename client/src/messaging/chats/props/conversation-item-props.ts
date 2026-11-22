import type { Conversation } from "../types/conversations";

export interface ConversationItemProps {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}

export interface AppNotification {
  id: string;
  type: "conversation_transferred" | "new_human_message";
  sessionId: string;
  phone: string;
  contactName?: string;
  read: boolean;
  createdAt: string;
}

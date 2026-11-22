export interface AppNotification {
  id: number;
  type: "conversation_transferred" | "new_human_message";
  sessionId: string;
  phone: string;
  contactName?: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  sessionId: string;
  phone: string;
  contactName?: string;
  messageCount: number;
  lastContent: string;
  lastType: string;
}

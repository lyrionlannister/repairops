export interface Conversation {
  sessionId: string;
  phone: string;
  contactName?: string;
  lastId: number;
  messageCount: number;
  lastContent: string;
  lastType: string;
}

import type { Message } from "./messages";

export interface ChatMessageEvent {
  type: "chat:message";
  sessionId: string;
  message: Message;
}

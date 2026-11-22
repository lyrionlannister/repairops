import type { Message } from "../types/messages";

export interface MessageBubbleProps {
  message: Message;
  onDownload: (message: Message) => void;
}

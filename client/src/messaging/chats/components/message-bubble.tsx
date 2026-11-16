interface MessageBubbleProps {
  content: string;
  fromMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ content, fromMe }) => (
  <div className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
    <div
      className={`relative max-w-[65%] px-3 py-2 text-sm leading-relaxed shadow-sm ${
        fromMe
          ? "rounded-lg rounded-tr-none bg-[#DCF8C6] text-gray-900 dark:bg-[#005C4B] dark:text-white"
          : "rounded-lg rounded-tl-none bg-white text-gray-900 dark:bg-[#1F2C33] dark:text-white"
      }`}
    >
      {content}
    </div>
  </div>
);

import type { Conversation } from "../hooks/use-conversations";
import { formatPhone, getInitials, getAvatarColor } from "../utils/contact-display";

interface ConversationItemProps {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, selected, onClick }) => {
  const displayName = conversation.contactName ?? formatPhone(conversation.phone);
  const avatarLabel = conversation.contactName
    ? getInitials(conversation.contactName)
    : conversation.phone.replace(/\D/g, "").slice(-2);
  const avatarColor = getAvatarColor(conversation.sessionId);
  const isBot = conversation.lastType === "ai";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-800 ${
        selected
          ? "bg-[#f0f2f5] dark:bg-[#2a3942]"
          : "hover:bg-[#f5f6f6] dark:hover:bg-[#1f2c33]"
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor}`}>
        {avatarLabel}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between">
          <p className="truncate text-[15px] font-medium text-gray-900 dark:text-white">
            {displayName}
          </p>
          <span className="ml-2 shrink-0 text-xs text-gray-400 dark:text-gray-500">
            {conversation.messageCount} msgs
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
          {isBot && (
            <span className="text-gray-400 dark:text-gray-500">🤖 </span>
          )}
          {conversation.lastContent || "Sin mensajes"}
        </p>
      </div>
    </button>
  );
};

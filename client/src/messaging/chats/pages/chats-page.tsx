import { useEffect, useRef, useState } from "react";
import { Search, Bot, User, ArrowLeftRight, ArrowLeft } from "lucide-react";
import { useConversations } from "../hooks/use-conversations";
import { useMessages } from "../hooks/use-messages";
import { useHumanMode } from "../hooks/use-human-mode";
import { useChatsPage } from "../hooks/use-chats-page";
import { PageShell } from "@common/components/page-shell/page-shell";
import { formatPhone, getInitials, getAvatarColor } from "../utils/contact-display";
import { ConversationItem } from "../components/conversation-item";
import { MessageBubble } from "../components/message-bubble";
import { NoConversationSelected } from "../components/no-conversation-selected";
import { ManualReplyInput } from "../components/manual-reply-input";

export const ChatsPage: React.FC = () => {
  const { conversations, loading: loadingConversations, error: convError } = useConversations();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { search, setSearch, filtered } = useChatsPage(conversations);
  const { messages, loading: loadingMessages, downloadMedia } = useMessages(selectedSessionId);
  const { isHumanMode, toggling, sending, activate, deactivate, sendMessage } =
    useHumanMode(selectedSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find((c) => c.sessionId === selectedSessionId);

  const displayName = selectedConversation
    ? (selectedConversation.contactName ?? formatPhone(selectedConversation.phone))
    : "";
  const avatarLabel = selectedConversation
    ? selectedConversation.contactName
      ? getInitials(selectedConversation.contactName)
      : selectedConversation.phone.replace(/\D/g, "").slice(-2)
    : "";
  const avatarColor = selectedConversation ? getAvatarColor(selectedConversation.sessionId) : "";

  return (
    <PageShell title="Chats" description="Conversaciones de WhatsApp">
      <div className="flex min-h-125 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft dark:border-gray-700 dark:bg-[#111B21]">
        <div className="flex flex-1 overflow-hidden">
          {/* Panel izquierdo -- en mobile es la pantalla completa hasta elegir un chat, luego se oculta */}
          <div
            className={`w-full shrink-0 flex-col border-r border-gray-200 dark:border-gray-700 md:flex md:w-85 ${
              selectedSessionId ? "hidden" : "flex"
            }`}
          >
            <div className="flex min-h-15.25 items-center justify-between bg-[#f0f2f5] px-4 py-2.5 dark:bg-[#1F2C33]">
              <span className="text-base font-semibold text-gray-800 dark:text-white">
                Conversaciones
              </span>
              {!loadingConversations && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {conversations.length} chats
                </span>
              )}
            </div>

            <div className="bg-white px-3 py-2 dark:bg-[#111B21]">
              <div className="flex items-center gap-2 rounded-lg bg-[#f0f2f5] px-3 py-1.5 dark:bg-[#202C33]">
                <Search className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar o empezar un chat"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-200 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="flex flex-col py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                      <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-2.5 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : convError ? (
                <p className="p-4 text-sm text-red-500">{convError}</p>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 dark:text-gray-500">
                  {search ? "Sin resultados." : "Sin conversaciones."}
                </p>
              ) : (
                filtered.map((conv) => (
                  <ConversationItem
                    key={conv.sessionId}
                    conversation={conv}
                    selected={conv.sessionId === selectedSessionId}
                    onClick={() => setSelectedSessionId(conv.sessionId)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Panel derecho -- en mobile solo aparece al elegir un chat, con boton de regreso */}
          <div
            className={`w-full flex-1 flex-col overflow-hidden md:flex ${selectedConversation ? "flex" : "hidden md:flex"}`}
          >
            {selectedConversation ? (
              <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-2.5 dark:bg-[#1F2C33]">
                <button
                  type="button"
                  onClick={() => setSelectedSessionId(null)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10 md:hidden"
                  aria-label="Volver a conversaciones"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor}`}
                >
                  {avatarLabel}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatPhone(selectedConversation.phone)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      isHumanMode
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {isHumanMode ? (
                      <>
                        <User className="h-3 w-3" /> Humano
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3" /> IA
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={toggling}
                    onClick={() => (isHumanMode ? deactivate() : activate()).catch(console.error)}
                    title={isHumanMode ? "Volver a IA" : "Transferir a humano"}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-[#2A3942] dark:text-gray-300 dark:hover:bg-[#374248]"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {isHumanMode ? "Volver a IA" : "Transferir"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="custom-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto p-4 bg-[#efeae2] dark:bg-[#0D1418]">
              {!selectedSessionId ? (
                <NoConversationSelected />
              ) : loadingMessages ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25D366] border-t-transparent dark:border-[#00a884] dark:border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="rounded-lg bg-white/90 px-4 py-2 text-sm text-gray-500 shadow-sm dark:bg-[#1F2C33]/90 dark:text-gray-400">
                    Sin mensajes en esta conversación
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} onDownload={downloadMedia} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedSessionId && isHumanMode && (
              <ManualReplyInput onSend={sendMessage} sending={sending} />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

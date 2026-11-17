import { Download, MapPin, Paperclip } from "lucide-react";

import type { Message } from "../hooks/use-messages";
import { formatFileSize, mapsUrl, messageTypeLabel } from "../utils/message-type";

interface MessageBubbleProps {
  message: Message;
  onDownload: (message: Message) => void;
}

// Los archivos y ubicaciones se muestran como etiqueta por tipo con descarga; mostrar la
// imagen incrustada queda para cuando se procesen.
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onDownload }) => {
  const { fromMe, content, messageType } = message;
  const label = messageTypeLabel(messageType);

  return (
    <div className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[65%] px-3 py-2 text-sm leading-relaxed shadow-sm ${
          fromMe
            ? "rounded-lg rounded-tr-none bg-[#DCF8C6] text-gray-900 dark:bg-[#005C4B] dark:text-white"
            : "rounded-lg rounded-tl-none bg-white text-gray-900 dark:bg-[#1F2C33] dark:text-white"
        }`}
      >
        {label && (
          <div className="mb-1 flex items-center gap-2 font-medium">
            {message.location ? <MapPin className="size-4" /> : <Paperclip className="size-4" />}
            <span>{label}</span>
            {message.mediaId && (
              <button
                type="button"
                onClick={() => onDownload(message)}
                className="ml-1 flex min-h-8 items-center gap-1 rounded-md px-2 text-xs text-brand-600 hover:underline dark:text-brand-400"
              >
                <Download className="size-3.5" />
                Descargar{message.mediaSize ? ` (${formatFileSize(message.mediaSize)})` : ""}
              </button>
            )}
            {message.location && (
              <a
                href={mapsUrl(message.location.lat, message.location.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-xs text-brand-600 hover:underline dark:text-brand-400"
              >
                Ver en el mapa
              </a>
            )}
            {!message.mediaId && !message.location && <span className="text-xs text-gray-500">(sin archivo)</span>}
          </div>
        )}
        {content}
      </div>
    </div>
  );
};

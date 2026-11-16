import { useState } from "react";
import { Send } from "lucide-react";

interface ManualReplyInputProps {
  onSend: (body: string) => Promise<boolean>;
  sending: boolean;
}

export const ManualReplyInput: React.FC<ManualReplyInputProps> = ({ onSend, sending }) => {
  const [text, setText] = useState("");

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const ok = await onSend(text.trim());
    if (ok) setText("");
  };

  return (
    <div className="flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#1F2C33]">
      <textarea
        rows={1}
        placeholder="Escribe un mensaje..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend().catch(console.error);
          }
        }}
        className="flex-1 resize-none rounded-lg bg-[#f0f2f5] px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none dark:bg-[#2A3942] dark:text-white dark:placeholder-gray-500"
      />
      <button
        type="button"
        onClick={() => handleSend().catch(console.error)}
        disabled={!text.trim() || sending}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-opacity disabled:opacity-40 dark:bg-[#00a884]"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};

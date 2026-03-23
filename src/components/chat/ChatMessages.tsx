import { useRef } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { Message } from "@/components/ChatWidget";

interface Props {
  messages: Message[];
  userId: number;
  input: string;
  sending: boolean;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onKey: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLightbox: (url: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function formatTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatMessages({
  messages, userId, input, sending,
  onInputChange, onSend, onKey, onPaste, onFileChange, onLightbox,
  messagesEndRef,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-6 font-mono text-[11px] text-[#2a4060]">начните переписку</div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <Avatar callsign={msg.sender_callsign || msg.sender_name} avatarUrl={msg.sender_avatar_url} size={24} className="mt-1 flex-shrink-0" />
              )}
              <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && (
                  <span className="font-mono text-[9px] text-[#00f5ff] px-1">{msg.sender_callsign || msg.sender_name}</span>
                )}
                {msg.message_type === "image" && msg.image_url ? (
                  <div className="cursor-pointer" onClick={() => onLightbox(msg.image_url!)}>
                    <img src={msg.image_url} className="max-w-[200px] max-h-[160px] object-cover rounded-sm border border-[rgba(0,245,255,0.2)]" />
                    {msg.content && msg.content !== "📷 Изображение" && (
                      <div className="font-plex text-[11px] text-[#8aacbf] px-1 mt-0.5">{msg.content}</div>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-2 font-plex text-[12px] leading-relaxed"
                    style={{
                      background: isMine ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isMine ? "rgba(0,245,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                      color: isMine ? "#e0f8ff" : "#c0d4e0",
                    }}>
                    {msg.content}
                  </div>
                )}
                <span className="font-mono text-[9px] text-[#3a5570] px-1">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t p-2 flex gap-2 items-end"
        style={{ borderColor: "rgba(0,245,255,0.12)" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="text-[#3a5570] hover:text-[#00f5ff] transition-colors flex-shrink-0 disabled:opacity-40"
          title="Отправить изображение"
        >
          <Icon name="Image" size={16} />
        </button>
        <input
          className="flex-1 bg-transparent border-b font-plex text-[12px] text-white placeholder-[#3a5570] outline-none py-1"
          style={{ borderColor: "rgba(0,245,255,0.2)" }}
          placeholder="Сообщение..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKey}
          onPaste={onPaste}
          disabled={sending}
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || sending}
          className="text-[#00f5ff] hover:text-white disabled:text-[#2a4060] transition-colors flex-shrink-0"
        >
          <Icon name={sending ? "Loader" : "Send"} size={15} className={sending ? "animate-spin" : ""} />
        </button>
      </div>
    </>
  );
}

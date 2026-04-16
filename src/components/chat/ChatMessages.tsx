import { useRef, useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { Message } from "@/components/ChatWidget";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "👎", "🔥"];

interface Props {
  messages: Message[];
  userId: number;
  input: string;
  sending: boolean;
  typingUsers?: string[];
  replyTo?: Message | null;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onKey: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLightbox: (url: string) => void;
  onRemove?: (msgId: number) => void;
  onReact?: (msgId: number, emoji: string) => void;
  onReply?: (msg: Message) => void;
  onCancelReply?: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function formatTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

// Читал ли собеседник — упрощённая эвристика: если сообщение не последнее, считаем прочитанным
function useReadStatus(messages: Message[], userId: number) {
  const myMessages = messages.filter(m => m.sender_id === userId);
  const lastMyIndex = messages.map(m => m.sender_id === userId).lastIndexOf(true);
  return (msgId: number) => {
    const idx = messages.findIndex(m => m.id === msgId);
    // Последнее своё сообщение — "отправлено", предыдущие — "прочитано"
    if (idx === lastMyIndex) return "sent";
    if (idx < lastMyIndex && myMessages.length > 0) return "read";
    return null;
  };
}

export default function ChatMessages({
  messages, userId, input, sending, typingUsers = [], replyTo,
  onInputChange, onSend, onKey, onPaste, onFileChange, onLightbox,
  onRemove, onReact, onReply, onCancelReply,
  messagesEndRef,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [showReactPicker, setShowReactPicker] = useState<number | null>(null);
  const getReadStatus = useReadStatus(messages, userId);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 96) + "px";
  }, [input]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{
          backgroundImage: "linear-gradient(rgba(0,245,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}>
        {messages.length === 0 && (
          <div className="text-center py-6 font-mono text-[11px] text-[#2a4060]">начните переписку</div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          const isHidden = msg.hidden;
          const readStatus = isMine ? getReadStatus(msg.id) : null;

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} group relative`}
              onMouseEnter={() => setHoveredMsg(msg.id)}
              onMouseLeave={() => { setHoveredMsg(null); if (showReactPicker === msg.id) setShowReactPicker(null); }}
            >
              {!isMine && (
                <Avatar callsign={msg.sender_callsign || msg.sender_name} avatarUrl={msg.sender_avatar_url} size={24} className="mt-1 flex-shrink-0" />
              )}

              {/* Actions on hover */}
              {hoveredMsg === msg.id && !isHidden && (
                <div className={`absolute top-0 flex items-center gap-0.5 z-10 ${isMine ? "right-full mr-1" : "left-full ml-1"}`}>
                  {onReply && (
                    <button onClick={() => onReply(msg)} className="p-1 text-[#3a5570] hover:text-[#00f5ff] transition-colors" title="Ответить">
                      <Icon name="Reply" size={11} />
                    </button>
                  )}
                  {onReact && (
                    <div className="relative">
                      <button onClick={() => setShowReactPicker(showReactPicker === msg.id ? null : msg.id)} className="p-1 text-[#3a5570] hover:text-[#ffbe32] transition-colors">
                        <Icon name="Smile" size={11} />
                      </button>
                      {showReactPicker === msg.id && (
                        <div className={`absolute bottom-7 flex gap-0.5 p-1 z-20 ${isMine ? "right-0" : "left-0"}`}
                          style={{ background: "#0a1520", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
                          {QUICK_REACTIONS.map(e => (
                            <button key={e} onClick={() => { onReact(msg.id, e); setShowReactPicker(null); }} className="text-base hover:scale-125 transition-transform">{e}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {isMine && onRemove && (
                    <button onClick={() => onRemove(msg.id)} className="p-1 text-[#3a5570] hover:text-[#ff2244] transition-colors" title="Удалить">
                      <Icon name="Trash2" size={11} />
                    </button>
                  )}
                </div>
              )}

              <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && (
                  <span className="font-mono text-[9px] text-[#00f5ff] px-1">{msg.sender_callsign || msg.sender_name}</span>
                )}

                {/* Reply preview */}
                {msg.reply_to_id && msg.reply_content && (
                  <div className="px-2 py-0.5 border-l-2 border-[#00f5ff] mb-0.5" style={{ background: "rgba(0,245,255,0.05)", maxWidth: "100%" }}>
                    <div className="font-mono text-[9px] text-[#00f5ff]">@{msg.reply_callsign}</div>
                    <div className="font-plex text-[10px] text-[#5a7a95] truncate max-w-[150px]">{msg.reply_content}</div>
                  </div>
                )}

                {msg.message_type === "image" && msg.image_url && !isHidden ? (
                  <div className="cursor-pointer" onClick={() => onLightbox(msg.image_url!)}>
                    <img src={msg.image_url} className="max-w-[200px] max-h-[160px] object-cover rounded-sm border border-[rgba(0,245,255,0.2)]" />
                    {msg.content && msg.content !== "📷 Изображение" && (
                      <div className="font-plex text-[11px] text-[#8aacbf] px-1 mt-0.5">{msg.content}</div>
                    )}
                  </div>
                ) : (
                  <div className={`px-3 py-2 font-plex text-[12px] leading-relaxed ${isHidden ? "italic" : ""}`}
                    style={{
                      background: isHidden ? "transparent" : isMine ? "rgba(0,245,255,0.18)" : "rgba(30,45,65,0.7)",
                      border: isHidden ? "1px dashed rgba(255,255,255,0.08)" : isMine ? "1px solid rgba(0,245,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: isHidden ? "#3a5570" : (isMine ? "#e8faff" : "#b8cfe0"),
                      borderRadius: isMine ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                      boxShadow: isMine && !isHidden ? "0 0 10px rgba(0,245,255,0.08)" : "none",
                    }}>
                    {msg.content}
                  </div>
                )}

                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-0.5 px-1">
                    {Object.entries(msg.reactions).map(([emoji, uids]) => (
                      <button
                        key={emoji}
                        onClick={() => onReact?.(msg.id, emoji)}
                        className="flex items-center gap-0.5 px-1 py-0.5 text-[11px] transition-all"
                        style={{
                          border: `1px solid ${uids.includes(String(userId)) ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                          background: uids.includes(String(userId)) ? "rgba(0,245,255,0.08)" : "transparent",
                        }}
                      >
                        {emoji}<span className="font-mono text-[9px] text-[#5a7a95]">{uids.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Time + read status */}
                <div className="flex items-center gap-1 px-1">
                  <span className="font-mono text-[9px] text-[#3a5570]">{formatTime(msg.created_at)}</span>
                  {readStatus === "sent" && (
                    <Icon name="Check" size={9} className="text-[#3a5570]" />
                  )}
                  {readStatus === "read" && (
                    <span className="flex">
                      <Icon name="Check" size={9} className="text-[#00f5ff] -mr-1" />
                      <Icon name="Check" size={9} className="text-[#00f5ff]" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-3 py-1 font-mono text-[9px] text-[#3a5570] animate-pulse flex-shrink-0">
          {typingUsers.join(", ")} печатает...
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-1.5 flex-shrink-0 border-t" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
          <Icon name="Reply" size={11} className="text-[#00f5ff] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[9px] text-[#00f5ff]">@{replyTo.sender_callsign}</div>
            <div className="font-plex text-[11px] text-[#5a7a95] truncate">{replyTo.content}</div>
          </div>
          <button onClick={onCancelReply} className="text-[#3a5570] hover:text-white flex-shrink-0">
            <Icon name="X" size={11} />
          </button>
        </div>
      )}

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
          className="p-1.5 text-[#3a5570] hover:text-[#00f5ff] transition-colors flex-shrink-0"
          title="Загрузить изображение">
          <Icon name="Paperclip" size={12} />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKey}
          onPaste={onPaste}
          placeholder="Сообщение..."
          rows={1}
          className="flex-1 resize-none font-plex text-sm p-2 outline-none bg-[#0a1520] text-white overflow-hidden"
          style={{ border: "1px solid rgba(0,245,255,0.12)", borderRadius: "2px", minHeight: "34px", maxHeight: "96px" }}
        />
        <button
          onClick={onSend}
          disabled={sending || !input.trim()}
          className="p-1.5 text-[#00f5ff] hover:text-white transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Отправить">
          <Icon name={sending ? "Loader" : "Send"} size={12} className={sending ? "animate-spin" : ""} />
        </button>
      </div>
    </>
  );
}
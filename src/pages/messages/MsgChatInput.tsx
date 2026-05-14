import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Message } from "./MsgTypes";

interface Props {
  activeChat: { type: string };
  input: string;
  sending: boolean;
  typingUsers: string[];
  replyTo: Message | null;
  editingMsg?: { id: number; content: string } | null;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onSend: () => void;
  onSendImage: (file: File) => void;
  onCancelReply: () => void;
  onEditSubmit: (msgId: number, content: string) => void;
  onCancelEdit: () => void;
}

export default function MsgChatInput({
  activeChat, input, sending, typingUsers, replyTo, editingMsg,
  onInputChange, onKeyDown, onPaste, onSend, onSendImage,
  onCancelReply, onEditSubmit, onCancelEdit,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [editInput, setEditInput] = useState("");

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  // Pre-fill edit input when editingMsg changes
  useEffect(() => {
    if (editingMsg) {
      setEditInput(editingMsg.content);
      setTimeout(() => {
        const ta = editInputRef.current;
        if (ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; }
      }, 0);
    }
  }, [editingMsg?.id]);

  return (
    <>
      {/* Индикатор набора */}
      {typingUsers.length > 0 && activeChat.type === "group" && (
        <div className="px-5 py-1.5 flex-shrink-0 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}>
          <span className="font-mono text-[10px] text-[#00ff88]">{typingUsers.join(", ")} печатает</span>
          <span className="flex gap-0.5 items-end">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full bg-[#00ff88]"
                style={{ animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </span>
        </div>
      )}

      {/* Цитата */}
      {replyTo && !editingMsg && (
        <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-t"
          style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
          <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: "#00f5ff" }} />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] text-[#00f5ff]">@{replyTo.sender_callsign}</div>
            <div className="font-plex text-xs text-[#5a7a95] truncate">{replyTo.content}</div>
          </div>
          <button onClick={onCancelReply} className="text-[#3a5570] hover:text-white flex-shrink-0">
            <Icon name="X" size={13} />
          </button>
        </div>
      )}

      {/* Редактирование сообщения */}
      {editingMsg && (
        <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-t"
          style={{ borderColor: "rgba(0,255,136,0.15)", background: "rgba(0,255,136,0.03)" }}>
          <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: "#00ff88" }} />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] text-[#00ff88] flex items-center gap-1">
              <Icon name="Pencil" size={10} /> Редактирование сообщения
            </div>
            <div className="font-plex text-xs text-[#5a7a95] truncate">{editingMsg.content}</div>
          </div>
          <button onClick={onCancelEdit} className="text-[#3a5570] hover:text-white flex-shrink-0">
            <Icon name="X" size={13} />
          </button>
        </div>
      )}

      {/* ── Поле ввода ── */}
      <div className="px-4 py-3 flex-shrink-0 flex gap-2.5 items-end border-t"
        style={{ borderColor: editingMsg ? "rgba(0,255,136,0.2)" : "rgba(0,245,255,0.1)", background: "rgba(3,5,11,0.97)" }}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onSendImage(f); e.target.value = ""; }} />

        {editingMsg ? (
          <>
            <textarea
              ref={editInputRef}
              className="flex-1 bg-transparent border font-plex text-[14px] text-white px-3.5 py-2.5 outline-none focus:border-[#00ff88] transition-colors resize-none overflow-hidden"
              style={{ borderColor: "rgba(0,255,136,0.3)", borderRadius: 10, minHeight: 42, maxHeight: 140, lineHeight: "1.55" }}
              placeholder="Редактировать сообщение..."
              value={editInput}
              onChange={e => setEditInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (editInput.trim()) onEditSubmit(editingMsg.id, editInput.trim()); }
                if (e.key === "Escape") { e.preventDefault(); onCancelEdit(); }
              }}
            />
            <button onClick={() => { if (editInput.trim()) onEditSubmit(editingMsg.id, editInput.trim()); }}
              disabled={!editInput.trim()}
              className="flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all disabled:opacity-30 hover:scale-105"
              style={{ border: "1px solid rgba(0,255,136,0.45)", background: "rgba(0,255,136,0.1)", color: "#00ff88", borderRadius: 10 }}
              title="Сохранить правку">
              <Icon name="Check" size={16} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => fileInputRef.current?.click()} disabled={sending}
              className="flex items-center justify-center w-9 h-9 flex-shrink-0 transition-all disabled:opacity-30 hover:text-[#00f5ff]"
              style={{ border: "1px solid rgba(0,245,255,0.15)", color: "#5a7a95", borderRadius: 8 }}
              title="Прикрепить изображение">
              <Icon name="Image" size={15} />
            </button>
            <textarea
              ref={textareaRef}
              className="flex-1 bg-transparent border font-plex text-[14px] text-white px-3.5 py-2.5 outline-none focus:border-[#00f5ff] transition-colors resize-none overflow-hidden"
              style={{ borderColor: "rgba(0,245,255,0.2)", borderRadius: 10, minHeight: 42, maxHeight: 140, lineHeight: "1.55" }}
              placeholder="Сообщение...  (Enter — отправить, Shift+Enter — перенос)"
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
            />
            <button onClick={onSend} disabled={!input.trim() || sending}
              className="flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all disabled:opacity-30 hover:scale-105"
              style={{ border: "1px solid rgba(0,245,255,0.45)", background: "rgba(0,245,255,0.1)", color: "#00f5ff", borderRadius: 10, boxShadow: input.trim() ? "0 0 12px rgba(0,245,255,0.15)" : "none" }}>
              <Icon name={sending ? "Loader" : "Send"} size={16} className={sending ? "animate-spin" : ""} />
            </button>
          </>
        )}
      </div>
    </>
  );
}

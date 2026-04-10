import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Chat, Message, QUICK_REACTIONS, formatTime, getChatIcon, getChatTitle } from "./MsgTypes";

interface Props {
  activeChat: Chat;
  messages: Message[];
  visibleMessages: Message[];
  userId: number;
  input: string;
  sending: boolean;
  typingUsers: string[];
  replyTo: Message | null;
  msgSearch: string;
  showSearch: boolean;
  showChatMenu: boolean;
  renaming: boolean;
  newChatName: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onSend: () => void;
  onSendImage: (file: File) => void;
  onSetLightbox: (url: string) => void;
  onRemoveMessage: (id: number) => void;
  onReact: (msgId: number, emoji: string) => void;
  onSetReplyTo: (msg: Message) => void;
  onCancelReply: () => void;
  onToggleSearch: () => void;
  onMsgSearchChange: (v: string) => void;
  onToggleChatMenu: () => void;
  onCloseChatMenu: () => void;
  onStartRename: () => void;
  onClearChat: () => void;
  onLeaveChat: () => void;
  onNewChatNameChange: (v: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent) => void;
  onRenameConfirm: () => void;
  onCancelRename: () => void;
}

export default function MsgChatArea({
  activeChat, messages, visibleMessages, userId, input, sending,
  typingUsers, replyTo, msgSearch, showSearch, showChatMenu,
  renaming, newChatName, messagesEndRef,
  onClose, onInputChange, onKeyDown, onPaste, onSend, onSendImage, onSetLightbox,
  onRemoveMessage, onReact, onSetReplyTo, onCancelReply,
  onToggleSearch, onMsgSearchChange, onToggleChatMenu, onCloseChatMenu,
  onStartRename, onClearChat, onLeaveChat,
  onNewChatNameChange, onRenameKeyDown, onRenameConfirm, onCancelRename,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [showReactPicker, setShowReactPicker] = useState<number | null>(null);

  const handleReact = (msgId: number, emoji: string) => {
    setShowReactPicker(null);
    onReact(msgId, emoji);
  };

  return (
    <div className="flex-1 flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(5,8,16,0.6)" }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b relative" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
        <div className="w-8 h-8 flex items-center justify-center overflow-hidden" style={{ border: "1px solid rgba(0,245,255,0.3)" }}>
          {activeChat.type === "direct" && activeChat.partner?.avatar_url
            ? <img src={activeChat.partner.avatar_url} className="w-full h-full object-cover" />
            : <Icon name={getChatIcon(activeChat)} size={14} className="text-[#00f5ff]" />}
        </div>
        <div className="flex-1">
          <div className="font-orbitron text-xs text-white tracking-wider">{getChatTitle(activeChat)}</div>
          {activeChat.type === "group" && (
            <div className="font-mono text-[10px] text-[#3a5570]">{activeChat.members_count} участников</div>
          )}
        </div>

        <button onClick={onToggleSearch}
          className={`p-1.5 transition-colors ${showSearch ? "text-[#00f5ff]" : "text-[#3a5570] hover:text-white"}`}
          title="Поиск по сообщениям">
          <Icon name="Search" size={15} />
        </button>

        <div className="relative">
          <button onClick={onToggleChatMenu} className="p-1.5 text-[#3a5570] hover:text-white transition-colors">
            <Icon name="MoreVertical" size={15} />
          </button>
          {showChatMenu && (
            <div className="absolute right-0 top-8 z-50 w-48 py-1" style={{ background: "#080d1a", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
              {activeChat.type === "group" && (
                <button onClick={onStartRename}
                  className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.05)] transition-colors">
                  <Icon name="Pencil" size={12} />Переименовать
                </button>
              )}
              <button onClick={onClearChat}
                className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.05)] transition-colors">
                <Icon name="Trash2" size={12} />Очистить историю
              </button>
              {activeChat.type === "group" && (
                <button onClick={onLeaveChat}
                  className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#ff2244] hover:bg-[rgba(255,34,68,0.05)] transition-colors">
                  <Icon name="LogOut" size={12} />Выйти из чата
                </button>
              )}
            </div>
          )}
        </div>

        <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors">
          <Icon name="X" size={15} />
        </button>
      </div>

      {/* Rename input */}
      {renaming && (
        <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
          <input
            value={newChatName}
            onChange={e => onNewChatNameChange(e.target.value)}
            onKeyDown={onRenameKeyDown}
            className="flex-1 bg-transparent border font-plex text-sm text-white px-2 py-1 outline-none focus:border-[#00f5ff]"
            style={{ borderColor: "rgba(0,245,255,0.3)" }}
            autoFocus
            placeholder="Новое название"
          />
          <button onClick={onRenameConfirm} className="font-mono text-xs text-[#00f5ff] px-2 py-1" style={{ border: "1px solid rgba(0,245,255,0.3)" }}>ОК</button>
          <button onClick={onCancelRename} className="font-mono text-xs text-[#3a5570] px-2 py-1" style={{ border: "1px solid #1a2a3a" }}>✕</button>
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
            <input
              value={msgSearch}
              onChange={e => onMsgSearchChange(e.target.value)}
              className="w-full bg-transparent border font-mono text-xs text-white pl-8 pr-3 py-1.5 outline-none focus:border-[#00f5ff]"
              style={{ borderColor: "rgba(0,245,255,0.2)" }}
              placeholder="Поиск в переписке..."
              autoFocus
            />
          </div>
          {msgSearch && <div className="font-mono text-[10px] text-[#3a5570] mt-1">Найдено: {visibleMessages.length}</div>}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" onClick={onCloseChatMenu}>
        {visibleMessages.length === 0 && (
          <div className="text-center py-8 font-mono text-xs text-[#2a4060]">
            {msgSearch ? "Ничего не найдено" : "нет сообщений — начните переписку"}
          </div>
        )}
        {visibleMessages.map(msg => {
          const isMine = msg.sender_id === userId;
          const isHidden = msg.hidden;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"} group relative`}
              onMouseEnter={() => setHoveredMsg(msg.id)}
              onMouseLeave={() => { setHoveredMsg(null); if (showReactPicker === msg.id) setShowReactPicker(null); }}
            >
              {hoveredMsg === msg.id && !isHidden && (
                <div className={`absolute top-0 flex items-center gap-1 z-10 ${isMine ? "right-full mr-2" : "left-full ml-2"}`}>
                  <button onClick={() => onSetReplyTo(msg)} className="p-1 text-[#3a5570] hover:text-[#00f5ff] transition-colors" title="Ответить">
                    <Icon name="Reply" size={13} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowReactPicker(showReactPicker === msg.id ? null : msg.id)} className="p-1 text-[#3a5570] hover:text-[#ffbe32] transition-colors" title="Реакция">
                      <Icon name="Smile" size={13} />
                    </button>
                    {showReactPicker === msg.id && (
                      <div className="absolute bottom-8 left-0 flex gap-1 p-1.5 z-20" style={{ background: "#0a1520", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
                        {QUICK_REACTIONS.map(e => (
                          <button key={e} onClick={() => handleReact(msg.id, e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {isMine && (
                    <button onClick={() => onRemoveMessage(msg.id)} className="p-1 text-[#3a5570] hover:text-[#ff2244] transition-colors" title="Удалить">
                      <Icon name="Trash2" size={13} />
                    </button>
                  )}
                </div>
              )}

              <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!isMine && (
                  <span className="font-mono text-[10px] text-[#00f5ff] px-1">{msg.sender_callsign || msg.sender_name}</span>
                )}

                {msg.reply_to_id && msg.reply_content && (
                  <div className="px-2 py-1 mb-0.5 border-l-2 border-[#00f5ff]" style={{ background: "rgba(0,245,255,0.05)", maxWidth: "100%" }}>
                    <div className="font-mono text-[10px] text-[#00f5ff]">@{msg.reply_callsign}</div>
                    <div className="font-plex text-xs text-[#5a7a95] truncate">{msg.reply_content}</div>
                  </div>
                )}

                <div className={`px-3 py-2 font-plex text-sm ${isHidden ? "italic text-[#3a5570]" : "text-white"}`} style={{
                  background: isMine ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isMine ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}>
                  {msg.image_url && !isHidden ? (
                    <img
                      src={msg.image_url}
                      className="max-w-full max-h-48 object-cover cursor-pointer rounded-sm mb-1"
                      onClick={() => onSetLightbox(msg.image_url!)}
                    />
                  ) : null}
                  {(msg.content && (!msg.image_url || msg.content !== "📷 Изображение")) && (
                    <span>{msg.content}</span>
                  )}
                </div>

                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 px-1">
                    {Object.entries(msg.reactions).map(([emoji, uids]) => (
                      <button
                        key={emoji}
                        onClick={() => onReact(msg.id, emoji)}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs transition-all"
                        style={{
                          border: `1px solid ${uids.includes(String(userId)) ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                          background: uids.includes(String(userId)) ? "rgba(0,245,255,0.08)" : "transparent",
                        }}
                      >
                        <span>{emoji}</span>
                        <span className="font-mono text-[10px] text-[#5a7a95]">{uids.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span className="font-mono text-[10px] text-[#2a4060] px-1">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-5 py-1 font-mono text-[10px] text-[#3a5570] animate-pulse">
          {typingUsers.join(", ")} печатает...
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
          <Icon name="Reply" size={13} className="text-[#00f5ff] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] text-[#00f5ff]">@{replyTo.sender_callsign}</div>
            <div className="font-plex text-xs text-[#5a7a95] truncate">{replyTo.content}</div>
          </div>
          <button onClick={onCancelReply} className="text-[#3a5570] hover:text-white">
            <Icon name="X" size={13} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t flex gap-2 items-end" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onSendImage(f); e.target.value = ""; }} />
        <button onClick={() => fileInputRef.current?.click()} disabled={sending}
          className="flex items-center justify-center w-8 h-8 flex-shrink-0 transition-all disabled:opacity-30 mb-1"
          style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#5a7a95" }}
          title="Прикрепить изображение">
          <Icon name="Image" size={14} />
        </button>
        <textarea
          className="flex-1 bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
          style={{ borderColor: "rgba(0,245,255,0.2)" }}
          rows={1}
          placeholder="Сообщение... (Enter — отправить)"
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        <button onClick={onSend} disabled={!input.trim() || sending}
          className="flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all disabled:opacity-30"
          style={{ border: "1px solid rgba(0,245,255,0.4)", background: "rgba(0,245,255,0.08)", color: "#00f5ff" }}>
          <Icon name={sending ? "Loader" : "Send"} size={15} className={sending ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}

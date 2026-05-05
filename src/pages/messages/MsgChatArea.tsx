import { useRef, useState, useEffect, useCallback } from "react";
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

// Аватар-буква отправителя
function MsgAvatar({ callsign, avatarUrl }: { callsign: string; avatarUrl?: string | null }) {
  const letter = (callsign || "?")[0].toUpperCase();
  const colors = ["#00f5ff", "#00ff88", "#ffbe32", "#ff6b00", "#a855f7", "#ff2244"];
  const colorIdx = callsign.charCodeAt(0) % colors.length;
  const color = colors[colorIdx];
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden font-orbitron text-[11px] font-bold"
      style={{ border: `1px solid ${color}50`, background: `${color}15`, color }}>
      {avatarUrl
        ? <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
        : letter}
    </div>
  );
}

// Дата-разделитель
function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.25))" }} />
      <span className="font-mono text-[10px] tracking-widest px-3 py-1"
        style={{ border: "1px solid rgba(0,245,255,0.25)", background: "rgba(0,245,255,0.06)", color: "#00f5ff", boxShadow: "0 0 8px rgba(0,245,255,0.1)" }}>
        {date}
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.25), transparent)" }} />
    </div>
  );
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDay.getTime() === today.getTime()) return "Сегодня";
  if (msgDay.getTime() === yesterday.getTime()) return "Вчера";
  return d.toLocaleDateString("ru", { day: "numeric", month: "long", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [showReactPicker, setShowReactPicker] = useState<number | null>(null);
  const [reactingId, setReactingId] = useState<number | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const handleReact = (msgId: number, emoji: string) => {
    setShowReactPicker(null);
    setReactingId(msgId);
    onReact(msgId, emoji);
    setTimeout(() => setReactingId(null), 400);
  };

  // Группировка: одинаковый отправитель, в течение 2 минут
  const isGrouped = (idx: number): boolean => {
    if (idx === 0) return false;
    const cur = visibleMessages[idx];
    const prev = visibleMessages[idx - 1];
    if (cur.sender_id !== prev.sender_id) return false;
    const diff = new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime();
    return diff < 2 * 60 * 1000;
  };

  // Последнее в группе (следующее от другого или нет следующего)
  const isLastInGroup = (idx: number): boolean => {
    const cur = visibleMessages[idx];
    const next = visibleMessages[idx + 1];
    if (!next) return true;
    if (next.sender_id !== cur.sender_id) return true;
    const diff = new Date(next.created_at).getTime() - new Date(cur.created_at).getTime();
    return diff >= 2 * 60 * 1000;
  };

  const isSearchMode = msgSearch.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col min-w-0"
      style={{ background: "rgba(4,7,14,0.97)" }}>

      {/* ── Шапка ── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b relative"
        style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(3,5,11,0.95)" }}>
        <div className="w-8 h-8 flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ border: "1px solid rgba(0,245,255,0.25)", background: "rgba(0,245,255,0.05)" }}>
          {activeChat.type === "direct" && activeChat.partner?.avatar_url
            ? <img src={activeChat.partner.avatar_url} className="w-full h-full object-cover" />
            : <Icon name={getChatIcon(activeChat)} size={14} className="text-[#00f5ff]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-orbitron text-xs text-white tracking-wider truncate">{getChatTitle(activeChat)}</div>
          {activeChat.type === "group" && (
            <div className="font-mono text-[10px] text-[#3a5570]">{activeChat.members_count} участников</div>
          )}
          {activeChat.type === "direct" && typingUsers.length > 0 && (
            <div className="font-mono text-[10px] text-[#00ff88] animate-pulse">печатает...</div>
          )}
        </div>

        <button onClick={onToggleSearch}
          className={`p-1.5 transition-colors ${showSearch ? "text-[#00f5ff]" : "text-[#3a5570] hover:text-white"}`}
          title="Поиск">
          <Icon name="Search" size={15} />
        </button>

        <div className="relative">
          <button onClick={onToggleChatMenu} className="p-1.5 text-[#3a5570] hover:text-white transition-colors">
            <Icon name="MoreVertical" size={15} />
          </button>
          {showChatMenu && (
            <div className="absolute right-0 top-8 z-50 w-48 py-1"
              style={{ background: "#070d18", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
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

      {/* Переименование */}
      {renaming && (
        <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b"
          style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
          <input value={newChatName} onChange={e => onNewChatNameChange(e.target.value)}
            onKeyDown={onRenameKeyDown} autoFocus placeholder="Новое название"
            className="flex-1 bg-transparent border font-plex text-sm text-white px-2 py-1 outline-none focus:border-[#00f5ff]"
            style={{ borderColor: "rgba(0,245,255,0.3)" }} />
          <button onClick={onRenameConfirm} className="font-mono text-xs text-[#00f5ff] px-2 py-1" style={{ border: "1px solid rgba(0,245,255,0.3)" }}>ОК</button>
          <button onClick={onCancelRename} className="font-mono text-xs text-[#3a5570] px-2 py-1" style={{ border: "1px solid #1a2a3a" }}>✕</button>
        </div>
      )}

      {/* Поиск */}
      {showSearch && (
        <div className="px-4 py-2 flex-shrink-0 border-b" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
            <input value={msgSearch} onChange={e => onMsgSearchChange(e.target.value)} autoFocus
              placeholder="Поиск в переписке..."
              className="w-full bg-transparent border font-mono text-xs text-white pl-8 pr-3 py-1.5 outline-none focus:border-[#00f5ff]"
              style={{ borderColor: "rgba(0,245,255,0.2)" }} />
          </div>
          {msgSearch && <div className="font-mono text-[10px] text-[#3a5570] mt-1">Найдено: {visibleMessages.length}</div>}
        </div>
      )}

      {/* ── Сообщения ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative" ref={scrollRef} onClick={onCloseChatMenu} onScroll={handleScroll}
        style={{
          backgroundImage: "linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}>
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
              <Icon name={getChatIcon(activeChat)} size={24} className="text-[#1a2a3a]" />
            </div>
            <div className="font-orbitron text-sm text-[#2a4060] tracking-wider">
              {msgSearch ? "Ничего не найдено" : getChatTitle(activeChat)}
            </div>
            {!msgSearch && (
              <div className="font-mono text-[10px] text-[#1a2a3a]">Напишите первым</div>
            )}
          </div>
        ) : (
          <div>
            {visibleMessages.map((msg, idx) => {
              const isMine = msg.sender_id === userId;
              const isHidden = msg.hidden;
              const grouped = !isSearchMode && isGrouped(idx);
              const lastInGroup = !isSearchMode && isLastInGroup(idx);
              const showDate = idx === 0 || !isSameDay(visibleMessages[idx - 1].created_at, msg.created_at);

              return (
                <div key={msg.id}>
                  {showDate && <DateDivider date={formatDateLabel(msg.created_at)} />}

                  <div
                    className={`flex gap-2.5 ${isMine ? "justify-end" : "justify-start"} group relative ${grouped ? "mt-1" : "mt-4"}`}
                    style={{ animation: "fadeSlideUp 0.18s ease-out" }}
                    onMouseEnter={() => setHoveredMsg(msg.id)}
                    onMouseLeave={() => { setHoveredMsg(null); if (showReactPicker === msg.id) setShowReactPicker(null); }}
                  >
                    {/* Аватар — всегда для чужих, но прозрачный если в группе */}
                    {!isMine && (
                      <div className="flex-shrink-0 self-end w-8">
                        <div style={{ opacity: lastInGroup ? 1 : 0 }}>
                          <MsgAvatar
                            callsign={msg.sender_callsign || msg.sender_name}
                            avatarUrl={activeChat.type === "direct" ? activeChat.partner?.avatar_url : undefined}
                          />
                        </div>
                      </div>
                    )}

                    <div className={`max-w-[68%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                      {/* Имя — первое в группе */}
                      {!isMine && !grouped && (
                        <span className="font-mono text-[11px] text-[#00f5ff] px-1">
                          {msg.sender_callsign || msg.sender_name}
                        </span>
                      )}

                      {/* Цитата */}
                      {msg.reply_to_id && msg.reply_content && (
                        <div className="px-3 py-1.5 border-l-2 border-[#00f5ff] max-w-full rounded-r-lg"
                          style={{ background: "rgba(0,245,255,0.06)" }}>
                          <div className="font-mono text-[10px] text-[#00f5ff]">@{msg.reply_callsign}</div>
                          <div className="font-plex text-xs text-[#5a7a95] truncate">{msg.reply_content}</div>
                        </div>
                      )}

                      {/* Пузырь */}
                      <div
                        className={`px-4 py-2.5 font-plex leading-relaxed ${isHidden ? "italic text-sm" : "text-[14px]"}`}
                        style={{
                          background: isHidden
                            ? "transparent"
                            : isMine
                              ? "rgba(0,245,255,0.18)"
                              : "rgba(30,45,65,0.75)",
                          border: isHidden
                            ? "1px dashed rgba(255,255,255,0.08)"
                            : isMine
                              ? "1px solid rgba(0,245,255,0.4)"
                              : "1px solid rgba(255,255,255,0.09)",
                          color: isHidden ? "#3a5570" : isMine ? "#e8faff" : "#c0d8ec",
                          boxShadow: isMine && !isHidden
                            ? "0 2px 16px rgba(0,245,255,0.14), inset 0 0 20px rgba(0,245,255,0.04)"
                            : "none",
                          lineHeight: 1.6,
                          borderRadius: isMine
                            ? lastInGroup ? "14px 14px 4px 14px" : "14px"
                            : lastInGroup ? "14px 14px 14px 4px" : "14px",
                        }}>
                        {msg.image_url && !isHidden ? (
                          <img src={msg.image_url}
                            className="max-w-full max-h-52 object-cover cursor-pointer mb-1.5"
                            style={{ borderRadius: 8 }}
                            onClick={() => onSetLightbox(msg.image_url!)} />
                        ) : null}
                        {(msg.content && (!msg.image_url || msg.content !== "📷 Изображение")) && (
                          <span>{msg.content}</span>
                        )}
                      </div>

                      {/* Реакции */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 px-1">
                          {Object.entries(msg.reactions).map(([emoji, uids]) => (
                            <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                              className="flex items-center gap-1 px-2 py-0.5 text-sm transition-all"
                              style={{
                                borderRadius: 20,
                                border: `1px solid ${uids.includes(String(userId)) ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                                background: uids.includes(String(userId)) ? "rgba(0,245,255,0.1)" : "rgba(255,255,255,0.04)",
                                transform: reactingId === msg.id ? "scale(1.15)" : "scale(1)",
                                transition: "transform 0.2s ease, background 0.15s",
                              }}>
                              <span>{emoji}</span>
                              <span className="font-mono text-[10px] text-[#5a7a95]">{uids.length}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Время */}
                      {lastInGroup && (
                        <span className="font-mono text-[10px] text-[#3a5570] px-1">{formatTime(msg.created_at)}</span>
                      )}
                    </div>

                    {/* Кнопки действий при hover */}
                    {hoveredMsg === msg.id && !isHidden && (
                      <div className={`absolute top-0 flex items-center gap-0.5 z-10 ${isMine ? "right-full mr-2" : "left-full ml-2"}`}>
                        <button onClick={() => onSetReplyTo(msg)}
                          className="p-1.5 text-[#3a5570] hover:text-[#00f5ff] transition-colors" title="Ответить">
                          <Icon name="Reply" size={13} />
                        </button>
                        <div className="relative">
                          <button onClick={() => setShowReactPicker(showReactPicker === msg.id ? null : msg.id)}
                            className="p-1.5 text-[#3a5570] hover:text-[#ffbe32] transition-colors" title="Реакция">
                            <Icon name="Smile" size={13} />
                          </button>
                          {showReactPicker === msg.id && (
                            <div className={`absolute bottom-8 flex gap-1 p-2 z-20 ${isMine ? "right-0" : "left-0"}`}
                              style={{ background: "#080d18", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.6)", borderRadius: 8 }}>
                              {QUICK_REACTIONS.map(e => (
                                <button key={e} onClick={() => handleReact(msg.id, e)}
                                  className="text-xl hover:scale-125 transition-transform px-0.5">
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {isMine && (
                          <button onClick={() => onRemoveMessage(msg.id)}
                            className="p-1.5 text-[#3a5570] hover:text-[#ff2244] transition-colors" title="Удалить">
                            <Icon name="Trash2" size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Кнопка прокрутки вниз */}
        {showScrollBtn && (
          <button onClick={scrollToBottom}
            className="sticky bottom-4 float-right flex items-center justify-center w-9 h-9 transition-all hover:scale-110"
            style={{ borderRadius: "50%", background: "rgba(5,8,16,0.95)", border: "1px solid rgba(0,245,255,0.35)", boxShadow: "0 0 16px rgba(0,245,255,0.2)", color: "#00f5ff" }}>
            <Icon name="ChevronsDown" size={16} />
          </button>
        )}
      </div>

      {/* Индикатор набора */}
      {typingUsers.length > 0 && activeChat.type === "group" && (
        <div className="px-5 py-1.5 flex-shrink-0 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}>
          <span className="font-mono text-[10px] text-[#00ff88]">{typingUsers.join(", ")} печатает</span>
          <span className="flex gap-0.5 items-end">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full bg-[#00ff88]"
                style={{ animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </span>
        </div>
      )}

      {/* Цитата */}
      {replyTo && (
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

      {/* ── Поле ввода ── */}
      <div className="px-4 py-3 flex-shrink-0 flex gap-2.5 items-end border-t"
        style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(3,5,11,0.97)" }}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onSendImage(f); e.target.value = ""; }} />
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
      </div>
    </div>
  );
}
import { useCallback, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Chat, Message, QUICK_REACTIONS, formatTime, getChatIcon, getChatTitle } from "./MsgTypes";

// ── Вспомогательные компоненты ──────────────────────────────────────────────

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

// ── Основной компонент ───────────────────────────────────────────────────────

interface Props {
  activeChat: Chat;
  visibleMessages: Message[];
  userId: number;
  msgSearch: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onCloseChatMenu: () => void;
  onSetLightbox: (url: string) => void;
  onRemoveMessage: (id: number) => void;
  onReact: (msgId: number, emoji: string) => void;
  onSetReplyTo: (msg: Message) => void;
  onStartEdit: (msg: { id: number; content: string }) => void;
}

export default function MsgChatMessages({
  activeChat, visibleMessages, userId, msgSearch,
  messagesEndRef, onCloseChatMenu, onSetLightbox,
  onRemoveMessage, onReact, onSetReplyTo, onStartEdit,
}: Props) {
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

  const handleReact = (msgId: number, emoji: string) => {
    setShowReactPicker(null);
    setReactingId(msgId);
    onReact(msgId, emoji);
    setTimeout(() => setReactingId(null), 400);
  };

  const isSearchMode = msgSearch.trim().length > 0;

  const isGrouped = (idx: number): boolean => {
    if (idx === 0) return false;
    const cur = visibleMessages[idx];
    const prev = visibleMessages[idx - 1];
    if (cur.sender_id !== prev.sender_id) return false;
    const diff = new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime();
    return diff < 2 * 60 * 1000;
  };

  const isLastInGroup = (idx: number): boolean => {
    const cur = visibleMessages[idx];
    const next = visibleMessages[idx + 1];
    if (!next) return true;
    if (next.sender_id !== cur.sender_id) return true;
    const diff = new Date(next.created_at).getTime() - new Date(cur.created_at).getTime();
    return diff >= 2 * 60 * 1000;
  };

  return (
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
                      {isMine && !msg.image_url && (
                        <button onClick={() => onStartEdit({ id: msg.id, content: msg.content })}
                          className="p-1.5 text-[#3a5570] hover:text-[#00ff88] transition-colors" title="Редактировать">
                          <Icon name="Pencil" size={13} />
                        </button>
                      )}
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
  );
}

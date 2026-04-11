import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/App";
import { Topic, Reply, timeAgo, renderMarkdown } from "./DiscTypes";

interface Props {
  selectedId: number | null;
  selectedTopic: Topic | null;
  topicLoading: boolean;
  replies: Reply[];
  visibleReplies: Reply[];
  user?: User;
  newReply: string;
  sending: boolean;
  editingReplyId: number | null;
  editingText: string;
  quoteReply: Reply | null;
  threadSearch: string;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  repliesEndRef: React.RefObject<HTMLDivElement>;
  onBack: () => void;
  onSetNewReply: (v: string) => void;
  onSetThreadSearch: (v: string) => void;
  onSetQuoteReply: (r: Reply | null) => void;
  onSetEditingReplyId: (id: number | null) => void;
  onSetEditingText: (v: string) => void;
  onReply: () => void;
  onLike: (r: Reply) => void;
  onSaveEdit: () => void;
  onDeleteReply: (id: number) => void;
}

export default function DiscThread({
  selectedId, selectedTopic, topicLoading,
  replies, visibleReplies,
  user, newReply, sending,
  editingReplyId, editingText,
  quoteReply, threadSearch,
  inputRef, repliesEndRef,
  onBack, onSetNewReply, onSetThreadSearch, onSetQuoteReply,
  onSetEditingReplyId, onSetEditingText,
  onReply, onLike, onSaveEdit, onDeleteReply,
}: Props) {
  if (!selectedId) {
    return (
      <div className="flex items-center justify-center h-64" style={{ border: "1px solid #1a2a3a" }}>
        <div className="text-center">
          <Icon name="MessageSquare" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570]">Выберите тему</div>
        </div>
      </div>
    );
  }

  if (topicLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ border: "1px solid #1a2a3a" }}>
        <div className="font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      </div>
    );
  }

  if (!selectedTopic) return null;

  return (
    <div className="flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "#0a1520" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
        <button
          className="flex lg:hidden items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] mb-3 transition-colors"
          onClick={onBack}>
          <Icon name="ChevronLeft" size={14} /> Все темы
        </button>
        <div className="font-mono text-[10px] px-1.5 py-0.5 inline-block mb-2" style={{ border: "1px solid #1a2a3a", color: "#3a5570" }}>{selectedTopic.category}</div>
        <h2 className="font-plex text-base sm:text-lg font-semibold text-white mb-2">{selectedTopic.title}</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#3a5570]">
          <span className="font-mono text-xs">@{selectedTopic.author_callsign || selectedTopic.author_name}</span>
          <div className="flex items-center gap-1"><Icon name="MessageSquare" size={11} /><span className="font-mono text-xs">{replies.length} ответов</span></div>
          <div className="flex items-center gap-1"><Icon name="Eye" size={11} /><span className="font-mono text-xs">{selectedTopic.views}</span></div>
        </div>
        {/* Thread search */}
        <div className="relative mt-3">
          <Icon name="Search" size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input
            type="text"
            placeholder="Поиск в теме..."
            value={threadSearch}
            onChange={e => onSetThreadSearch(e.target.value)}
            className="w-full bg-[#050810] border border-[rgba(0,245,255,0.1)] text-[#e0f4ff] font-mono text-xs pl-7 pr-3 py-1.5 outline-none focus:border-[rgba(0,245,255,0.4)] placeholder:text-[#2a4060]"
          />
          {threadSearch && (
            <button onClick={() => onSetThreadSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-white">
              <Icon name="X" size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      <div className="overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4" style={{ maxHeight: "min(440px, 48vh)" }}>
        {visibleReplies.length === 0 ? (
          <div className="text-center py-8 font-mono text-xs text-[#3a5570]">
            {threadSearch ? "Ничего не найдено" : "Комментариев пока нет. Будьте первым!"}
          </div>
        ) : visibleReplies.map(r => (
          <div key={r.id} className="flex gap-3 group">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-orbitron text-xs text-[#00f5ff]"
              style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }}>
              {(r.author_callsign || r.author_name || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs text-[#00f5ff]">@{r.author_callsign || r.author_name}</span>
                <span className="font-mono text-[10px] text-[#3a5570]">{timeAgo(r.created_at)}</span>
                {r.updated_at && <span className="font-mono text-[9px] text-[#2a4060]">(ред.)</span>}
                <div className="ml-auto flex items-center gap-1.5">
                  {user && (
                    <button onClick={() => onLike(r)}
                      className="flex items-center gap-1 font-mono text-[10px] transition-colors"
                      style={{ color: r.i_liked ? "#ff6b6b" : "#3a5570" }}
                      title={r.i_liked ? "Убрать лайк" : "Лайк"}>
                      <Icon name="Heart" size={11} />
                      {r.likes_count > 0 && <span>{r.likes_count}</span>}
                    </button>
                  )}
                  {user && (
                    <button onClick={() => { onSetQuoteReply(r); inputRef.current?.focus(); }}
                      className="text-[#3a5570] hover:text-[#00f5ff] transition-colors opacity-0 group-hover:opacity-100"
                      title="Процитировать">
                      <Icon name="Quote" size={11} />
                    </button>
                  )}
                  {user && (user.id === r.author_id || user.is_admin) && (
                    <button onClick={() => { onSetEditingReplyId(r.id); onSetEditingText(r.text); }}
                      className="text-[#3a5570] hover:text-[#00f5ff] transition-colors opacity-0 group-hover:opacity-100" title="Редактировать">
                      <Icon name="Pencil" size={11} />
                    </button>
                  )}
                  {user?.is_admin && (
                    <button onClick={() => onDeleteReply(r.id)}
                      className="text-[#3a5570] hover:text-[#ff2244] transition-colors opacity-0 group-hover:opacity-100" title="Удалить">
                      <Icon name="Trash2" size={11} />
                    </button>
                  )}
                </div>
              </div>

              {r.quote_text && (
                <div className="mb-2 px-2 py-1.5 border-l-2 border-[rgba(0,245,255,0.3)]" style={{ background: "rgba(0,245,255,0.03)" }}>
                  <div className="font-mono text-[9px] text-[#3a5570] mb-0.5">@{r.quote_callsign}</div>
                  <div className="font-plex text-xs text-[#5a7a95] line-clamp-2">{r.quote_text}</div>
                </div>
              )}

              {editingReplyId === r.id ? (
                <div className="space-y-2">
                  <textarea value={editingText} onChange={(e) => onSetEditingText(e.target.value)} rows={3}
                    className="w-full bg-[#050810] border border-[rgba(0,245,255,0.3)] text-[#e0f4ff] font-plex text-sm px-3 py-2 outline-none resize-none" />
                  <div className="flex gap-2">
                    <button onClick={onSaveEdit} className="font-mono text-xs px-3 py-1 flex items-center gap-1" style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>
                      <Icon name="Check" size={11} />Сохранить
                    </button>
                    <button onClick={() => onSetEditingReplyId(null)} className="font-mono text-xs px-3 py-1 text-[#3a5570]" style={{ border: "1px solid #1a2a3a" }}>Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="font-plex text-sm text-[#8ab0cc] leading-relaxed p-3"
                  style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  {renderMarkdown(r.text)}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={repliesEndRef} />
      </div>

      {/* Reply input */}
      {user ? (
        <div className="p-3 sm:p-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(0,245,255,0.1)" }}>
          {quoteReply && (
            <div className="flex items-start gap-2 px-3 py-2" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(0,245,255,0.03)" }}>
              <Icon name="Quote" size={12} className="text-[#3a5570] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] text-[#00f5ff] mb-0.5">@{quoteReply.author_callsign || quoteReply.author_name}</div>
                <div className="font-plex text-xs text-[#5a7a95] line-clamp-2">{quoteReply.text}</div>
              </div>
              <button onClick={() => onSetQuoteReply(null)} className="text-[#3a5570] hover:text-white flex-shrink-0">
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={newReply}
              onChange={(e) => onSetNewReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) onReply(); }}
              placeholder="Написать ответ... (Ctrl+Enter для отправки, поддерживается **жирный**, `код`)"
              rows={2}
              className="flex-1 bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2 outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060] resize-none"
            />
            <button onClick={onReply} disabled={sending || !newReply.trim()}
              className="btn-neon-filled flex items-center justify-center gap-2 self-end flex-shrink-0 disabled:opacity-40 py-2.5 sm:py-2">
              {sending ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Send" size={13} />}
              {sending ? "..." : "Отправить"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 font-mono text-xs text-[#3a5570] text-center" style={{ borderTop: "1px solid rgba(0,245,255,0.1)" }}>
          Войдите чтобы оставить комментарий
        </div>
      )}
    </div>
  );
}

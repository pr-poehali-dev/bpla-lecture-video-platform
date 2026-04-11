import { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/App";
import { api } from "@/api";
import { usePageData } from "@/hooks/usePageData";

interface Props { user?: User; }

interface Topic {
  id: number;
  title: string;
  category: string;
  views: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_callsign: string;
  replies_count: number;
  is_pinned?: boolean;
}

interface Reply {
  id: number;
  text: string;
  created_at: string;
  updated_at?: string;
  author_name: string;
  author_callsign: string;
  author_id?: number;
  likes_count: number;
  i_liked: boolean;
  quote_reply_id?: number | null;
  quote_text?: string | null;
  quote_callsign?: string | null;
}

const CATEGORIES = ["Общее", "Техника", "Тактика", "Настройка", "Разбор", "Вопросы"];
type SortMode = "active" | "new" | "popular";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} д назад`;
}

// Простой markdown: **bold**, `code`, ```block```
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (inCode) {
        result.push(
          <pre key={i} className="my-2 px-3 py-2 font-mono text-xs text-[#00ff88] overflow-x-auto rounded-sm"
            style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)" }}>
            {codeLines.join("\n")}
          </pre>
        );
        codeLines = []; inCode = false;
      } else { inCode = true; }
      return;
    }
    if (inCode) { codeLines.push(line); return; }

    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={j} className="font-mono text-[11px] px-1 py-0.5 rounded-sm text-[#00f5ff]"
          style={{ background: "rgba(0,245,255,0.08)" }}>{part.slice(1, -1)}</code>;
      return part;
    });
    result.push(<span key={i}>{parts}{i < lines.length - 1 && <br />}</span>);
  });
  return result;
}

// Хранение времени последнего посещения темы
function useLastSeen() {
  const get = (topicId: number) => {
    try { return parseInt(localStorage.getItem(`disc_seen_${topicId}`) || "0"); } catch (_e) { return 0; }
  };
  const set = (topicId: number) => {
    try { localStorage.setItem(`disc_seen_${topicId}`, String(Date.now())); } catch (_e) { /* ignore */ }
  };
  return { get, set };
}

export default function DiscussionsPage({ user }: Props) {
  const canCreate = user?.is_admin || ["инструктор кт", "инструктор fpv", "инструктор оператор-сапер"].includes(user?.role || "");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [sortMode, setSortMode] = useState<SortMode>("active");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicLoading, setTopicLoading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [sending, setSending] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Общее", text: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [quoteReply, setQuoteReply] = useState<Reply | null>(null);
  const [threadSearch, setThreadSearch] = useState("");
  const repliesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSeen = useLastSeen();
  const { header } = usePageData("discussions");

  const loadTopics = () => {
    setLoading(true);
    api.discussions.topics().then((res) => {
      setTopics(res.topics || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadTopics(); }, []);

  const openTopic = (id: number) => {
    setSelectedId(id);
    setTopicLoading(true);
    setThreadSearch("");
    setQuoteReply(null);
    api.discussions.topic(id).then((res) => {
      setSelectedTopic(res.topic || null);
      setReplies(res.replies || []);
      setTopicLoading(false);
      lastSeen.set(id);
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  };

  const handleReply = async () => {
    if (!newReply.trim() || !selectedId) return;
    setSending(true);
    const res = await api.discussions.reply(selectedId, newReply.trim(), quoteReply?.id);
    setSending(false);
    if (res.id) {
      setNewReply(""); setQuoteReply(null);
      openTopic(selectedId);
      loadTopics();
    }
  };

  const handleLike = async (reply: Reply) => {
    if (!user) return;
    const res = await api.discussions.like(reply.id);
    if (res.likes_count !== undefined) {
      setReplies(prev => prev.map(r => r.id === reply.id ? { ...r, likes_count: res.likes_count, i_liked: res.liked } : r));
    }
  };

  const handleQuote = (reply: Reply) => {
    setQuoteReply(reply);
    inputRef.current?.focus();
  };

  const handleDeleteTopic = async (id: number) => {
    if (!confirm("Удалить обсуждение со всеми ответами?")) return;
    await api.discussions.deleteTopic(id);
    setSelectedId(null); setSelectedTopic(null); setReplies([]);
    loadTopics();
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm("Удалить ответ?")) return;
    await api.discussions.deleteReply(replyId);
    if (selectedId) openTopic(selectedId);
  };

  const handleSaveEdit = async () => {
    if (!editingReplyId || !editingText.trim()) return;
    await api.discussions.editReply(editingReplyId, editingText.trim());
    setEditingReplyId(null); setEditingText("");
    if (selectedId) openTopic(selectedId);
  };

  const handlePinTopic = async (topicId: number) => {
    await api.discussions.pinTopic(topicId); loadTopics();
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { setCreateError("Укажите заголовок"); return; }
    setCreating(true); setCreateError("");
    const res = await api.discussions.create(form);
    setCreating(false);
    if (res.id) {
      setShowCreate(false); setForm({ title: "", category: "Общее", text: "" });
      loadTopics(); openTopic(res.id);
    } else { setCreateError(res.error || "Ошибка"); }
  };

  const visibleTopics = useMemo(() => {
    const list = topics.filter(t => {
      const matchCat = activeCategory === "Все" || t.category === activeCategory;
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    const pinned = list.filter(t => t.is_pinned);
    const rest = list.filter(t => !t.is_pinned);
    const sorted = [...rest].sort((a, b) => {
      if (sortMode === "new") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortMode === "popular") return b.replies_count - a.replies_count;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return [...pinned, ...sorted];
  }, [topics, activeCategory, search, sortMode]);

  const visibleReplies = useMemo(() => {
    if (!threadSearch.trim()) return replies;
    return replies.filter(r => r.text.toLowerCase().includes(threadSearch.toLowerCase()));
  }, [replies, threadSearch]);

  const hasNew = (topic: Topic) => {
    const seen = lastSeen.get(topic.id);
    return seen > 0 && new Date(topic.updated_at).getTime() > seen;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">{header?.subtitle ?? "// ФОРУМ СООБЩЕСТВА"}</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-6 sm:mb-8 tracking-wider">{header?.title ?? "ОБСУЖДЕНИЯ"}</h1>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(5,8,16,0.95)" }} onClick={() => setShowCreate(false)}>
          <div className="w-full sm:max-w-lg space-y-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            style={{ border: "1px solid #00f5ff", background: "#050810", boxShadow: "0 0 40px rgba(0,245,255,0.15)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="font-orbitron text-lg font-bold text-white tracking-wider">НОВОЕ ОБСУЖДЕНИЕ</div>
            <div>
              <label className="font-mono text-xs text-[#3a5570] block mb-1">ЗАГОЛОВОК *</label>
              <input className="w-full bg-transparent font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                style={{ border: "1px solid #1a2a3a" }}
                value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Тема обсуждения" autoFocus />
            </div>
            <div>
              <label className="font-mono text-xs text-[#3a5570] block mb-1">КАТЕГОРИЯ</label>
              <select className="w-full bg-[#0a1520] font-mono text-sm text-white px-3 py-2 outline-none"
                style={{ border: "1px solid #1a2a3a" }}
                value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs text-[#3a5570] block mb-1">ПЕРВОЕ СООБЩЕНИЕ</label>
              <textarea className="w-full bg-transparent font-mono text-sm text-white px-3 py-2 outline-none resize-none"
                style={{ border: "1px solid #1a2a3a" }} rows={4}
                value={form.text} onChange={(e) => setForm(p => ({ ...p, text: e.target.value }))}
                placeholder="Поддерживается форматирование: **жирный**, `код`, ```блок кода```" />
            </div>
            {createError && <div className="font-mono text-xs text-[#ff2244]">{createError}</div>}
            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={creating} className="btn-neon flex items-center gap-2 disabled:opacity-50">
                {creating ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
                {creating ? "СОЗДАНИЕ..." : "СОЗДАТЬ"}
              </button>
              <button onClick={() => setShowCreate(false)} className="font-mono text-xs px-4 py-2 text-[#3a5570]" style={{ border: "1px solid #1a2a3a" }}>ОТМЕНА</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Topics list */}
        <div className={`lg:col-span-2 space-y-2 ${selectedId ? "hidden lg:block" : "block"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-[#3a5570]">{visibleTopics.length} ТОПИКОВ</span>
            {canCreate && (
              <button onClick={() => setShowCreate(true)} className="btn-neon text-[10px] px-3 py-1.5 flex items-center gap-1">
                <Icon name="Plus" size={10} /> СОЗДАТЬ
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
            <input type="text" placeholder="ПОИСК ТЕМ..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a1020] border border-[rgba(0,245,255,0.12)] text-[#e0f4ff] font-mono text-xs pl-8 pr-3 py-2 outline-none focus:border-[rgba(0,245,255,0.4)] placeholder:text-[#2a4060]" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-white"><Icon name="X" size={11} /></button>}
          </div>

          {/* Sort */}
          <div className="flex gap-1 mb-2">
            {([["active", "Активные"], ["new", "Новые"], ["popular", "Популярные"]] as [SortMode, string][]).map(([mode, label]) => (
              <button key={mode} onClick={() => setSortMode(mode)}
                className="flex-1 font-mono text-[9px] py-1 transition-all"
                style={{
                  border: `1px solid ${sortMode === mode ? "rgba(0,245,255,0.4)" : "#1a2a3a"}`,
                  color: sortMode === mode ? "#00f5ff" : "#3a5570",
                  background: sortMode === mode ? "rgba(0,245,255,0.05)" : "transparent",
                }}>
                {label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1 mb-3">
            {["Все", ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="font-mono text-[9px] px-2 py-0.5 transition-all"
                style={{
                  border: `1px solid ${activeCategory === cat ? "#00f5ff" : "#1a2a3a"}`,
                  color: activeCategory === cat ? "#00f5ff" : "#3a5570",
                  background: activeCategory === cat ? "rgba(0,245,255,0.05)" : "transparent",
                }}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="font-mono text-xs text-[#3a5570] animate-pulse py-8 text-center">ЗАГРУЗКА...</div>
          ) : visibleTopics.length === 0 ? (
            <div className="font-mono text-xs text-[#3a5570] py-12 text-center" style={{ border: "1px solid #1a2a3a" }}>Ничего не найдено</div>
          ) : visibleTopics.map(t => (
            <button key={t.id} onClick={() => openTopic(t.id)}
              className="w-full text-left p-3 sm:p-4 transition-all duration-200 relative group"
              style={selectedId === t.id
                ? { background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.3)" }
                : { background: "#0a1520", border: "1px solid #1a2a3a" }}>
              {user?.is_admin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                  <button onClick={(e) => { e.stopPropagation(); handlePinTopic(t.id); }}
                    className="text-[#3a5570] hover:text-[#ffbe32] transition-colors" title={t.is_pinned ? "Открепить" : "Закрепить"}>
                    <Icon name="Pin" size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id); }}
                    className="text-[#3a5570] hover:text-[#ff2244] transition-colors">
                    <Icon name="Trash2" size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-2 mb-2">
                {t.is_pinned && <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ border: "1px solid rgba(255,190,50,0.4)", color: "#ffbe32" }}>📌</span>}
                <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ border: "1px solid #1a2a3a", color: "#3a5570" }}>{t.category}</span>
                {hasNew(t) && <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88" }}>NEW</span>}
              </div>
              <div className="font-plex text-sm text-white leading-snug mb-2">{t.title}</div>
              <div className="flex items-center gap-3 text-[#3a5570]">
                <span className="font-mono text-[10px]">@{t.author_callsign || t.author_name}</span>
                <div className="flex items-center gap-1">
                  <Icon name="MessageSquare" size={10} />
                  <span className="font-mono text-[10px]">{t.replies_count}</span>
                </div>
                <span className="font-mono text-[10px]">{timeAgo(t.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className={`lg:col-span-3 ${selectedId ? "block" : "hidden lg:block"}`}>
          {!selectedId ? (
            <div className="flex items-center justify-center h-64" style={{ border: "1px solid #1a2a3a" }}>
              <div className="text-center">
                <Icon name="MessageSquare" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
                <div className="font-mono text-xs text-[#3a5570]">Выберите тему</div>
              </div>
            </div>
          ) : topicLoading ? (
            <div className="flex items-center justify-center h-64" style={{ border: "1px solid #1a2a3a" }}>
              <div className="font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
            </div>
          ) : selectedTopic ? (
            <div className="flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "#0a1520" }}>
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
                <button className="flex lg:hidden items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] mb-3 transition-colors"
                  onClick={() => { setSelectedId(null); setSelectedTopic(null); }}>
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
                  <input type="text" placeholder="Поиск в теме..." value={threadSearch}
                    onChange={e => setThreadSearch(e.target.value)}
                    className="w-full bg-[#050810] border border-[rgba(0,245,255,0.1)] text-[#e0f4ff] font-mono text-xs pl-7 pr-3 py-1.5 outline-none focus:border-[rgba(0,245,255,0.4)] placeholder:text-[#2a4060]" />
                  {threadSearch && <button onClick={() => setThreadSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-white"><Icon name="X" size={10} /></button>}
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
                          {/* Like */}
                          {user && (
                            <button onClick={() => handleLike(r)}
                              className="flex items-center gap-1 font-mono text-[10px] transition-colors"
                              style={{ color: r.i_liked ? "#ff6b6b" : "#3a5570" }}
                              title={r.i_liked ? "Убрать лайк" : "Лайк"}>
                              <Icon name="Heart" size={11} />
                              {r.likes_count > 0 && <span>{r.likes_count}</span>}
                            </button>
                          )}
                          {/* Quote */}
                          {user && (
                            <button onClick={() => handleQuote(r)}
                              className="text-[#3a5570] hover:text-[#00f5ff] transition-colors opacity-0 group-hover:opacity-100"
                              title="Процитировать">
                              <Icon name="Quote" size={11} />
                            </button>
                          )}
                          {/* Edit */}
                          {user && (user.id === r.author_id || user.is_admin) && (
                            <button onClick={() => { setEditingReplyId(r.id); setEditingText(r.text); }}
                              className="text-[#3a5570] hover:text-[#00f5ff] transition-colors opacity-0 group-hover:opacity-100" title="Редактировать">
                              <Icon name="Pencil" size={11} />
                            </button>
                          )}
                          {/* Delete */}
                          {user?.is_admin && (
                            <button onClick={() => handleDeleteReply(r.id)}
                              className="text-[#3a5570] hover:text-[#ff2244] transition-colors opacity-0 group-hover:opacity-100" title="Удалить">
                              <Icon name="Trash2" size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quote block */}
                      {r.quote_text && (
                        <div className="mb-2 px-2 py-1.5 border-l-2 border-[rgba(0,245,255,0.3)]" style={{ background: "rgba(0,245,255,0.03)" }}>
                          <div className="font-mono text-[9px] text-[#3a5570] mb-0.5">@{r.quote_callsign}</div>
                          <div className="font-plex text-xs text-[#5a7a95] line-clamp-2">{r.quote_text}</div>
                        </div>
                      )}

                      {editingReplyId === r.id ? (
                        <div className="space-y-2">
                          <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={3}
                            className="w-full bg-[#050810] border border-[rgba(0,245,255,0.3)] text-[#e0f4ff] font-plex text-sm px-3 py-2 outline-none resize-none" />
                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit} className="font-mono text-xs px-3 py-1 flex items-center gap-1" style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>
                              <Icon name="Check" size={11} />Сохранить
                            </button>
                            <button onClick={() => setEditingReplyId(null)} className="font-mono text-xs px-3 py-1 text-[#3a5570]" style={{ border: "1px solid #1a2a3a" }}>Отмена</button>
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
                  {/* Quote preview */}
                  {quoteReply && (
                    <div className="flex items-start gap-2 px-3 py-2" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(0,245,255,0.03)" }}>
                      <Icon name="Quote" size={12} className="text-[#3a5570] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[10px] text-[#00f5ff] mb-0.5">@{quoteReply.author_callsign || quoteReply.author_name}</div>
                        <div className="font-plex text-xs text-[#5a7a95] line-clamp-2">{quoteReply.text}</div>
                      </div>
                      <button onClick={() => setQuoteReply(null)} className="text-[#3a5570] hover:text-white flex-shrink-0">
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea ref={inputRef} value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleReply(); }}
                      placeholder="Написать ответ... (Ctrl+Enter для отправки, поддерживается **жирный**, `код`)"
                      rows={2}
                      className="flex-1 bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2 outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060] resize-none" />
                    <button onClick={handleReply} disabled={sending || !newReply.trim()}
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
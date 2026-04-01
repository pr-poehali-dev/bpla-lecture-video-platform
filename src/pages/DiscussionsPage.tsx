import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/App";
import { api } from "@/api";

interface Props {
  user?: User;
}

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
}

interface Reply {
  id: number;
  text: string;
  created_at: string;
  author_name: string;
  author_callsign: string;
}

const CATEGORIES = ["Общее", "Техника", "Тактика", "Настройка", "Разбор", "Вопросы"];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} д назад`;
}

export default function DiscussionsPage({ user }: Props) {
  const canCreate = user?.is_admin || ["инструктор кт", "инструктор fpv", "инструктор оператор-сапер"].includes(user?.role || "");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicLoading, setTopicLoading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Общее", text: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const repliesEndRef = useRef<HTMLDivElement>(null);

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
    api.discussions.topic(id).then((res) => {
      setSelectedTopic(res.topic || null);
      setReplies(res.replies || []);
      setTopicLoading(false);
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  };

  const handleReply = async () => {
    if (!newReply.trim() || !selectedId) return;
    setSending(true);
    const res = await api.discussions.reply(selectedId, newReply.trim());
    setSending(false);
    if (res.id) {
      setNewReply("");
      openTopic(selectedId);
      loadTopics();
    }
  };

  const handleDeleteTopic = async (id: number) => {
    if (!confirm("Удалить обсуждение со всеми ответами?")) return;
    await api.discussions.deleteTopic(id);
    setSelectedId(null);
    setSelectedTopic(null);
    setReplies([]);
    loadTopics();
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm("Удалить ответ?")) return;
    await api.discussions.deleteReply(replyId);
    if (selectedId) openTopic(selectedId);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { setCreateError("Укажите заголовок"); return; }
    setCreating(true);
    setCreateError("");
    const res = await api.discussions.create(form);
    setCreating(false);
    if (res.id) {
      setShowCreate(false);
      setForm({ title: "", category: "Общее", text: "" });
      loadTopics();
      openTopic(res.id);
    } else {
      setCreateError(res.error || "Ошибка");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ФОРУМ СООБЩЕСТВА</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-8 tracking-wider">ОБСУЖДЕНИЯ</h1>

      {/* Create topic modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(5,8,16,0.95)" }} onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg space-y-4 p-6" style={{ border: "1px solid #00f5ff", background: "#050810", boxShadow: "0 0 40px rgba(0,245,255,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div className="font-orbitron text-lg font-bold text-white tracking-wider">НОВОЕ ОБСУЖДЕНИЕ</div>

            <div>
              <label className="font-mono text-xs text-[#3a5570] block mb-1">ЗАГОЛОВОК *</label>
              <input
                className="w-full bg-transparent font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                style={{ border: "1px solid #1a2a3a" }}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Тема обсуждения"
                autoFocus
              />
            </div>

            <div>
              <label className="font-mono text-xs text-[#3a5570] block mb-1">КАТЕГОРИЯ</label>
              <select
                className="w-full bg-[#0a1520] font-mono text-sm text-white px-3 py-2 outline-none"
                style={{ border: "1px solid #1a2a3a" }}
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="font-mono text-xs text-[#3a5570] block mb-1">ПЕРВОЕ СООБЩЕНИЕ</label>
              <textarea
                className="w-full bg-transparent font-mono text-sm text-white px-3 py-2 outline-none resize-none"
                style={{ border: "1px solid #1a2a3a" }}
                rows={4}
                value={form.text}
                onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
                placeholder="Опишите тему..."
              />
            </div>

            {createError && <div className="font-mono text-xs text-[#ff2244]">{createError}</div>}

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-neon flex items-center gap-2 disabled:opacity-50"
              >
                {creating ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
                {creating ? "СОЗДАНИЕ..." : "СОЗДАТЬ"}
              </button>
              <button onClick={() => setShowCreate(false)} className="font-mono text-xs px-4 py-2 text-[#3a5570]" style={{ border: "1px solid #1a2a3a" }}>
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Topics list */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-[#3a5570]">{topics.length} ТОПИКОВ</span>
            {canCreate && (
              <button onClick={() => setShowCreate(true)} className="btn-neon text-[10px] px-3 py-1.5 flex items-center gap-1">
                <Icon name="Plus" size={10} />
                СОЗДАТЬ
              </button>
            )}
          </div>

          {loading ? (
            <div className="font-mono text-xs text-[#3a5570] animate-pulse py-8 text-center">ЗАГРУЗКА...</div>
          ) : topics.length === 0 ? (
            <div className="font-mono text-xs text-[#3a5570] py-12 text-center" style={{ border: "1px solid #1a2a3a" }}>
              Обсуждений пока нет
              {canCreate && <div className="mt-2 text-[#1a2a3a]">Создайте первое</div>}
            </div>
          ) : (
            topics.map((t) => (
              <button
                key={t.id}
                onClick={() => openTopic(t.id)}
                className="w-full text-left p-4 transition-all duration-200 relative group"
                style={
                  selectedId === t.id
                    ? { background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.3)" }
                    : { background: "#0a1520", border: "1px solid #1a2a3a" }
                }
              >
                {user?.is_admin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[#3a5570] hover:text-[#ff2244] transition-all"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
                )}
                <div className="flex items-start gap-2 mb-2">
                  <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ border: "1px solid #1a2a3a", color: "#3a5570" }}>{t.category}</span>
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
            ))
          )}
        </div>

        {/* Thread */}
        <div className="lg:col-span-3">
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
            <div className="flex flex-col h-full" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "#0a1520" }}>
              {/* Header */}
              <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
                <div className="font-mono text-[10px] px-1.5 py-0.5 inline-block mb-2" style={{ border: "1px solid #1a2a3a", color: "#3a5570" }}>{selectedTopic.category}</div>
                <h2 className="font-plex text-lg font-semibold text-white mb-2">{selectedTopic.title}</h2>
                <div className="flex items-center gap-4 text-[#3a5570]">
                  <span className="font-mono text-xs">@{selectedTopic.author_callsign || selectedTopic.author_name}</span>
                  <div className="flex items-center gap-1">
                    <Icon name="MessageSquare" size={11} />
                    <span className="font-mono text-xs">{replies.length} ответов</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="Eye" size={11} />
                    <span className="font-mono text-xs">{selectedTopic.views}</span>
                  </div>
                </div>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: "420px" }}>
                {replies.length === 0 ? (
                  <div className="text-center py-8 font-mono text-xs text-[#3a5570]">Комментариев пока нет. Будьте первым!</div>
                ) : (
                  replies.map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-orbitron text-xs text-[#00f5ff]" style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }}>
                        {(r.author_callsign || r.author_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-[#00f5ff]">@{r.author_callsign || r.author_name}</span>
                          <span className="font-mono text-[10px] text-[#3a5570]">{timeAgo(r.created_at)}</span>
                          {user?.is_admin && (
                            <button
                              onClick={() => handleDeleteReply(r.id)}
                              className="ml-auto text-[#3a5570] hover:text-[#ff2244] transition-colors"
                              title="Удалить ответ"
                            >
                              <Icon name="Trash2" size={12} />
                            </button>
                          )}
                        </div>
                        <div className="font-plex text-sm text-[#8ab0cc] leading-relaxed p-3" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          {r.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={repliesEndRef} />
              </div>

              {/* Reply input */}
              {user ? (
                <div className="p-4 flex gap-3" style={{ borderTop: "1px solid rgba(0,245,255,0.1)" }}>
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleReply(); }}
                    placeholder="Написать комментарий... (Ctrl+Enter)"
                    rows={2}
                    className="flex-1 bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2 outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060] resize-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={sending || !newReply.trim()}
                    className="btn-neon-filled flex items-center gap-2 self-end flex-shrink-0 disabled:opacity-40"
                  >
                    {sending ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Send" size={13} />}
                    {sending ? "..." : "Отправить"}
                  </button>
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
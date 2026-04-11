import { useState, useEffect, useRef, useMemo } from "react";
import { type User } from "@/App";
import { api } from "@/api";
import { usePageData } from "@/hooks/usePageData";
import { Topic, Reply, SortMode, useLastSeen } from "./discussions/DiscTypes";
import DiscCreateModal from "./discussions/DiscCreateModal";
import DiscTopicsList from "./discussions/DiscTopicsList";
import DiscThread from "./discussions/DiscThread";

interface Props { user?: User; }

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

      {showCreate && (
        <DiscCreateModal
          form={form}
          creating={creating}
          createError={createError}
          onClose={() => setShowCreate(false)}
          onChange={setForm}
          onCreate={handleCreate}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <DiscTopicsList
          topics={visibleTopics}
          loading={loading}
          selectedId={selectedId}
          search={search}
          activeCategory={activeCategory}
          sortMode={sortMode}
          canCreate={canCreate}
          hasNew={hasNew}
          isAdmin={!!user?.is_admin}
          onOpenTopic={openTopic}
          onSetSearch={setSearch}
          onSetCategory={setActiveCategory}
          onSetSortMode={setSortMode}
          onShowCreate={() => setShowCreate(true)}
          onPinTopic={handlePinTopic}
          onDeleteTopic={handleDeleteTopic}
        />

        <div className={`lg:col-span-3 ${selectedId ? "block" : "hidden lg:block"}`}>
          <DiscThread
            selectedId={selectedId}
            selectedTopic={selectedTopic}
            topicLoading={topicLoading}
            replies={replies}
            visibleReplies={visibleReplies}
            user={user}
            newReply={newReply}
            sending={sending}
            editingReplyId={editingReplyId}
            editingText={editingText}
            quoteReply={quoteReply}
            threadSearch={threadSearch}
            inputRef={inputRef}
            repliesEndRef={repliesEndRef}
            onBack={() => { setSelectedId(null); setSelectedTopic(null); }}
            onSetNewReply={setNewReply}
            onSetThreadSearch={setThreadSearch}
            onSetQuoteReply={setQuoteReply}
            onSetEditingReplyId={setEditingReplyId}
            onSetEditingText={setEditingText}
            onReply={handleReply}
            onLike={handleLike}
            onSaveEdit={handleSaveEdit}
            onDeleteReply={handleDeleteReply}
          />
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";

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
  author_name: string;
  author_callsign: string;
  text: string;
  created_at: string;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return iso; }
}

export default function AdminDiscussionsTab() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<{ topic: Topic; replies: Reply[] } | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const loadTopics = async () => {
    setLoading(true);
    const res = await api.discussions.topics();
    setTopics(res.topics || []);
    setLoading(false);
  };

  useEffect(() => { loadTopics(); }, []);

  const openTopic = async (topic: Topic) => {
    const res = await api.discussions.topic(topic.id);
    setSelectedTopic({ topic, replies: res.replies || [] });
  };

  const deleteTopic = async (id: number) => {
    if (!confirm("Удалить тему со всеми ответами?")) return;
    const res = await api.discussions.deleteTopic(id);
    if (res.message) {
      showMsg(res.message);
      setSelectedTopic(null);
      loadTopics();
    } else {
      showMsg(res.error || "Ошибка", false);
    }
  };

  const deleteReply = async (replyId: number) => {
    const res = await api.discussions.deleteReply(replyId);
    if (res.message && selectedTopic) {
      showMsg(res.message);
      openTopic(selectedTopic.topic);
    } else {
      showMsg(res.error || "Ошибка", false);
    }
  };

  const filtered = topics.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.author_callsign?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedTopic) {
    const { topic, replies } = selectedTopic;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedTopic(null)}
            className="flex items-center gap-2 font-mono text-xs text-[#5a7a95] hover:text-[#00f5ff] transition-colors"
          >
            <Icon name="ChevronLeft" size={14} />
            Все темы
          </button>
          <div className="flex-1 h-px" style={{ background: "rgba(0,245,255,0.08)" }} />
          <button
            onClick={() => deleteTopic(topic.id)}
            className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 transition-colors"
            style={{ border: "1px solid rgba(255,34,68,0.3)", color: "#ff2244", background: "rgba(255,34,68,0.05)" }}
          >
            <Icon name="Trash2" size={12} />
            Удалить тему
          </button>
        </div>

        {msg && (
          <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
            {msg.ok ? "✓" : "✗"} {msg.text}
          </div>
        )}

        <div className="p-5" style={{ background: "#0a1520", border: "1px solid rgba(0,245,255,0.1)" }}>
          <div className="flex items-start gap-3 mb-2">
            <span className="font-mono text-[10px] px-2 py-0.5" style={{ background: "rgba(0,245,255,0.1)", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.2)" }}>
              {topic.category}
            </span>
            <span className="font-mono text-[10px] text-[#3a5570]">{fmtDate(topic.created_at)}</span>
          </div>
          <div className="font-orbitron text-base font-bold text-white mb-1">{topic.title}</div>
          <div className="font-mono text-xs text-[#5a7a95]">
            {topic.author_callsign || topic.author_name} · {topic.views} просм. · {topic.replies_count} ответов
          </div>
        </div>

        <div className="space-y-2">
          {replies.length === 0 ? (
            <div className="text-center py-8 font-mono text-xs text-[#3a5570]">Ответов нет</div>
          ) : replies.map((r) => (
            <div key={r.id} className="p-4 flex gap-3" style={{ background: "#081624", border: "1px solid #1a2a3a" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-[#00f5ff]">{r.author_callsign || r.author_name}</span>
                  <span className="font-mono text-[10px] text-[#3a5570]">{fmtDate(r.created_at)}</span>
                </div>
                <div className="font-plex text-sm text-[#9ab5cc] leading-relaxed">{r.text}</div>
              </div>
              <button
                onClick={() => deleteReply(r.id)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors"
              >
                <Icon name="Trash2" size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Всего тем", value: topics.length, color: "#00f5ff" },
          { label: "Ответов", value: topics.reduce((a, t) => a + (t.replies_count || 0), 0), color: "#00ff88" },
          { label: "Просмотров", value: topics.reduce((a, t) => a + (t.views || 0), 0), color: "#a855f7" },
        ].map((s) => (
          <div key={s.label} className="p-4 text-center" style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}>
            <div className="font-orbitron text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="font-mono text-xs text-[#3a5570] tracking-wider">{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по теме, автору, категории..."
        className="w-full px-4 py-2.5 font-mono text-sm bg-transparent text-white placeholder-[#3a5570] outline-none"
        style={{ border: "1px solid #1a2a3a" }}
      />

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 font-mono text-sm text-[#3a5570] tracking-widest">ЗАГРУЗКА...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 font-mono text-sm text-[#3a5570]" style={{ border: "1px solid #1a2a3a" }}>
          Тем не найдено
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((topic) => (
            <div
              key={topic.id}
              className="p-4 flex items-center gap-4 cursor-pointer transition-colors group"
              style={{ background: "#0a1520", border: "1px solid #1a2a3a" }}
              onClick={() => openTopic(topic)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: "rgba(0,245,255,0.08)", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.15)" }}>
                    {topic.category}
                  </span>
                  <span className="font-mono text-[10px] text-[#3a5570]">{fmtDate(topic.created_at)}</span>
                </div>
                <div className="font-plex text-sm text-white group-hover:text-[#00f5ff] transition-colors truncate">{topic.title}</div>
                <div className="font-mono text-[10px] text-[#3a5570] mt-1">
                  {topic.author_callsign || topic.author_name} · {topic.views} просм. · {topic.replies_count} ответов
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); deleteTopic(topic.id); }}
                  className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors"
                >
                  <Icon name="Trash2" size={13} />
                </button>
                <Icon name="ChevronRight" size={14} className="text-[#3a5570] group-hover:text-[#00f5ff] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

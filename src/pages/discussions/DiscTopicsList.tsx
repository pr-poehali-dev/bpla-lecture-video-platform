import Icon from "@/components/ui/icon";
import { Topic, SortMode, CATEGORIES, timeAgo } from "./DiscTypes";

interface Props {
  topics: Topic[];
  loading: boolean;
  selectedId: number | null;
  search: string;
  activeCategory: string;
  sortMode: SortMode;
  canCreate: boolean;
  hasNew: (topic: Topic) => boolean;
  isAdmin: boolean;
  onOpenTopic: (id: number) => void;
  onSetSearch: (v: string) => void;
  onSetCategory: (v: string) => void;
  onSetSortMode: (v: SortMode) => void;
  onShowCreate: () => void;
  onPinTopic: (id: number) => void;
  onDeleteTopic: (id: number) => void;
}

export default function DiscTopicsList({
  topics, loading, selectedId, search, activeCategory, sortMode,
  canCreate, hasNew, isAdmin,
  onOpenTopic, onSetSearch, onSetCategory, onSetSortMode,
  onShowCreate, onPinTopic, onDeleteTopic,
}: Props) {
  return (
    <div className={`lg:col-span-2 space-y-2 ${selectedId ? "hidden lg:block" : "block"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-[#3a5570]">{topics.length} ТОПИКОВ</span>
        {canCreate && (
          <button onClick={onShowCreate} className="btn-neon text-[10px] px-3 py-1.5 flex items-center gap-1">
            <Icon name="Plus" size={10} /> СОЗДАТЬ
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
        <input
          type="text"
          placeholder="ПОИСК ТЕМ..."
          value={search}
          onChange={(e) => onSetSearch(e.target.value)}
          className="w-full bg-[#0a1020] border border-[rgba(0,245,255,0.12)] text-[#e0f4ff] font-mono text-xs pl-8 pr-3 py-2 outline-none focus:border-[rgba(0,245,255,0.4)] placeholder:text-[#2a4060]"
        />
        {search && (
          <button onClick={() => onSetSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-white">
            <Icon name="X" size={11} />
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="flex gap-1 mb-2">
        {([["active", "Активные"], ["new", "Новые"], ["popular", "Популярные"]] as [SortMode, string][]).map(([mode, label]) => (
          <button key={mode} onClick={() => onSetSortMode(mode)}
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
          <button key={cat} onClick={() => onSetCategory(cat)}
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
      ) : topics.length === 0 ? (
        <div className="font-mono text-xs text-[#3a5570] py-12 text-center" style={{ border: "1px solid #1a2a3a" }}>Ничего не найдено</div>
      ) : topics.map(t => (
        <button key={t.id} onClick={() => onOpenTopic(t.id)}
          className="w-full text-left p-3 sm:p-4 transition-all duration-200 relative group"
          style={selectedId === t.id
            ? { background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.3)" }
            : { background: "#0a1520", border: "1px solid #1a2a3a" }}>
          {isAdmin && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
              <button onClick={(e) => { e.stopPropagation(); onPinTopic(t.id); }}
                className="text-[#3a5570] hover:text-[#ffbe32] transition-colors" title={t.is_pinned ? "Открепить" : "Закрепить"}>
                <Icon name="Pin" size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDeleteTopic(t.id); }}
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
  );
}

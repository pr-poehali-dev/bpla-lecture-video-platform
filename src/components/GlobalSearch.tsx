import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import { type Page } from "@/App";

interface Result {
  type: "lecture" | "video" | "discussion";
  id: number;
  title: string;
  category?: string;
  page: Page;
}

interface Props {
  onNavigate: (page: Page) => void;
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const TYPE_ICON: Record<string, string> = {
  lecture: "FileText",
  video: "Play",
  discussion: "MessageSquare",
};
const TYPE_LABEL: Record<string, string> = {
  lecture: "Лекция",
  video: "Видео",
  discussion: "Обсуждение",
};
const TYPE_COLOR: Record<string, string> = {
  lecture: "#00f5ff",
  video: "#00ff88",
  discussion: "#ffbe32",
};

export default function GlobalSearch({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Открытие по Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(""); setResults([]); }
  }, [open]);

  // Закрытие при клике снаружи
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) { setResults([]); return; }
    setLoading(true);
    Promise.all([
      api.files.list("document").catch(() => ({ files: [] })),
      api.files.list("video").catch(() => ({ files: [] })),
      api.discussions.topics().catch(() => ({ topics: [] })),
    ]).then(([docsRes, vidsRes, discRes]) => {
      const q = debouncedQuery.toLowerCase();
      const docs: Result[] = (docsRes.files || [])
        .filter((f: { title: string; description?: string }) =>
          f.title.toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q))
        .slice(0, 4)
        .map((f: { id: number; title: string; category?: string }) => ({ type: "lecture" as const, id: f.id, title: f.title, category: f.category, page: "lectures" as Page }));
      const vids: Result[] = (vidsRes.files || [])
        .filter((f: { title: string }) => f.title.toLowerCase().includes(q))
        .slice(0, 3)
        .map((f: { id: number; title: string; category?: string }) => ({ type: "video" as const, id: f.id, title: f.title, category: f.category, page: "videos" as Page }));
      const discs: Result[] = (discRes.topics || [])
        .filter((t: { title: string }) => t.title.toLowerCase().includes(q))
        .slice(0, 3)
        .map((t: { id: number; title: string; category?: string }) => ({ type: "discussion" as const, id: t.id, title: t.title, category: t.category, page: "discussions" as Page }));
      setResults([...docs, ...vids, ...discs]);
      setLoading(false);
    });
  }, [debouncedQuery]);

  const go = (result: Result) => {
    onNavigate(result.page);
    setOpen(false);
  };

  return (
    <>
      {/* Search button in header */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 transition-all"
        style={{ border: "1px solid rgba(0,245,255,0.12)", color: "#3a5570" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#00f5ff"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "#3a5570"; }}
        title="Поиск (Ctrl+K)"
      >
        <Icon name="Search" size={13} />
        <span className="font-mono text-[11px]">ПОИСК</span>
        <span className="font-mono text-[9px] px-1 py-0.5 ml-1" style={{ border: "1px solid rgba(0,245,255,0.1)", color: "#2a4060" }}>Ctrl+K</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-24 px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div ref={containerRef} className="w-full max-w-xl"
            style={{ background: "rgba(4,7,14,0.99)", border: "1px solid rgba(0,245,255,0.25)", boxShadow: "0 0 60px rgba(0,245,255,0.1), 0 24px 80px rgba(0,0,0,0.8)" }}>
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
              <Icon name="Search" size={16} className="text-[#3a5570] flex-shrink-0" />
              <input
                ref={inputRef}
                className="flex-1 bg-transparent font-mono text-sm text-white outline-none placeholder:text-[#2a4060]"
                placeholder="Поиск по лекциям, видео, обсуждениям..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {loading && <Icon name="Loader" size={14} className="text-[#3a5570] animate-spin flex-shrink-0" />}
              <button onClick={() => setOpen(false)} className="text-[#3a5570] hover:text-white transition-colors flex-shrink-0">
                <Icon name="X" size={14} />
              </button>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {query.length >= 2 && !loading && results.length === 0 && (
                <div className="px-4 py-8 text-center font-mono text-xs text-[#3a5570]">Ничего не найдено</div>
              )}
              {query.length < 2 && (
                <div className="px-4 py-6 text-center font-mono text-[11px] text-[#2a4060]">Введите минимум 2 символа</div>
              )}
              {results.map((r, i) => (
                <button key={`${r.type}-${r.id}`} onClick={() => go(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b"
                  style={{ borderColor: "rgba(0,245,255,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.04)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                    style={{ border: `1px solid ${TYPE_COLOR[r.type]}30`, background: `${TYPE_COLOR[r.type]}08` }}>
                    <Icon name={TYPE_ICON[r.type] as "Search"} size={13} style={{ color: TYPE_COLOR[r.type] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-white truncate">{r.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[9px]" style={{ color: TYPE_COLOR[r.type] }}>{TYPE_LABEL[r.type]}</span>
                      {r.category && <span className="font-mono text-[9px] text-[#3a5570]">{r.category}</span>}
                    </div>
                  </div>
                  <Icon name="ArrowRight" size={12} className="text-[#2a4060] flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t flex items-center gap-3" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
              <span className="font-mono text-[9px] text-[#2a4060]">Enter — перейти · Esc — закрыть</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

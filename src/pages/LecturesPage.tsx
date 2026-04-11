import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api, FileItem } from "@/api";
import { usePageData } from "@/hooks/usePageData";
import { useProgress } from "@/hooks/useProgress";

const DOC_CATEGORIES = ["Все", "Регламенты", "Технические", "Учебные", "Схемы", "Карты"];

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}


function DocModal({ file, onClose }: { file: FileItem; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const isPdf = file.mime_type === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(5,8,16,0.97)" }} onClick={onClose}>
      <div className="w-full sm:max-w-4xl flex flex-col" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 40px rgba(0,245,255,0.2)", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
          <span className="font-mono text-sm text-white truncate pr-2">{file.title}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={file.cdn_url} target="_blank" rel="noopener noreferrer" className="text-[#3a5570] hover:text-[#00f5ff] transition-colors">
              <Icon name="ExternalLink" size={16} />
            </a>
            <button onClick={onClose} className="text-[#3a5570] hover:text-[#00f5ff]">
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden" style={{ background: "#050810", minHeight: 0 }}>
          {isPdf ? (
            <iframe src={`${file.cdn_url}#toolbar=1`} className="w-full h-full" style={{ minHeight: "60vh", border: "none" }} title={file.title} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-4">
              <Icon name="FileText" size={48} className="text-[#3a5570]" />
              <div className="font-mono text-sm text-[#3a5570]">Предпросмотр недоступен</div>
              <a href={file.cdn_url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#00f5ff] flex items-center gap-1">
                <Icon name="Download" size={13} />Скачать файл
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type SortOption = "newest" | "oldest" | "title" | "size";

function useLocalSet(key: string) {
  const [set, setSet] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || "[]") as number[]); } catch { return new Set<number>(); }
  });
  const toggle = (id: number) => {
    setSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      localStorage.setItem(key, JSON.stringify([...next]));
      return next;
    });
  };
  return { set, toggle };
}

export default function LecturesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [viewing, setViewing] = useState<FileItem | null>(null);
  const { set: bookmarks, toggle: toggleBookmark } = useLocalSet("lecture_bookmarks");
  const { done: read, toggle: toggleRead } = useProgress("lecture");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [noteFile, setNoteFile] = useState<FileItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.files.list("document", undefined, "general").then((res) => {
      setFiles(res.files || []);
      setLoading(false);
    });
  }, []);

  const { header } = usePageData("lectures");
  const categories = header?.categories ?? DOC_CATEGORIES;

  const filtered = files
    .filter((f) => {
      const matchCat = activeCategory === "Все" || f.category === activeCategory;
      const matchSearch = f.title.toLowerCase().includes(search.toLowerCase()) || (f.description || "").toLowerCase().includes(search.toLowerCase());
      const matchBookmark = !showBookmarks || bookmarks.has(f.id);
      return matchCat && matchSearch && matchBookmark;
    })
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "ru");
      if (sort === "size") return b.file_size - a.file_size;
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {viewing && <DocModal file={viewing} onClose={() => setViewing(null)} />}

      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">{header?.subtitle ?? "// УЧЕБНЫЙ ЦЕНТР"}</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-5 sm:mb-6 tracking-wider">{header?.title ?? "ЛЕКЦИИ"}</h1>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input
            type="text"
            placeholder="ПОИСК..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a1020] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-mono text-sm pl-9 pr-4 py-2.5 outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060] tracking-widest"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-white">
              <Icon name="X" size={13} />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="bg-[#0a1020] border border-[rgba(0,245,255,0.15)] text-[#5a7a95] font-mono text-xs px-3 py-2.5 outline-none focus:border-[rgba(0,245,255,0.4)] sm:w-44"
        >
          <option value="newest">НОВЫЕ</option>
          <option value="oldest">СТАРЫЕ</option>
          <option value="title">А — Я</option>
          <option value="size">ПО РАЗМЕРУ</option>
        </select>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="font-mono text-xs px-4 py-2 tracking-wider transition-all"
            style={{
              border: `1px solid ${activeCategory === cat ? "#00f5ff" : "rgba(0,245,255,0.15)"}`,
              color: activeCategory === cat ? "#050810" : "#5a7a95",
              background: activeCategory === cat ? "#00f5ff" : "transparent",
              boxShadow: activeCategory === cat ? "0 0 15px rgba(0,245,255,0.4)" : "none",
            }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="font-mono text-xs text-[#3a5570]">НАЙДЕНО: {loading ? "..." : filtered.length}</div>
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 transition-all"
          style={{
            border: `1px solid ${showBookmarks ? "rgba(255,190,50,0.5)" : "rgba(0,245,255,0.15)"}`,
            color: showBookmarks ? "#ffbe32" : "#3a5570",
            background: showBookmarks ? "rgba(255,190,50,0.06)" : "transparent",
          }}
        >
          <Icon name="Bookmark" size={12} />
          {showBookmarks ? `ЗАКЛАДКИ (${bookmarks.size})` : "ЗАКЛАДКИ"}
        </button>
      </div>

      {/* Progress bar */}
      {files.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,245,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((read.size / files.length) * 100)}%`, background: "linear-gradient(90deg, #00f5ff, #00ff88)" }} />
          </div>
          <span className="font-mono text-[10px] text-[#3a5570] flex-shrink-0">{read.size}/{files.length} изучено</span>
        </div>
      )}

      {/* Note modal */}
      {noteFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setNoteFile(null)}>
          <div className="w-full max-w-md" style={{ border: "1px solid rgba(0,245,255,0.3)", background: "rgba(4,7,14,0.98)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
              <span className="font-mono text-xs text-[#00f5ff] tracking-wider">ЗАМЕТКА</span>
              <button onClick={() => setNoteFile(null)} className="text-[#3a5570] hover:text-white transition-colors"><Icon name="X" size={16} /></button>
            </div>
            <div className="p-4">
              <div className="font-mono text-[10px] text-[#3a5570] mb-2 truncate">{noteFile.title}</div>
              <textarea
                autoFocus
                className="w-full bg-transparent border font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
                style={{ borderColor: "rgba(0,245,255,0.2)" }}
                placeholder="Ваша заметка к этому материалу..."
                rows={5}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <button
                onClick={async () => { if (!noteText.trim()) return; setNoteSaving(true); await api.progress.noteSave("lecture", noteFile.id, noteText.trim()); setNoteSaving(false); setNoteFile(null); }}
                disabled={noteSaving || !noteText.trim()}
                className="mt-3 flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
                <Icon name="Save" size={13} />
                {noteSaving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-20 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ border: "1px solid #1a2a3a" }}>
          <Icon name="FileText" size={32} className="text-[#3a5570] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570]">Материалы не найдены</div>
          <div className="font-mono text-xs text-[#1a2a3a] mt-1">Инструктор ещё не добавил материалы</div>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filtered.map((file, i) => (
            <div
              key={file.id}
              onClick={() => setViewing(file)}
              className="card-drone flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer hover:border-[rgba(0,245,255,0.3)] transition-all animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s`, opacity: read.has(file.id) ? 0.65 : 1 }}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.04)" }}>
                <Icon name="FileText" size={18} className="text-[#00f5ff]" />
              </div>

              <div className="flex-1 min-w-0">
                {file.category && (
                  <div className="font-mono text-[10px] text-[#3a5570] mb-0.5">{file.category}</div>
                )}
                <div className="font-plex text-sm text-white truncate leading-snug">{file.title}</div>
                {file.description && (
                  <div className="font-mono text-xs text-[#3a5570] truncate mt-0.5 hidden sm:block">{file.description}</div>
                )}
                <div className="flex items-center gap-3 mt-0.5 sm:hidden text-[#3a5570]">
                  {file.file_size > 0 && <span className="font-mono text-[10px]">{formatSize(file.file_size)}</span>}
                </div>
              </div>

              <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-[#3a5570]">
                {file.uploader && <span className="font-mono text-xs">{file.uploader}</span>}
                {file.file_size > 0 && <span className="font-mono text-xs">{formatSize(file.file_size)}</span>}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(file.id); }}
                  title={bookmarks.has(file.id) ? "Убрать закладку" : "В закладки"}
                  className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[rgba(255,190,50,0.1)]"
                  style={{ color: bookmarks.has(file.id) ? "#ffbe32" : "#2a4060" }}
                >
                  <Icon name="Bookmark" size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setNoteFile(file); setNoteText(""); }}
                  title="Добавить заметку"
                  className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[rgba(0,245,255,0.1)]"
                  style={{ color: "#2a4060" }}
                >
                  <Icon name="PenLine" size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleRead(file.id); }}
                  title={read.has(file.id) ? "Снять отметку" : "Отметить изученным"}
                  className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[rgba(0,255,136,0.1)]"
                  style={{ color: read.has(file.id) ? "#00ff88" : "#2a4060" }}
                >
                  <Icon name="CheckCircle" size={14} />
                </button>
                <div className="w-9 h-9 flex items-center justify-center text-[#00f5ff] hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded-sm">
                  <Icon name="Eye" size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
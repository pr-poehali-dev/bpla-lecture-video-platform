import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api, FileItem } from "@/api";
import { usePageData } from "@/hooks/usePageData";

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

export default function LecturesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<FileItem | null>(null);

  useEffect(() => {
    setLoading(true);
    api.files.list("document", undefined, "general").then((res) => {
      setFiles(res.files || []);
      setLoading(false);
    });
  }, []);

  const { header } = usePageData("lectures");
  const categories = header?.categories ?? DOC_CATEGORIES;

  const filtered = files.filter((f) => {
    const matchCat = activeCategory === "Все" || f.category === activeCategory;
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {viewing && <DocModal file={viewing} onClose={() => setViewing(null)} />}

      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">{header?.subtitle ?? "// УЧЕБНЫЙ ЦЕНТР"}</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-5 sm:mb-6 tracking-wider">{header?.title ?? "ЛЕКЦИИ"}</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
        <input
          type="text"
          placeholder="ПОИСК..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0a1020] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-mono text-sm pl-9 pr-4 py-2.5 outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060] tracking-widest"
        />
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

      <div className="font-mono text-xs text-[#3a5570] mb-6">НАЙДЕНО: {loading ? "..." : filtered.length}</div>

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
        <div className="space-y-3">
          {filtered.map((file, i) => (
            <div
              key={file.id}
              onClick={() => setViewing(file)}
              className="card-drone flex items-center gap-4 p-4 cursor-pointer hover:border-[rgba(0,245,255,0.3)] transition-all animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.04)" }}>
                <Icon name="FileText" size={16} className="text-[#00f5ff]" />
              </div>

              <div className="flex-1 min-w-0">
                {file.category && (
                  <div className="font-mono text-[10px] text-[#3a5570] mb-1">{file.category}</div>
                )}
                <div className="font-plex text-sm text-white truncate">{file.title}</div>
                {file.description && (
                  <div className="font-mono text-xs text-[#3a5570] truncate mt-0.5">{file.description}</div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-[#3a5570]">
                {file.uploader && <span className="font-mono text-xs">{file.uploader}</span>}
                {file.file_size > 0 && <span className="font-mono text-xs">{formatSize(file.file_size)}</span>}
              </div>

              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#00f5ff] hover:bg-[rgba(0,245,255,0.1)] transition-colors">
                <Icon name="Eye" size={18} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { api, FileItem } from "@/api";
import Icon from "@/components/ui/icon";
import { usePageData } from "@/hooks/usePageData";
import { useProgress } from "@/hooks/useProgress";

const VIDEO_CATEGORIES = ["Все", "Боевые", "Учебные", "Технические", "Разбор миссий"];

function formatSize(bytes: number): string {
  if (!bytes) return "YouTube";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getYoutubeThumbnail(cdnUrl: string): string {
  const match = cdnUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : "";
}

function VideoPlayerModal({ file, onClose }: { file: FileItem; onClose: () => void }) {
  const isYoutube = file.mime_type === "youtube";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,8,16,0.95)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl"
        style={{ border: "1px solid #00f5ff", boxShadow: "0 0 40px rgba(0,245,255,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
          <span className="font-mono text-sm text-[#00f5ff] tracking-wider truncate">{file.title}</span>
          <button onClick={onClose} className="text-[#3a5570] hover:text-[#00f5ff] ml-4 flex-shrink-0">
            <Icon name="X" size={20} />
          </button>
        </div>
        <div style={{ background: "#000", position: "relative", paddingBottom: "56.25%", height: 0 }}>
          {isYoutube ? (
            <iframe
              src={`${file.cdn_url}?autoplay=1&rel=0`}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <video
              src={file.cdn_url}
              controls
              autoPlay
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            >
              Ваш браузер не поддерживает воспроизведение видео.
            </video>
          )}
        </div>
        {file.description && (
          <div className="px-4 py-3 font-mono text-xs text-[#3a5570]" style={{ background: "#0a1520" }}>
            {file.description}
          </div>
        )}
      </div>
    </div>
  );
}

type SortOption = "newest" | "oldest" | "title";

export default function VideosPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [playing, setPlaying] = useState<FileItem | null>(null);
  const { done: watched, toggle: toggleWatched } = useProgress("video");

  useEffect(() => {
    api.files.list("video", undefined, "general").then((res) => {
      setFiles(res.files || []);
      setLoading(false);
    });
  }, []);

  const { header } = usePageData("videos");
  const categories = header?.categories ?? VIDEO_CATEGORIES;

  const filtered = files
    .filter((f) => {
      const matchCat = activeCategory === "Все" || f.category === activeCategory;
      const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase()) || (f.description || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "ru");
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {playing && <VideoPlayerModal file={playing} onClose={() => setPlaying(null)} />}

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center" style={{ border: "1px solid #00f5ff" }}>
          <Icon name="Play" size={16} className="text-[#00f5ff]" />
        </div>
        <div>
          <h1 className="font-mono text-lg text-white tracking-wider">{header?.title ?? "ВИДЕОМАТЕРИАЛЫ"}</h1>
          <p className="font-mono text-xs text-[#3a5570]">{header?.subtitle ?? "УЧЕБНЫЕ И БОЕВЫЕ ЗАПИСИ"}</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-1">
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
          className="bg-[#0a1020] border border-[rgba(0,245,255,0.15)] text-[#5a7a95] font-mono text-xs px-3 py-2.5 outline-none focus:border-[rgba(0,245,255,0.4)] sm:w-40"
        >
          <option value="newest">НОВЫЕ</option>
          <option value="oldest">СТАРЫЕ</option>
          <option value="title">А — Я</option>
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="font-mono text-xs px-3 py-1.5 transition-all"
            style={{
              border: `1px solid ${activeCategory === cat ? "#00f5ff" : "#1a2a3a"}`,
              color: activeCategory === cat ? "#00f5ff" : "#3a5570",
              background: activeCategory === cat ? "rgba(0,245,255,0.05)" : "transparent",
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs text-[#3a5570]">НАЙДЕНО: {loading ? "..." : filtered.length}</div>
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,245,255,0.08)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((watched.size / files.length) * 100)}%`, background: "linear-gradient(90deg, #00f5ff, #00ff88)" }} />
            </div>
            <span className="font-mono text-[10px] text-[#3a5570]">{watched.size}/{files.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="font-mono text-xs text-[#3a5570] tracking-widest animate-pulse">ЗАГРУЗКА...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ border: "1px solid #1a2a3a" }}>
          <Icon name="VideoOff" size={32} className="text-[#3a5570] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570] tracking-widest">ВИДЕО НЕ НАЙДЕНЫ</div>
          <div className="font-mono text-xs text-[#1a2a3a] mt-1">Администратор ещё не добавил видео</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="group cursor-pointer transition-all"
              style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}
              onClick={() => setPlaying(file)}
            >
              <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{ aspectRatio: "16/9", background: "#050810" }}
              >
                {file.mime_type === "youtube" && getYoutubeThumbnail(file.cdn_url) && (
                  <img
                    src={getYoutubeThumbnail(file.cdn_url)}
                    alt={file.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                  />
                )}
                <div
                  className="relative z-10 w-14 h-14 flex items-center justify-center transition-all group-hover:scale-110"
                  style={{
                    border: `1px solid ${file.mime_type === "youtube" ? "#ff2244" : "#00f5ff"}`,
                    boxShadow: `0 0 20px ${file.mime_type === "youtube" ? "rgba(255,34,68,0.4)" : "rgba(0,245,255,0.2)"}`,
                    background: file.mime_type === "youtube" ? "rgba(255,0,0,0.7)" : "rgba(0,0,0,0.5)",
                  }}
                >
                  <Icon name="Play" size={24} className="text-white ml-1" />
                </div>
                {file.mime_type === "youtube" && (
                  <span className="absolute bottom-2 right-2 font-mono text-xs px-1.5 py-0.5 z-10" style={{ background: "rgba(255,34,68,0.85)", color: "#fff" }}>
                    YouTube
                  </span>
                )}
                {file.category && (
                  <span
                    className="absolute top-2 left-2 font-mono text-xs px-2 py-0.5 z-10"
                    style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}
                  >
                    {file.category}
                  </span>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <div className="font-plex text-sm text-white mb-1 truncate">{file.title}</div>
                {file.description && (
                  <div className="font-mono text-xs text-[#3a5570] mb-2 line-clamp-2">{file.description}</div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#1a2a3a]">{formatSize(file.file_size)}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-[#3a5570] truncate">{file.uploader}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWatched(file.id); }}
                      title={watched.has(file.id) ? "Снять отметку" : "Отметить просмотренным"}
                      className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-[rgba(0,255,136,0.1)] ml-1"
                      style={{ color: watched.has(file.id) ? "#00ff88" : "#2a4060" }}
                    >
                      <Icon name="CheckCircle" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
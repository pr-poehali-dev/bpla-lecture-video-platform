import { useState, useEffect } from "react";
import { api, FileItem } from "@/api";
import Icon from "@/components/ui/icon";

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

export default function VideosPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [playing, setPlaying] = useState<FileItem | null>(null);

  useEffect(() => {
    api.files.list("video").then((res) => {
      setFiles(res.files || []);
      setLoading(false);
    });
  }, []);

  const filtered = activeCategory === "Все"
    ? files
    : files.filter((f) => f.category === activeCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      {playing && <VideoPlayerModal file={playing} onClose={() => setPlaying(null)} />}

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center" style={{ border: "1px solid #00f5ff" }}>
          <Icon name="Play" size={16} className="text-[#00f5ff]" />
        </div>
        <div>
          <h1 className="font-mono text-lg text-white tracking-wider">ВИДЕОМАТЕРИАЛЫ</h1>
          <p className="font-mono text-xs text-[#3a5570]">УЧЕБНЫЕ И БОЕВЫЕ ЗАПИСИ</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {VIDEO_CATEGORIES.map((cat) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="p-3">
                <div className="font-mono text-sm text-white mb-1 truncate">{file.title}</div>
                {file.description && (
                  <div className="font-mono text-xs text-[#3a5570] mb-2 line-clamp-2">{file.description}</div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#1a2a3a]">{formatSize(file.file_size)}</span>
                  <span className="font-mono text-xs text-[#3a5570]">{file.uploader}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { FileItem } from "@/api";
import Icon from "@/components/ui/icon";
import { MIME_LABELS, formatSize } from "./TacmedDocViewer";

interface Props {
  files: FileItem[];
  loading: boolean;
  activeCategory: string;
  categories: string[];
  canDownload: boolean;
  onCategoryChange: (cat: string) => void;
  onView: (file: FileItem) => void;
}

export default function TacmedFileList({
  files, loading, activeCategory, categories, canDownload,
  onCategoryChange, onView,
}: Props) {
  const filtered = activeCategory === "Все"
    ? files
    : files.filter((f) => f.category === activeCategory);

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 bg-[#3a5570]" />
        <h2 className="font-orbitron text-lg font-bold text-white tracking-wider">МАТЕРИАЛЫ И ДОКУМЕНТЫ</h2>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className="font-mono text-xs px-3 py-1.5 transition-all"
            style={{
              border: `1px solid ${activeCategory === cat ? "#00ff88" : "#1a2a3a"}`,
              color: activeCategory === cat ? "#00ff88" : "#3a5570",
              background: activeCategory === cat ? "rgba(0,255,136,0.05)" : "transparent",
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
          <Icon name="HeartPulse" size={32} className="text-[#3a5570] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570] tracking-widest">МАТЕРИАЛЫ НЕ НАЙДЕНЫ</div>
          <div className="font-mono text-xs text-[#1a2a3a] mt-1">Администратор ещё не добавил материалы по тактической медицине</div>
        </div>
      ) : (
        <div style={{ border: "1px solid #1a2a3a" }}>
          <div className="hidden md:grid font-mono text-xs text-[#3a5570] px-4 py-2"
            style={{ gridTemplateColumns: "auto 1fr auto auto auto", gap: "1rem", borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
            <span>#</span><span>НАЗВАНИЕ</span><span>КАТЕГОРИЯ</span><span>РАЗМЕР</span><span>ДЕЙСТВИЯ</span>
          </div>
          {filtered.map((file, i) => {
            const meta = MIME_LABELS[file.mime_type] || { label: "FILE", color: "#3a5570" };
            return (
              <div
                key={file.id}
                className="flex md:grid items-center gap-3 px-4 py-3 transition-all cursor-pointer group flex-wrap"
                style={{
                  gridTemplateColumns: "auto 1fr auto auto auto",
                  gap: "1rem",
                  borderBottom: "1px solid #0d1a27",
                  background: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,255,136,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => onView(file)}
              >
                <span className="font-mono text-xs text-[#1a2a3a] w-6 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>

                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                    style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}40`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs text-white truncate group-hover:text-[#00ff88] transition-colors">
                    {file.title}
                  </span>
                </div>

                <span className="font-mono text-xs text-[#3a5570] hidden md:block flex-shrink-0">
                  {file.category || "—"}
                </span>
                <span className="font-mono text-xs text-[#3a5570] hidden md:block flex-shrink-0">
                  {formatSize(file.size)}
                </span>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(file); }}
                    className="font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex items-center gap-1"
                  >
                    <Icon name="Eye" size={13} />
                    <span className="hidden md:inline">Открыть</span>
                  </button>
                  {canDownload && (
                    <a
                      href={file.cdn_url}
                      download={file.original_name}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex items-center gap-1"
                    >
                      <Icon name="Download" size={13} />
                      <span className="hidden md:inline">Скачать</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

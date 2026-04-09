import { useState, useEffect } from "react";
import { api, FileItem } from "@/api";
import Icon from "@/components/ui/icon";
import { type User } from "@/App";
import { usePageData } from "@/hooks/usePageData";

const DOC_CATEGORIES = ["Все", "Регламенты", "Технические", "Учебные", "Схемы", "Карты"];

const MIME_LABELS: Record<string, { label: string; color: string }> = {
  "application/pdf": { label: "PDF", color: "#ff6b00" },
  "text/plain": { label: "TXT", color: "#00ff88" },
  "application/msword": { label: "DOC", color: "#2b7fff" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOCX", color: "#2b7fff" },
  "application/vnd.ms-powerpoint": { label: "PPT", color: "#ff6b00" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { label: "PPTX", color: "#ff6b00" },
};

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function DocViewerModal({ file, onClose, canDownload }: { file: FileItem; onClose: () => void; canDownload: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isPdf = file.mime_type === "application/pdf";
  const isTxt = file.mime_type === "text/plain";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,8,16,0.95)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-5xl flex flex-col"
        style={{ border: "1px solid #00f5ff", boxShadow: "0 0 40px rgba(0,245,255,0.2)", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="font-mono text-xs px-2 py-0.5 flex-shrink-0"
              style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}
            >
              {MIME_LABELS[file.mime_type]?.label || "DOC"}
            </span>
            <span className="font-mono text-sm text-white truncate">{file.title}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {canDownload && (
              <a
                href={file.cdn_url}
                download={file.original_name}
                className="font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors flex items-center gap-1"
              >
                <Icon name="Download" size={14} />
                Скачать
              </a>
            )}
            <button onClick={onClose} className="text-[#3a5570] hover:text-[#00f5ff]">
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden" style={{ background: "#050810", minHeight: 0 }}>
          {isPdf ? (
            <iframe
              src={`${file.cdn_url}#toolbar=1`}
              className="w-full h-full"
              style={{ minHeight: "70vh", border: "none" }}
              title={file.title}
            />
          ) : isTxt ? (
            <TxtViewer url={file.cdn_url} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <Icon name="FileText" size={48} className="text-[#3a5570]" />
              <div className="font-mono text-sm text-[#3a5570] text-center">
                Формат {MIME_LABELS[file.mime_type]?.label || "документа"} не поддерживает предпросмотр
              </div>
              {canDownload ? (
                <a
                  href={file.cdn_url}
                  download={file.original_name}
                  className="font-mono text-xs px-4 py-2 transition-all"
                  style={{ border: "1px solid #00f5ff", color: "#00f5ff", background: "rgba(0,245,255,0.05)" }}
                >
                  СКАЧАТЬ ФАЙЛ
                </a>
              ) : (
                <div className="font-mono text-xs text-[#3a5570]">Скачивание недоступно для курсантов</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TxtViewer({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    fetch(url).then((r) => r.text()).then(setText).catch(() => setText("Не удалось загрузить файл"));
  }, [url]);

  if (text === null) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ minHeight: "60vh" }}>
      <pre className="font-mono text-xs text-[#8899aa] whitespace-pre-wrap leading-relaxed">{text}</pre>
    </div>
  );
}

interface Props {
  user: User | null;
}

export default function MaterialsPage({ user }: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [viewing, setViewing] = useState<FileItem | null>(null);

  const canDownload = !user || user.is_admin || user.role !== "курсант";

  useEffect(() => {
    api.files.list("document").then((res) => {
      setFiles(res.files || []);
      setLoading(false);
    });
  }, []);

  const { header } = usePageData("materials");
  const categories = header?.categories ?? DOC_CATEGORIES;

  const filtered = activeCategory === "Все"
    ? files
    : files.filter((f) => f.category === activeCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      {viewing && <DocViewerModal file={viewing} onClose={() => setViewing(null)} canDownload={canDownload} />}

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center" style={{ border: "1px solid #ff6b00" }}>
          <Icon name="FileText" size={16} className="text-[#ff6b00]" />
        </div>
        <div>
          <h1 className="font-mono text-lg text-white tracking-wider">{header?.title ?? "МАТЕРИАЛЫ"}</h1>
          <p className="font-mono text-xs text-[#3a5570]">{header?.subtitle ?? "ДОКУМЕНТЫ И РЕГЛАМЕНТЫ"}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="font-mono text-xs px-3 py-1.5 transition-all"
            style={{
              border: `1px solid ${activeCategory === cat ? "#ff6b00" : "#1a2a3a"}`,
              color: activeCategory === cat ? "#ff6b00" : "#3a5570",
              background: activeCategory === cat ? "rgba(255,107,0,0.05)" : "transparent",
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
          <Icon name="FolderOpen" size={32} className="text-[#3a5570] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570] tracking-widest">ДОКУМЕНТЫ НЕ НАЙДЕНЫ</div>
          <div className="font-mono text-xs text-[#1a2a3a] mt-1">Администратор ещё не добавил документы</div>
        </div>
      ) : (
        <div style={{ border: "1px solid #1a2a3a" }}>
          <div className="hidden md:grid font-mono text-xs text-[#3a5570] px-4 py-2" style={{ gridTemplateColumns: "auto 1fr auto auto auto", gap: "1rem", borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
            <span>#</span>
            <span>НАЗВАНИЕ</span>
            <span>КАТЕГОРИЯ</span>
            <span>РАЗМЕР</span>
            <span>ДЕЙСТВИЯ</span>
          </div>
          {filtered.map((file, i) => {
            const meta = MIME_LABELS[file.mime_type] || { label: "FILE", color: "#3a5570" };
            return (
              <div
                key={file.id}
                className="grid items-center px-4 py-3 transition-colors hover:bg-[#0a1520] cursor-pointer"
                style={{
                  gridTemplateColumns: "auto 1fr",
                  gap: "0.75rem",
                  borderBottom: i < filtered.length - 1 ? "1px solid #0d1a28" : "none",
                }}
                onClick={() => setViewing(file)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-[#1a2a3a] w-6 flex-shrink-0">{i + 1}</span>
                  <span
                    className="font-mono text-xs px-1.5 py-0.5 flex-shrink-0"
                    style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}66`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-white truncate">{file.title}</div>
                    {file.description && <div className="font-mono text-xs text-[#3a5570] truncate">{file.description}</div>}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4">
                  {file.category && (
                    <span className="font-mono text-xs text-[#3a5570] hidden md:block">{file.category}</span>
                  )}
                  <span className="font-mono text-xs text-[#1a2a3a]">{formatSize(file.file_size)}</span>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewing(file)}
                      className="font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors"
                      title="Открыть"
                    >
                      <Icon name="Eye" size={16} />
                    </button>
                    {canDownload && (
                      <a
                        href={file.cdn_url}
                        download={file.original_name}
                        className="font-mono text-xs text-[#3a5570] hover:text-[#ff6b00] transition-colors"
                        title="Скачать"
                      >
                        <Icon name="Download" size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
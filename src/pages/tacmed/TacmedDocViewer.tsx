import { useState, useEffect } from "react";
import { FileItem } from "@/api";
import Icon from "@/components/ui/icon";

export const MIME_LABELS: Record<string, { label: string; color: string }> = {
  "application/pdf": { label: "PDF", color: "#ff6b00" },
  "text/plain": { label: "TXT", color: "#00ff88" },
  "application/msword": { label: "DOC", color: "#2b7fff" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOCX", color: "#2b7fff" },
  "application/vnd.ms-powerpoint": { label: "PPT", color: "#ff6b00" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { label: "PPTX", color: "#ff6b00" },
};

export function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
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
  file: FileItem;
  onClose: () => void;
  canDownload: boolean;
}

export default function TacmedDocViewer({ file, onClose, canDownload }: Props) {
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
        style={{ border: "1px solid #00ff88", boxShadow: "0 0 40px rgba(0,255,136,0.15)", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="font-mono text-xs px-2 py-0.5 flex-shrink-0"
              style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88" }}
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
                className="font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex items-center gap-1"
              >
                <Icon name="Download" size={14} />
                Скачать
              </a>
            )}
            <button onClick={onClose} className="text-[#3a5570] hover:text-[#00ff88]">
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
                  style={{ border: "1px solid #00ff88", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}
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

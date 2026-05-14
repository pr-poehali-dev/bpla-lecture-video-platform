import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Doc, Folder, MIME_ICON } from "./DocTypes";

interface Props {
  docs: Doc[];
  folders: Folder[];
  initialDoc?: Doc;
  onClose: () => void;
}

type MediaType = "document" | "image" | "video" | "pdf" | "iframe" | "unknown";

function getMediaType(doc: Doc): MediaType {
  if (doc.doc_type === "document") return "document";
  const mime = doc.file_mime || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("presentation") || mime.includes("powerpoint") || mime.includes("word")) return "iframe";
  return "unknown";
}

function getViewerUrl(doc: Doc): string | null {
  const mime = doc.file_mime || "";
  if (mime === "application/pdf") return `${doc.file_url}#toolbar=0&navpanes=0`;
  if (mime.includes("word") || mime.includes("presentation") || mime.includes("powerpoint")) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(doc.file_url || "")}&embedded=true`;
  }
  return null;
}

export default function LiveLectureView({ docs, folders, initialDoc, onClose }: Props) {
  const [currentDoc, setCurrentDoc] = useState<Doc | null>(initialDoc || null);
  const [sidebarOpen, setSidebarOpen] = useState(!initialDoc);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [imgLoading, setImgLoading] = useState(false);
  const [folderOpen, setFolderOpen] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (fullscreen) exitFullscreen(); else onClose(); }
      if (e.key === "F11") { e.preventDefault(); toggleFullscreen(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); handlePrint(); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [fullscreen, currentDoc]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    document.exitFullscreen?.();
    setFullscreen(false);
  };

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const handlePrint = useCallback(() => {
    if (!currentDoc) return;
    if (currentDoc.doc_type === "document") {
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`
        <!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>${currentDoc.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 20mm; color: #000; }
          h1,h2,h3 { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #333; padding: 4px 8px; }
          @media print { body { margin: 10mm; } }
        </style>
        </head><body>
        <h1 style="text-align:center">${currentDoc.title}</h1>
        ${currentDoc.subject ? `<p style="text-align:center;color:#666">${currentDoc.subject}${currentDoc.group_name ? ` · Группа: ${currentDoc.group_name}` : ""}</p>` : ""}
        <hr>
        ${currentDoc.content_html || ""}
        </body></html>
      `);
      win.document.close();
      win.focus();
      win.print();
    } else if (currentDoc.file_url) {
      window.open(currentDoc.file_url, "_blank");
    }
  }, [currentDoc]);

  // Навигация по документам (стрелки)
  const flatDocs = docs.filter(d => d.doc_type !== undefined);
  const currentIdx = currentDoc ? flatDocs.findIndex(d => d.id === currentDoc.id) : -1;
  const prevDoc = currentIdx > 0 ? flatDocs[currentIdx - 1] : null;
  const nextDoc = currentIdx < flatDocs.length - 1 ? flatDocs[currentIdx + 1] : null;

  const mediaType = currentDoc ? getMediaType(currentDoc) : null;
  const viewerUrl = currentDoc ? getViewerUrl(currentDoc) : null;

  // Группировка доков по папкам для сайдбара
  const rootDocs = docs.filter(d => !d.folder_id);
  const getFolderDocs = (fid: number) => docs.filter(d => d.folder_id === fid);
  const rootFolders = folders.filter(f => !f.parent_id);

  const DocItem = ({ doc }: { doc: Doc }) => {
    const isActive = currentDoc?.id === doc.id;
    const mime = doc.file_mime || "";
    const mimeMeta = MIME_ICON[mime];
    const mtype = getMediaType(doc);
    const typeIcon = mtype === "image" ? "Image" : mtype === "video" ? "PlayCircle" : mtype === "pdf" ? "FileText" : mtype === "document" ? "FileText" : "File";
    const typeColor = mtype === "image" ? "#00ff88" : mtype === "video" ? "#ff6b00" : mtype === "pdf" ? "#ff6b00" : mtype === "document" ? "#00ff88" : "#5a7a95";
    return (
      <button
        onClick={() => { setCurrentDoc(doc); if (window.innerWidth < 768) setSidebarOpen(false); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all group"
        style={{
          background: isActive ? "rgba(0,255,136,0.08)" : "transparent",
          borderLeft: isActive ? "2px solid #00ff88" : "2px solid transparent",
        }}
      >
        {mimeMeta ? (
          <span className="font-mono text-[9px] font-bold flex-shrink-0 w-8 text-center py-0.5" style={{ background: `${mimeMeta.color}15`, color: mimeMeta.color, border: `1px solid ${mimeMeta.color}30` }}>{mimeMeta.label}</span>
        ) : (
          <Icon name={typeIcon as "File"} size={13} style={{ color: typeColor, flexShrink: 0 }} />
        )}
        <span className={`font-plex text-xs truncate ${isActive ? "text-white" : "text-[#5a7a95] group-hover:text-white"} transition-colors`}>{doc.title}</span>
      </button>
    );
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col" style={{ background: "#02050f" }}>

      {/* ── Топбар ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(0,255,136,0.12)", background: "#040c1a" }}>

        <button onClick={onClose} className="flex items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex-shrink-0">
          <Icon name="ChevronLeft" size={14} /> Выйти
        </button>

        <div className="w-px h-4 bg-[rgba(0,245,255,0.12)]" />

        {/* Кнопка сайдбара */}
        <button onClick={() => setSidebarOpen(v => !v)}
          className="flex items-center gap-1.5 font-mono text-[10px] px-2 py-1 transition-all"
          style={{ border: `1px solid ${sidebarOpen ? "rgba(0,245,255,0.3)" : "rgba(0,245,255,0.1)"}`, color: sidebarOpen ? "#00f5ff" : "#3a5570" }}>
          <Icon name="PanelLeft" size={12} /> Материалы
        </button>

        {/* Название */}
        <div className="flex-1 min-w-0 text-center">
          {currentDoc ? (
            <div className="font-orbitron text-sm font-bold text-white tracking-wider truncate px-4">{currentDoc.title}</div>
          ) : (
            <div className="font-mono text-xs text-[#3a5570]">Выберите материал из списка</div>
          )}
        </div>

        {/* Зум (для документов и изображений) */}
        {currentDoc && (mediaType === "document" || mediaType === "image") && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-white transition-colors"
              style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
              <Icon name="Minus" size={11} />
            </button>
            <span className="font-mono text-[10px] text-[#3a5570] w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))}
              className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-white transition-colors"
              style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
              <Icon name="Plus" size={11} />
            </button>
          </div>
        )}

        {/* Действия */}
        {currentDoc && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handlePrint}
              className="flex items-center gap-1 font-mono text-xs px-2.5 py-1.5 transition-all"
              style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
              <Icon name="Printer" size={12} /> Печать
            </button>
            {currentDoc.file_url && (
              <a href={currentDoc.file_url} download={currentDoc.file_original_name || currentDoc.title}
                className="flex items-center gap-1 font-mono text-xs px-2.5 py-1.5 transition-all"
                style={{ border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}>
                <Icon name="Download" size={12} />
              </a>
            )}
          </div>
        )}

        <button onClick={toggleFullscreen} title={fullscreen ? "Выйти из полного экрана (F11)" : "Полный экран (F11)"}
          className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-white transition-colors flex-shrink-0"
          style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
          <Icon name={fullscreen ? "Minimize2" : "Maximize2"} size={14} />
        </button>
      </div>

      {/* ── Основная область ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Сайдбар с материалами */}
        {sidebarOpen && (
          <div className="w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto"
            style={{ borderColor: "rgba(0,245,255,0.08)", background: "#040c1a" }}>

            <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}>
              <div className="font-mono text-[10px] text-[#3a5570] tracking-[0.2em]">// МАТЕРИАЛЫ ЛЕКЦИИ</div>
            </div>

            <div className="flex-1 py-1">
              {/* Корневые документы */}
              {rootDocs.map(doc => <DocItem key={doc.id} doc={doc} />)}

              {/* Папки */}
              {rootFolders.map(folder => {
                const fDocs = getFolderDocs(folder.id);
                const isOpen = folderOpen[folder.id] !== false;
                return (
                  <div key={folder.id}>
                    <button
                      onClick={() => setFolderOpen(p => ({ ...p, [folder.id]: !isOpen }))}
                      className="w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[rgba(0,245,255,0.03)]">
                      <Icon name={isOpen ? "FolderOpen" : "Folder"} size={13} style={{ color: folder.color, flexShrink: 0 }} />
                      <span className="font-plex text-xs text-[#7a9bb5] flex-1 truncate">{folder.name}</span>
                      <span className="font-mono text-[9px] text-[#3a5570]">{fDocs.length}</span>
                      <Icon name={isOpen ? "ChevronDown" : "ChevronRight"} size={11} className="text-[#3a5570]" />
                    </button>
                    {isOpen && fDocs.map(doc => (
                      <div key={doc.id} className="pl-4">
                        <DocItem doc={doc} />
                      </div>
                    ))}
                  </div>
                );
              })}

              {docs.length === 0 && (
                <div className="text-center py-8 font-mono text-xs text-[#3a5570]">Нет материалов</div>
              )}
            </div>
          </div>
        )}

        {/* Контентная область */}
        <div className="flex-1 flex flex-col min-w-0 relative">

          {/* Навигация стрелками */}
          {currentDoc && (prevDoc || nextDoc) && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none z-10 px-2">
              {prevDoc ? (
                <button onClick={() => setCurrentDoc(prevDoc)}
                  className="pointer-events-auto w-10 h-10 flex items-center justify-center transition-all"
                  style={{ background: "rgba(4,12,26,0.85)", border: "1px solid rgba(0,245,255,0.15)", color: "#5a7a95" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#00f5ff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#5a7a95"; }}>
                  <Icon name="ChevronLeft" size={18} />
                </button>
              ) : <div />}
              {nextDoc ? (
                <button onClick={() => setCurrentDoc(nextDoc)}
                  className="pointer-events-auto w-10 h-10 flex items-center justify-center transition-all"
                  style={{ background: "rgba(4,12,26,0.85)", border: "1px solid rgba(0,245,255,0.15)", color: "#5a7a95" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#00f5ff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#5a7a95"; }}>
                  <Icon name="ChevronRight" size={18} />
                </button>
              ) : <div />}
            </div>
          )}

          {!currentDoc ? (
            /* Заглушка */
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="w-24 h-24 flex items-center justify-center" style={{ border: "1px solid rgba(0,255,136,0.15)", background: "rgba(0,255,136,0.03)" }}>
                <Icon name="Monitor" size={40} className="text-[#1a3050]" />
              </div>
              <div className="text-center">
                <div className="font-mono text-[10px] text-[#00ff88] tracking-[0.3em] mb-2">// РЕЖИМ ЛЕКЦИИ</div>
                <div className="font-orbitron text-lg font-bold text-white mb-1">Выберите материал</div>
                <div className="font-plex text-sm text-[#3a5570]">Откройте панель слева и выберите документ, изображение или видео</div>
              </div>
              <div className="flex gap-6 font-mono text-[10px] text-[#2a4060]">
                <span>F11 — полный экран</span>
                <span>Ctrl+P — печать</span>
                <span>← → — переключение</span>
              </div>
            </div>
          ) : mediaType === "document" ? (
            /* HTML-документ */
            <div className="flex-1 overflow-auto" style={{ background: "#02050f" }}>
              <div
                className="mx-auto p-8 sm:p-12"
                style={{
                  maxWidth: `${Math.round(900 * zoom / 100)}px`,
                  width: "100%",
                  transform: zoom !== 100 ? undefined : undefined,
                }}
              >
                <div className="mb-6 pb-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
                  <div className="font-orbitron text-2xl font-black text-white mb-2">{currentDoc.title}</div>
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-[#3a5570]">
                    {currentDoc.subject && <span>Предмет: <span className="text-[#5a7a95]">{currentDoc.subject}</span></span>}
                    {currentDoc.group_name && <span>Группа: <span className="text-[#5a7a95]">{currentDoc.group_name}</span></span>}
                    {currentDoc.category && <span className="px-2 py-0.5" style={{ border: "1px solid rgba(0,245,255,0.15)", color: "#00f5ff" }}>{currentDoc.category}</span>}
                  </div>
                </div>
                <div
                  className="prose-lecture"
                  style={{ fontSize: `${Math.round(16 * zoom / 100)}px` }}
                  dangerouslySetInnerHTML={{ __html: currentDoc.content_html || "<p style='color:#3a5570'>Документ пуст</p>" }}
                />
              </div>
            </div>
          ) : mediaType === "image" ? (
            /* Изображение */
            <div className="flex-1 flex items-center justify-center overflow-auto p-4" style={{ background: "#010308" }}>
              {imgLoading && <div className="absolute font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>}
              <img
                src={currentDoc.file_url || ""}
                alt={currentDoc.title}
                onLoad={() => setImgLoading(false)}
                onLoadStart={() => setImgLoading(true)}
                style={{
                  maxWidth: `${zoom}%`,
                  maxHeight: "100%",
                  objectFit: "contain",
                  cursor: zoom < 200 ? "zoom-in" : "zoom-out",
                  transition: "max-width 0.2s",
                }}
                onClick={() => setZoom(z => z < 150 ? z + 25 : 100)}
              />
            </div>
          ) : mediaType === "video" ? (
            /* Видео */
            <div className="flex-1 flex items-center justify-center" style={{ background: "#000" }}>
              <video
                src={currentDoc.file_url || ""}
                controls
                autoPlay={false}
                style={{ maxWidth: "100%", maxHeight: "100%", outline: "none" }}
              />
            </div>
          ) : mediaType === "pdf" || mediaType === "iframe" ? (
            /* PDF / Google Docs viewer */
            <div className="flex-1 flex flex-col">
              {viewerUrl ? (
                <iframe
                  src={viewerUrl}
                  className="flex-1 w-full"
                  style={{ border: "none", minHeight: 0 }}
                  title={currentDoc.title}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <Icon name="FileDown" size={48} className="text-[#3a5570]" />
                  <div className="font-mono text-sm text-[#3a5570]">Предпросмотр недоступен</div>
                  <a href={currentDoc.file_url || ""} download
                    className="font-mono text-xs px-5 py-2" style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>
                    СКАЧАТЬ ФАЙЛ
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Неизвестный формат */
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Icon name="File" size={48} className="text-[#3a5570]" />
              <div className="font-mono text-sm text-white">{currentDoc.title}</div>
              <div className="font-mono text-xs text-[#3a5570]">{currentDoc.file_mime}</div>
              <a href={currentDoc.file_url || ""} download={currentDoc.file_original_name || currentDoc.title}
                className="flex items-center gap-2 font-mono text-xs px-5 py-2"
                style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>
                <Icon name="Download" size={13} /> СКАЧАТЬ ФАЙЛ
              </a>
            </div>
          )}

          {/* Нижняя панель — индикатор позиции */}
          {currentDoc && flatDocs.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(0,245,255,0.06)", background: "#040c1a" }}>
              {flatDocs.map((d, i) => (
                <button key={d.id} onClick={() => setCurrentDoc(d)}
                  className="transition-all"
                  style={{
                    width: d.id === currentDoc.id ? 20 : 6,
                    height: 4,
                    background: d.id === currentDoc.id ? "#00ff88" : "rgba(0,245,255,0.2)",
                    borderRadius: 2,
                  }}
                  title={d.title}
                />
              ))}
              <span className="font-mono text-[10px] text-[#3a5570] ml-3">{currentIdx + 1} / {flatDocs.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

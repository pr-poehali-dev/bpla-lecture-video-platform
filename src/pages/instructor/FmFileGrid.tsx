import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Doc, Folder, fmtDate, fmtSize, MIME_ICON } from "./DocTypes";
import DocShareModal from "./DocShareModal";

type ViewMode = "grid" | "list";

interface Props {
  subfolders: Folder[];
  currentDocs: Doc[];
  folders: Folder[];
  docs: Doc[];
  loading: boolean;
  viewMode: ViewMode;
  currentFolderId: number | null;
  dragOver: number | "root" | null;
  isOwn: (item: { owner_name?: string; owner_callsign?: string; instructor_name?: string; instructor_callsign?: string }) => boolean;
  onOpenFolder: (id: number) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onOpenDoc: (doc: Doc) => void;
  onDeleteDoc: (doc: Doc) => void;
  onDragOver: (id: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, folderId: number | null) => void;
  onDragStart: (e: React.DragEvent, docId: number) => void;
}

export default function FmFileGrid({
  subfolders, currentDocs, folders, docs, loading, viewMode,
  currentFolderId, dragOver, isOwn,
  onOpenFolder, onEditFolder, onDeleteFolder,
  onOpenDoc, onDeleteDoc,
  onDragOver, onDragLeave, onDrop, onDragStart,
}: Props) {
  const [sharingDoc, setSharingDoc] = useState<Doc | null>(null);

  if (loading) {
    return <div className="text-center py-16 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>;
  }

  return (
    <>
    <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" : "space-y-1"}>

      {/* Папки */}
      {subfolders.map(folder => (
        <div key={folder.id}
          className={`group transition-all cursor-pointer ${viewMode === "grid" ? "flex flex-col items-center p-4 text-center" : "flex items-center gap-3 px-4 py-2.5"}`}
          style={{
            background: dragOver === folder.id ? `${folder.color}15` : "rgba(13,27,46,0.5)",
            border: `1px solid ${dragOver === folder.id ? folder.color + "60" : folder.color + "25"}`,
          }}
          onClick={() => onOpenFolder(folder.id)}
          onDragOver={e => { e.preventDefault(); onDragOver(folder.id); }}
          onDragLeave={onDragLeave}
          onDrop={e => onDrop(e, folder.id)}>

          <Icon name="Folder" size={viewMode === "grid" ? 32 : 18} style={{ color: folder.color, flexShrink: 0 }} />

          <div className={`${viewMode === "grid" ? "mt-2 w-full" : "flex-1 min-w-0 ml-1"}`}>
            <div className="font-plex text-sm text-white truncate group-hover:text-[#00f5ff] transition-colors"
              style={{ color: folder.color + "cc" }}>
              {folder.name}
            </div>
            {viewMode === "list" && (
              <div className="font-mono text-[10px] text-[#3a5570]">
                {folders.filter(f => f.parent_id === folder.id).length} папок · {docs.filter(d => d.folder_id === folder.id).length} файлов
                {!isOwn(folder) && <span className="ml-2 text-[#a855f7]">{folder.owner_callsign || folder.owner_name}</span>}
              </div>
            )}
          </div>

          {isOwn(folder) && (
            <div className={`flex items-center gap-1 ${viewMode === "grid" ? "mt-2" : "flex-shrink-0"}`}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => onEditFolder(folder)} title="Переименовать"
                className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                <Icon name="Pencil" size={12} />
              </button>
              <button onClick={() => onDeleteFolder(folder)} title="Удалить"
                className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
                <Icon name="Trash2" size={12} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Документы */}
      {currentDocs.map(doc => {
        const isFile = doc.doc_type === "file";
        const mimeMeta = isFile ? (MIME_ICON[doc.file_mime || ""] || { icon: "File", color: "#5a7a95", label: "FILE" }) : null;

        return (
          <div key={doc.id}
            draggable={isOwn(doc)}
            onDragStart={e => onDragStart(e, doc.id)}
            className={`group transition-all cursor-pointer ${viewMode === "grid" ? "flex flex-col items-center p-4 text-center" : "flex items-center gap-3 px-4 py-2.5"}`}
            style={{ background: "rgba(13,27,46,0.4)", border: "1px solid rgba(0,245,255,0.08)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.08)"; }}
            onClick={() => onOpenDoc(doc)}>

            {/* Иконка */}
            {isFile && mimeMeta ? (
              <div className={`flex items-center justify-center flex-shrink-0 ${viewMode === "grid" ? "w-12 h-12" : "w-8 h-8"}`}
                style={{ background: `${mimeMeta.color}12`, border: `1px solid ${mimeMeta.color}30` }}>
                <span className="font-mono font-bold" style={{ fontSize: viewMode === "grid" ? 11 : 9, color: mimeMeta.color }}>{mimeMeta.label}</span>
              </div>
            ) : (
              <div className={`flex items-center justify-center flex-shrink-0 ${viewMode === "grid" ? "w-12 h-12" : "w-8 h-8"}`}
                style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)" }}>
                <Icon name="FileText" size={viewMode === "grid" ? 20 : 14} className="text-[#00ff88]" />
              </div>
            )}

            <div className={`${viewMode === "grid" ? "mt-2 w-full" : "flex-1 min-w-0 ml-1"}`}>
              <div className="font-plex text-sm text-white truncate group-hover:text-[#00ff88] transition-colors">{doc.title}</div>
              {viewMode === "list" && (
                <div className="font-mono text-[10px] text-[#3a5570] flex flex-wrap gap-x-3">
                  <span>{doc.category}</span>
                  {doc.file_original_name && <span>{doc.file_original_name}</span>}
                  {doc.file_size ? <span>{fmtSize(doc.file_size)}</span> : null}
                  <span>{fmtDate(doc.updated_at)}</span>
                  {!isOwn(doc) && <span className="text-[#a855f7]">{doc.instructor_callsign || doc.instructor_name}</span>}
                </div>
              )}
            </div>

            {isOwn(doc) && (
              <div className={`flex items-center gap-1 ${viewMode === "grid" ? "mt-2" : "flex-shrink-0"}`}
                onClick={e => e.stopPropagation()}>
                {isFile && (
                  <a href={doc.file_url || ""} download={doc.file_original_name || doc.title} title="Скачать"
                    className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                    <Icon name="Download" size={12} />
                  </a>
                )}
                <button onClick={() => setSharingDoc(doc)} title="Выдать доступ"
                  className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#a855f7] transition-colors">
                  <Icon name="UserPlus" size={12} />
                </button>
                <button onClick={() => onDeleteDoc(doc)} title="Удалить"
                  className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
                  <Icon name="Trash2" size={12} />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Пустая папка */}
      {subfolders.length === 0 && currentDocs.length === 0 && (
        <div className={`text-center py-16 ${viewMode === "grid" ? "col-span-full" : ""}`}
          style={{ border: "1px dashed rgba(0,245,255,0.1)" }}>
          <Icon name="FolderOpen" size={36} className="text-[#1a3050] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570]">
            {currentFolderId ? "Папка пуста" : "Файлов нет"}
          </div>
          <div className="font-mono text-[10px] text-[#1a2840] mt-1">
            Создайте папку, документ или загрузите файл
          </div>
        </div>
      )}
    </div>

    {sharingDoc && (
      <DocShareModal doc={sharingDoc} onClose={() => setSharingDoc(null)} />
    )}
    </>
  );
}
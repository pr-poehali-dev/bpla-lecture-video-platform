import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { Folder } from "./DocTypes";

type ViewMode = "grid" | "list";

interface Props {
  search: string;
  viewMode: ViewMode;
  uploading: boolean;
  currentFolderId: number | null;
  breadcrumbs: Folder[];
  dragOver: number | "root" | null;
  onSearchChange: (v: string) => void;
  onViewModeChange: (v: ViewMode) => void;
  onCreateFolder: () => void;
  onCreateDoc: () => void;
  onUploadFile: (file: File) => void;
  onStartLecture?: () => void;
  onNavigate: (id: number | null) => void;
  onDragOver: (target: number | "root") => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, folderId: number | null) => void;
}

export default function FmToolbar({
  search, viewMode, uploading,
  currentFolderId, breadcrumbs, dragOver,
  onSearchChange, onViewModeChange,
  onCreateFolder, onCreateDoc, onUploadFile, onStartLecture,
  onNavigate, onDragOver, onDragLeave, onDrop,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadFile(file);
    e.target.value = "";
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Поиск в текущей папке..."
            className="w-full bg-transparent pl-8 pr-3 py-1.5 font-mono text-xs text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </div>

        {/* View toggle */}
        <div className="flex">
          {(["list", "grid"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => onViewModeChange(v)}
              className="w-8 h-8 flex items-center justify-center transition-all"
              style={{ border: `1px solid rgba(0,245,255,${viewMode === v ? "0.4" : "0.1"})`, color: viewMode === v ? "#00f5ff" : "#3a5570", background: viewMode === v ? "rgba(0,245,255,0.06)" : "transparent" }}>
              <Icon name={v === "list" ? "List" : "LayoutGrid"} size={14} />
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <button onClick={onCreateFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
          style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
          <Icon name="FolderPlus" size={13} /> Папка
        </button>
        <button onClick={onCreateDoc}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
          style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
          <Icon name="FilePlus" size={13} /> Документ
        </button>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all disabled:opacity-50"
          style={{ border: "1px solid rgba(168,85,247,0.4)", color: "#a855f7", background: "rgba(168,85,247,0.04)" }}>
          <Icon name={uploading ? "Loader" : "Upload"} size={13} className={uploading ? "animate-spin" : ""} />
          {uploading ? "Загрузка..." : "Загрузить"}
        </button>
        {onStartLecture && (
          <button onClick={onStartLecture}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
            style={{ border: "1px solid rgba(0,255,136,0.5)", color: "#00ff88", background: "rgba(0,255,136,0.08)", boxShadow: "0 0 8px rgba(0,255,136,0.1)" }}>
            <Icon name="Monitor" size={13} /> Лекция
          </button>
        )}
        <input ref={fileInputRef} type="file" className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.mp4,.webm"
          onChange={handleFileSelected} />
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => onNavigate(null)}
          className="flex items-center gap-1 font-mono text-xs transition-colors"
          style={{ color: currentFolderId === null ? "#00f5ff" : "#3a5570" }}
          onDragOver={e => { e.preventDefault(); onDragOver("root"); }}
          onDragLeave={onDragLeave}
          onDrop={e => onDrop(e, null)}>
          <Icon name="Home" size={12} />
          <span className={dragOver === "root" ? "text-[#00ff88]" : ""}>Все файлы</span>
        </button>
        {breadcrumbs.map(f => (
          <div key={f.id} className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-[#1a2a3a]">/</span>
            <button onClick={() => onNavigate(f.id)}
              className="font-mono text-xs transition-colors hover:text-white"
              style={{ color: currentFolderId === f.id ? f.color : "#3a5570" }}>
              {f.name}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
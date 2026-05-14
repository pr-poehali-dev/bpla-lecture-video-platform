import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Doc, Folder, CATEGORIES, FOLDER_COLORS } from "./DocTypes";

// ── Модалка создания/переименования папки ─────────────────────────────────────
interface FolderModalProps {
  initial?: Folder | null;
  folders: Folder[];
  onSave: (name: string, color: string, parent_id: number | null) => Promise<void>;
  onClose: () => void;
}

export function FolderModal({ initial, folders, onSave, onClose }: FolderModalProps) {
  const [name, setName] = useState(initial?.name || "");
  const [color, setColor] = useState(initial?.color || "#00f5ff");
  const [parentId, setParentId] = useState<number | null>(initial?.parent_id ?? null);
  const [saving, setSaving] = useState(false);

  const rootFolders = folders.filter(f => f.parent_id === null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,8,16,0.92)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm" style={{ background: "#0a1520", border: "1px solid rgba(0,245,255,0.2)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
          <span className="font-orbitron text-sm font-bold text-[#00f5ff]">{initial ? "ПЕРЕИМЕНОВАТЬ" : "НОВАЯ ПАПКА"}</span>
          <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors"><Icon name="X" size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">НАЗВАНИЕ *</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && !saving && (setSaving(true), onSave(name.trim(), color, parentId).finally(() => setSaving(false)))}
              placeholder="Группа А-1 / Конспекты / ..."
              className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
              style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
          </div>
          {!initial && (
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ПОДПАПКА В</label>
              <select value={parentId ?? ""} onChange={e => setParentId(e.target.value ? +e.target.value : null)}
                className="w-full bg-[#0a1520] px-3 py-2 font-mono text-xs text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }}>
                <option value="">Корневой уровень</option>
                {rootFolders.map(f => <option key={f.id} value={f.id} style={{ background: "#050810" }}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-2">ЦВЕТ</label>
            <div className="flex gap-2">
              {FOLDER_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, border: color === c ? "2px solid white" : "2px solid transparent", boxShadow: color === c ? `0 0 8px ${c}` : "none" }} />
              ))}
            </div>
          </div>
          <button onClick={async () => { if (!name.trim() || saving) return; setSaving(true); await onSave(name.trim(), color, parentId); setSaving(false); }}
            disabled={!name.trim() || saving}
            className="w-full py-2 font-mono text-xs disabled:opacity-50 transition-all"
            style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
            {saving ? "СОХРАНЕНИЕ..." : initial ? "ПЕРЕИМЕНОВАТЬ" : "СОЗДАТЬ ПАПКУ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Модалка создания документа ───────────────────────────────────────────────
interface NewDocModalProps {
  folderId: number | null;
  onSave: (title: string, category: string) => Promise<void>;
  onClose: () => void;
}

export function NewDocModal({ onSave, onClose }: NewDocModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Конспект");
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,8,16,0.92)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm" style={{ background: "#0a1520", border: "1px solid rgba(0,255,136,0.2)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,255,136,0.08)" }}>
          <span className="font-orbitron text-sm font-bold text-[#00ff88]">НОВЫЙ ДОКУМЕНТ</span>
          <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors"><Icon name="X" size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">НАЗВАНИЕ *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && title.trim() && !saving && (setSaving(true), onSave(title.trim(), category).finally(() => setSaving(false)))}
              placeholder="Название документа"
              className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
              style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
          </div>
          <div>
            <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">КАТЕГОРИЯ</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-[#0a1520] px-3 py-2 font-mono text-xs text-white outline-none"
              style={{ border: "1px solid rgba(0,255,136,0.2)" }}>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#050810" }}>{c}</option>)}
            </select>
          </div>
          <button onClick={async () => { if (!title.trim() || saving) return; setSaving(true); await onSave(title.trim(), category); setSaving(false); }}
            disabled={!title.trim() || saving}
            className="w-full py-2 font-mono text-xs disabled:opacity-50 transition-all"
            style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
            {saving ? "СОЗДАНИЕ..." : "СОЗДАТЬ И ОТКРЫТЬ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Просмотрщик загруженного файла ───────────────────────────────────────────
interface FileViewerProps {
  doc: Doc;
  onClose: () => void;
}

export function FileViewer({ doc, onClose }: FileViewerProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const isPdf = doc.file_mime === "application/pdf";
  const isWord = doc.file_mime?.includes("word") || doc.file_mime?.includes("document");
  const viewerUrl = isPdf
    ? `${doc.file_url}#toolbar=1`
    : isWord
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(doc.file_url || "")}&embedded=true`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,8,16,0.95)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-5xl flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.3)", background: "#0a1520", maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm text-white truncate">{doc.title}</span>
            {doc.file_original_name && <span className="font-mono text-[10px] text-[#3a5570]">{doc.file_original_name}</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <a href={doc.file_url || ""} download={doc.file_original_name || doc.title}
              className="flex items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors px-2 py-1"
              style={{ border: "1px solid rgba(0,245,255,0.15)" }}>
              <Icon name="Download" size={12} /> Скачать
            </a>
            <button onClick={() => window.open(doc.file_url || "", "_blank")}
              className="flex items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors px-2 py-1"
              style={{ border: "1px solid rgba(0,245,255,0.15)" }}>
              <Icon name="Printer" size={12} /> Печать
            </button>
            <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors ml-1">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {viewerUrl ? (
            <iframe src={viewerUrl} className="w-full h-full" style={{ minHeight: "72vh", border: "none" }} title={doc.title} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <Icon name="FileDown" size={48} className="text-[#3a5570]" />
              <div className="font-mono text-sm text-[#3a5570]">Предпросмотр недоступен для этого формата</div>
              <a href={doc.file_url || ""} download={doc.file_original_name}
                className="font-mono text-xs px-5 py-2" style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>
                СКАЧАТЬ ФАЙЛ
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

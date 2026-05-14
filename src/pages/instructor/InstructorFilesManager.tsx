import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import { User } from "@/App";
import Icon from "@/components/ui/icon";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { Doc, Folder, CATEGORIES, FOLDER_COLORS, fmtDate, fmtSize, MIME_ICON } from "./DocTypes";
import DocEditor from "./DocEditor";

interface Props { user: User; }

type ViewMode = "grid" | "list";

// ── Модалка создания/переименования папки ─────────────────────────────────────
function FolderModal({ initial, folders, onSave, onClose }: {
  initial?: Folder | null;
  folders: Folder[];
  onSave: (name: string, color: string, parent_id: number | null) => Promise<void>;
  onClose: () => void;
}) {
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
function NewDocModal({ folderId, onSave, onClose }: {
  folderId: number | null;
  onSave: (title: string, category: string) => Promise<void>;
  onClose: () => void;
}) {
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
function FileViewer({ doc, onClose }: { doc: Doc; onClose: () => void }) {
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

// ── Основной файловый менеджер ────────────────────────────────────────────────
export default function InstructorFilesManager({ user }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [viewingFile, setViewingFile] = useState<Doc | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);
  const [exportingDoc, setExportingDoc] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{ type: "folder" | "doc"; id: number; name: string } | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [dragOver, setDragOver] = useState<number | "root" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const load = () => {
    setLoading(true);
    api.instructor.foldersList(showAll)
      .then(res => { setFolders(res.folders || []); setDocs(res.docs || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [showAll]);

  // Хлебные крошки
  const getBreadcrumbs = (): Folder[] => {
    if (currentFolderId === null) return [];
    const result: Folder[] = [];
    let fid: number | null = currentFolderId;
    while (fid !== null) {
      const f = folders.find(x => x.id === fid);
      if (!f) break;
      result.unshift(f);
      fid = f.parent_id;
    }
    return result;
  };

  const currentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId) : null;
  const subfolders = folders.filter(f => f.parent_id === currentFolderId);
  const currentDocs = docs.filter(d => {
    const inFolder = d.folder_id === currentFolderId;
    if (!inFolder) return false;
    if (!search) return true;
    return d.title.toLowerCase().includes(search.toLowerCase());
  });

  const isOwn = (item: { owner_name?: string; owner_callsign?: string; instructor_name?: string; instructor_callsign?: string }) => {
    const name = item.owner_name || item.instructor_name || "";
    const callsign = item.owner_callsign || item.instructor_callsign || "";
    return user.is_admin || name === user.name || callsign === user.callsign;
  };

  // ── Создать папку
  const handleCreateFolder = async (name: string, color: string, parent_id: number | null) => {
    const res = await api.instructor.folderCreate({ name, color, parent_id: parent_id ?? currentFolderId });
    if (res.error) { showMsg(res.error, false); return; }
    showMsg(res.message || "Папка создана");
    setShowFolderModal(false);
    load();
  };

  // ── Переименовать папку
  const handleRenameFolder = async (name: string, color: string) => {
    if (!editingFolder) return;
    const res = await api.instructor.folderUpdate({ id: editingFolder.id, name, color });
    if (res.error) { showMsg(res.error, false); return; }
    showMsg("Папка обновлена");
    setEditingFolder(null);
    load();
  };

  // ── Удалить папку
  const handleDeleteFolder = async (id: number) => {
    const res = await api.instructor.folderDelete(id);
    setConfirmDelete(null);
    if (res.error) { showMsg(res.error, false); return; }
    showMsg("Папка удалена");
    if (currentFolderId === id) setCurrentFolderId(null);
    load();
  };

  // ── Создать документ
  const handleCreateDoc = async (title: string, category: string) => {
    const res = await api.instructor.docCreateInFolder({ title, category, folder_id: currentFolderId });
    if (res.error) { showMsg(res.error, false); return; }
    setShowNewDoc(false);
    const docRes = await api.instructor.docGet(res.id);
    if (docRes.doc) setEditingDoc(docRes.doc);
    load();
  };

  // ── Загрузить файл
  const handleUploadFile = () => { fileInputRef.current?.click(); };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      const res = await api.instructor.fileUpload({
        title: file.name.replace(/\.[^.]+$/, ""),
        file_data: dataUrl,
        original_name: file.name,
        mime_type: file.type || "application/octet-stream",
        folder_id: currentFolderId,
        category: "Конспект",
      });
      setUploading(false);
      if (res.error) { showMsg(res.error, false); return; }
      showMsg("Файл загружен");
      load();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Удалить документ
  const handleDeleteDoc = async (id: number) => {
    const res = await api.instructor.docDelete(id);
    setConfirmDelete(null);
    if (res.error) { showMsg(res.error, false); return; }
    showMsg("Удалено");
    load();
  };

  // ── Drag & drop перемещение документа в папку
  const handleDrop = async (e: React.DragEvent, folderId: number | null) => {
    e.preventDefault();
    setDragOver(null);
    const docId = e.dataTransfer.getData("docId");
    if (!docId) return;
    await api.instructor.docMove(+docId, folderId);
    load();
  };

  // ── Сохранить документ
  const handleSaveDoc = async (html: string, meta: Partial<Doc>) => {
    if (!editingDoc) return;
    setSavingDoc(true);
    await api.instructor.docUpdate({ id: editingDoc.id, content_html: html, ...meta });
    setSavingDoc(false);
    setEditingDoc(prev => prev ? { ...prev, ...meta, content_html: html } : prev);
    api.instructor.foldersList(showAll).then(r => { setFolders(r.folders || []); setDocs(r.docs || []); });
  };

  // ── Экспорт в DOCX
  const handleExportDoc = async () => {
    if (!editingDoc) return;
    setExportingDoc(true);
    const res = await api.instructor.docExportDocx(editingDoc.id);
    setExportingDoc(false);
    if (res.error) { showMsg(res.error, false); return; }
    const bytes = Uint8Array.from(atob(res.docx_b64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = res.filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Если открыт редактор
  if (editingDoc) {
    const canEdit = user.is_admin || editingDoc.instructor_name === user.name || editingDoc.instructor_callsign === user.callsign;
    return (
      <DocEditor
        doc={editingDoc}
        onSave={handleSaveDoc}
        onClose={() => { setEditingDoc(null); load(); }}
        onExport={handleExportDoc}
        onPrint={() => window.print()}
        saving={savingDoc || exportingDoc}
        readOnly={!canEdit}
      />
    );
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск в текущей папке..."
            className="w-full bg-transparent pl-8 pr-3 py-1.5 font-mono text-xs text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </div>

        {/* View toggle */}
        <div className="flex">
          {(["list", "grid"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className="w-8 h-8 flex items-center justify-center transition-all"
              style={{ border: `1px solid rgba(0,245,255,${viewMode === v ? "0.4" : "0.1"})`, color: viewMode === v ? "#00f5ff" : "#3a5570", background: viewMode === v ? "rgba(0,245,255,0.06)" : "transparent" }}>
              <Icon name={v === "list" ? "List" : "LayoutGrid"} size={14} />
            </button>
          ))}
        </div>

        {/* Show all toggle */}
        <button onClick={() => setShowAll(v => !v)}
          className="font-mono text-xs px-3 py-1.5 transition-all"
          style={{ border: `1px solid ${showAll ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.15)"}`, color: showAll ? "#00ff88" : "#5a7a95" }}>
          {showAll ? "Все" : "Мои"}
        </button>

        {/* Action buttons */}
        <button onClick={() => setShowFolderModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
          style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
          <Icon name="FolderPlus" size={13} /> Папка
        </button>
        <button onClick={() => setShowNewDoc(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
          style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
          <Icon name="FilePlus" size={13} /> Документ
        </button>
        <button onClick={handleUploadFile} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all disabled:opacity-50"
          style={{ border: "1px solid rgba(168,85,247,0.4)", color: "#a855f7", background: "rgba(168,85,247,0.04)" }}>
          <Icon name={uploading ? "Loader" : "Upload"} size={13} className={uploading ? "animate-spin" : ""} />
          {uploading ? "Загрузка..." : "Загрузить файл"}
        </button>
        <input ref={fileInputRef} type="file" className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.xlsx,.xls"
          onChange={onFileSelected} />
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setCurrentFolderId(null)}
          className="flex items-center gap-1 font-mono text-xs transition-colors"
          style={{ color: currentFolderId === null ? "#00f5ff" : "#3a5570" }}
          onDragOver={e => { e.preventDefault(); setDragOver("root"); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={e => handleDrop(e, null)}>
          <Icon name="Home" size={12} />
          <span className={dragOver === "root" ? "text-[#00ff88]" : ""}>Все файлы</span>
        </button>
        {breadcrumbs.map(f => (
          <div key={f.id} className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-[#1a2a3a]">/</span>
            <button onClick={() => setCurrentFolderId(f.id)}
              className="font-mono text-xs transition-colors hover:text-white"
              style={{ color: currentFolderId === f.id ? f.color : "#3a5570" }}>
              {f.name}
            </button>
          </div>
        ))}
      </div>

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" : "space-y-1"}>

          {/* Папки */}
          {subfolders.map(folder => (
            <div key={folder.id}
              className={`group transition-all cursor-pointer ${viewMode === "grid" ? "flex flex-col items-center p-4 text-center" : "flex items-center gap-3 px-4 py-2.5"}`}
              style={{
                background: dragOver === folder.id ? `${folder.color}15` : "rgba(13,27,46,0.5)",
                border: `1px solid ${dragOver === folder.id ? folder.color + "60" : folder.color + "25"}`,
              }}
              onClick={() => setCurrentFolderId(folder.id)}
              onDragOver={e => { e.preventDefault(); setDragOver(folder.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, folder.id)}>

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
                  <button onClick={() => setEditingFolder(folder)} title="Переименовать"
                    className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                    <Icon name="Pencil" size={12} />
                  </button>
                  <button onClick={() => setConfirmDelete({ type: "folder", id: folder.id, name: folder.name })} title="Удалить"
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
                onDragStart={e => { e.dataTransfer.setData("docId", String(doc.id)); }}
                className={`group transition-all cursor-pointer ${viewMode === "grid" ? "flex flex-col items-center p-4 text-center" : "flex items-center gap-3 px-4 py-2.5"}`}
                style={{ background: "rgba(13,27,46,0.4)", border: "1px solid rgba(0,245,255,0.08)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.08)"; }}
                onClick={() => isFile ? setViewingFile(doc) : setEditingDoc(doc)}>

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
                    <button onClick={() => setConfirmDelete({ type: "doc", id: doc.id, name: doc.title })} title="Удалить"
                      className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
                      <Icon name="Trash2" size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Пустая папка */}
          {subfolders.length === 0 && currentDocs.length === 0 && !loading && (
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
      )}

      {/* Модалки */}
      {showFolderModal && (
        <FolderModal
          folders={folders}
          onSave={handleCreateFolder}
          onClose={() => setShowFolderModal(false)}
        />
      )}
      {editingFolder && (
        <FolderModal
          initial={editingFolder}
          folders={folders}
          onSave={handleRenameFolder}
          onClose={() => setEditingFolder(null)}
        />
      )}
      {showNewDoc && (
        <NewDocModal
          folderId={currentFolderId}
          onSave={handleCreateDoc}
          onClose={() => setShowNewDoc(false)}
        />
      )}
      {viewingFile && (
        <FileViewer doc={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title={confirmDelete?.type === "folder" ? "Удалить папку" : "Удалить файл"}
        message={confirmDelete?.type === "folder"
          ? `Папка «${confirmDelete.name}» будет удалена. Файлы внутри переместятся в корень.`
          : `Файл «${confirmDelete?.name}» будет удалён безвозвратно.`}
        confirmLabel="Удалить"
        danger
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.type === "folder") handleDeleteFolder(confirmDelete.id);
          else handleDeleteDoc(confirmDelete.id);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

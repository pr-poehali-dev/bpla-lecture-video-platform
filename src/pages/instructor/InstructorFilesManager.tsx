import { useState, useEffect } from "react";
import { api } from "@/api";
import { User } from "@/App";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { Doc, Folder } from "./DocTypes";
import DocEditor from "./DocEditor";
import { FolderModal, NewDocModal, FileViewer } from "./FmModals";
import FmToolbar from "./FmToolbar";
import FmFileGrid from "./FmFileGrid";

interface Props { user: User; }

type ViewMode = "grid" | "list";

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
  const handleUploadFile = async (file: File) => {
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

  return (
    <div className="space-y-4">
      <FmToolbar
        search={search}
        viewMode={viewMode}
        showAll={showAll}
        uploading={uploading}
        currentFolderId={currentFolderId}
        breadcrumbs={getBreadcrumbs()}
        dragOver={dragOver}
        onSearchChange={setSearch}
        onViewModeChange={setViewMode}
        onShowAllToggle={() => setShowAll(v => !v)}
        onCreateFolder={() => setShowFolderModal(true)}
        onCreateDoc={() => setShowNewDoc(true)}
        onUploadFile={handleUploadFile}
        onNavigate={setCurrentFolderId}
        onDragOver={setDragOver}
        onDragLeave={() => setDragOver(null)}
        onDrop={handleDrop}
      />

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      <FmFileGrid
        subfolders={subfolders}
        currentDocs={currentDocs}
        folders={folders}
        docs={docs}
        loading={loading}
        viewMode={viewMode}
        currentFolderId={currentFolderId}
        dragOver={dragOver}
        isOwn={isOwn}
        onOpenFolder={setCurrentFolderId}
        onEditFolder={setEditingFolder}
        onDeleteFolder={f => setConfirmDelete({ type: "folder", id: f.id, name: f.name })}
        onOpenDoc={doc => doc.doc_type === "file" ? setViewingFile(doc) : setEditingDoc(doc)}
        onDeleteDoc={doc => setConfirmDelete({ type: "doc", id: doc.id, name: doc.title })}
        onDragOver={setDragOver}
        onDragLeave={() => setDragOver(null)}
        onDrop={handleDrop}
        onDragStart={(e, docId) => e.dataTransfer.setData("docId", String(docId))}
      />

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

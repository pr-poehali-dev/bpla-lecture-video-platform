import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api, FileItem } from "@/api";
import ConfirmModal from "./ConfirmModal";

const SECTIONS = [
  { key: "all", label: "Все", icon: "Layers" },
  { key: "general", label: "Лекции / Видео", icon: "BookOpen" },
  { key: "tacmed", label: "Так Мед", icon: "HeartPulse" },
  { key: "firmware", label: "Прошивки", icon: "Cpu" },
];

const CATEGORIES: Record<string, string[]> = {
  general_doc: ["Регламенты", "Технические", "Учебные", "Схемы", "Карты"],
  general_video: ["Боевые", "Учебные", "Технические", "Разбор миссий"],
  tacmed: ["Первая помощь", "Турникеты и жгуты", "Эвакуация", "Протоколы", "Аптечка"],
  firmware: ["Betaflight", "ArduPilot", "ExpressLRS", "OpenTX/EdgeTX", "Инструкции"],
};

const ACCEPTED_MIME: Record<string, string> = {
  "video/mp4": "video", "video/webm": "video", "video/x-matroska": "video", "video/quicktime": "video",
  "application/pdf": "document", "text/plain": "document", "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-powerpoint": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
};

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function formatSize(b: number) {
  if (!b) return "YouTube";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} КБ`;
  return `${(b / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

const typeIcon: Record<string, string> = { video: "Play", document: "FileText", youtube: "Youtube" };
const typeColor: Record<string, string> = { video: "#00f5ff", document: "#00ff88", youtube: "#ff2244" };

export default function AdminContentTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [mode, setMode] = useState<"file" | "youtube">("file");
  const [form, setForm] = useState({ title: "", description: "", category: "", section: "general" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadFiles = () => {
    setLoading(true);
    api.files.list().then(res => { setFiles(res.files || []); setLoading(false); });
  };

  useEffect(() => { loadFiles(); }, []);

  const showMsg = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const detectedType = selectedFile ? ACCEPTED_MIME[selectedFile.type] : null;
  const uploadSection = form.section;
  const categories = uploadSection === "tacmed" ? CATEGORIES.tacmed
    : uploadSection === "firmware" ? CATEGORIES.firmware
    : mode === "youtube" || detectedType === "video" ? CATEGORIES.general_video
    : CATEGORIES.general_doc;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_MIME[f.type]) { showMsg(`Формат не поддерживается`, false); return; }
    setSelectedFile(f);
    if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") }));
  };

  const handleUpload = async () => {
    if (mode === "youtube") {
      const ytId = extractYoutubeId(youtubeUrl.trim());
      if (!ytId) { showMsg("Неверная ссылка YouTube", false); return; }
      if (!form.title.trim()) { showMsg("Укажите название", false); return; }
      setUploading(true);
      const res = await api.files.addYoutube({ title: form.title.trim(), description: form.description, category: form.category, section: form.section, youtube_id: ytId });
      setUploading(false);
      if (res.id) {
        showMsg("Видео добавлено!");
        setYoutubeUrl(""); setForm({ title: "", description: "", category: "", section: "general" }); loadFiles();
        api.notif.adminSend({ title: `Новое видео: ${form.title.trim()}`, type: "new_content", link_page: "videos" }).catch(() => {});
      } else { showMsg(res.error || "Ошибка", false); }
      return;
    }
    if (!selectedFile || !form.title.trim()) { showMsg("Выберите файл и укажите название", false); return; }
    setUploading(true); setUploadProgress(0);
    const reader = new FileReader();
    reader.onprogress = e => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 40)); };
    reader.onload = async () => {
      setUploadProgress(50);
      const base64 = (reader.result as string).split(",")[1];
      const res = await api.files.upload({ title: form.title.trim(), description: form.description, category: form.category, section: form.section, original_name: selectedFile.name, mime_type: selectedFile.type, file_data: base64 });
      setUploading(false); setUploadProgress(0);
      if (res.id) {
        showMsg("Файл загружен!");
        const t = form.title.trim(); const sec = form.section; const mime = selectedFile.type;
        setSelectedFile(null); setForm({ title: "", description: "", category: "", section: "general" });
        if (fileRef.current) fileRef.current.value = "";
        loadFiles();
        const lp = sec === "tacmed" ? "tacmed" : mime.startsWith("video/") ? "videos" : "lectures";
        api.notif.adminSend({ title: `Новый материал: ${t}`, type: "new_content", link_page: lp }).catch(() => {});
      } else { showMsg(res.error || "Ошибка загрузки", false); }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.files.delete(deleteTarget.id);
    setDeleteTarget(null);
    loadFiles();
    showMsg("Файл удалён");
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Удалить ${selected.size} файлов?`)) return;
    setBulkDeleting(true);
    await api.admin.bulkDeleteFiles(Array.from(selected));
    setSelected(new Set());
    setBulkDeleting(false);
    loadFiles();
    showMsg(`Удалено ${selected.size} файлов`);
  };

  const toggleSelect = (id: number) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(f => f.id)));
  };

  const toggleSort = (col: "date" | "name" | "size") => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const filtered = files
    .filter(f => {
      const matchSection = section === "all" || f.section === section || (!f.section && section === "general");
      const matchType = typeFilter === "all" || f.file_type === typeFilter || (typeFilter === "youtube" && f.mime_type === "youtube");
      const matchSearch = !search || [f.title, f.category, f.uploader].some(s => s?.toLowerCase().includes(search.toLowerCase()));
      return matchSection && matchType && matchSearch;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortBy === "name") cmp = a.title.localeCompare(b.title, "ru");
      else if (sortBy === "size") cmp = (a.file_size || 0) - (b.file_size || 0);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const stats = {
    total: files.length,
    docs: files.filter(f => f.file_type === "document").length,
    videos: files.filter(f => f.file_type === "video" || f.mime_type === "youtube").length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Всего файлов", value: stats.total, icon: "Layers", color: "#00f5ff" },
          { label: "Документов", value: stats.docs, icon: "FileText", color: "#00ff88" },
          { label: "Видео", value: stats.videos, icon: "Play", color: "#a855f7" },
        ].map(s => (
          <div key={s.label} className="p-4 flex items-center gap-3" style={{ background: "rgba(13,27,46,0.8)", border: "1px solid rgba(0,245,255,0.08)" }}>
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}>
              <Icon name={s.icon as "Layers"} size={16} style={{ color: s.color }} />
            </div>
            <div>
              <div className="font-orbitron text-xl font-black text-white">{s.value}</div>
              <div className="font-mono text-[10px] text-[#3a5570]">{s.label.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload form */}
      <div style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,7,14,0.8)" }}>
        <button onClick={() => setShowUpload(v => !v)}
          className="flex items-center justify-between w-full px-5 py-4 text-left"
          style={{ borderBottom: showUpload ? "1px solid rgba(0,245,255,0.08)" : "none" }}>
          <div className="flex items-center gap-3">
            <Icon name="Plus" size={16} className="text-[#00f5ff]" />
            <span className="font-orbitron text-sm font-bold text-[#00f5ff] tracking-wider">ДОБАВИТЬ МАТЕРИАЛ</span>
          </div>
          <Icon name={showUpload ? "ChevronUp" : "ChevronDown"} size={16} className="text-[#3a5570]" />
        </button>

        {showUpload && (
          <div className="p-5 space-y-4">
            {/* Mode & section */}
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2">
                {[{ key: "file", label: "ФАЙЛ", icon: "Upload" }, { key: "youtube", label: "YOUTUBE", icon: "Youtube" }].map(t => (
                  <button key={t.key} onClick={() => { setMode(t.key as "file" | "youtube"); setSelectedFile(null); setYoutubeUrl(""); }}
                    className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 transition-all"
                    style={{ border: `1px solid ${mode === t.key ? "#00f5ff" : "rgba(0,245,255,0.15)"}`, color: mode === t.key ? "#050810" : "#5a7a95", background: mode === t.key ? "#00f5ff" : "transparent" }}>
                    <Icon name={t.icon as "Upload"} size={12} />{t.label}
                  </button>
                ))}
              </div>
              <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value, category: "" }))}
                className="font-mono text-xs px-3 py-1.5 bg-transparent outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>
                {SECTIONS.filter(s => s.key !== "all").map(s => (
                  <option key={s.key} value={s.key} style={{ background: "#050810" }}>{s.label}</option>
                ))}
              </select>
            </div>

            {msg && (
              <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
                {msg.text}
              </div>
            )}

            {/* File or YouTube */}
            {mode === "file" ? (
              <label className="flex flex-col items-center justify-center p-6 cursor-pointer transition-all"
                style={{ border: `2px dashed ${selectedFile ? "#00ff88" : "rgba(0,245,255,0.2)"}`, background: selectedFile ? "rgba(0,255,136,0.03)" : "transparent" }}>
                <input ref={fileRef} type="file" className="hidden"
                  accept="video/mp4,video/webm,video/x-matroska,video/quicktime,application/pdf,text/plain,application/msword,.docx,application/vnd.ms-powerpoint,.pptx"
                  onChange={handleFileChange} />
                {selectedFile ? (
                  <div className="text-center">
                    <Icon name="CheckCircle" size={28} className="text-[#00ff88] mx-auto mb-2" />
                    <div className="font-mono text-xs text-[#00ff88]">{selectedFile.name}</div>
                    <div className="font-mono text-[10px] text-[#3a5570] mt-1">{formatSize(selectedFile.size)}</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Icon name="Upload" size={28} className="text-[#3a5570] mx-auto mb-2" />
                    <div className="font-mono text-xs text-[#5a7a95]">Перетащите или нажмите для выбора</div>
                    <div className="font-mono text-[10px] text-[#2a4060] mt-1">MP4, WebM, PDF, DOC, PPT</div>
                  </div>
                )}
              </label>
            ) : (
              <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-transparent px-3 py-2.5 font-mono text-xs text-white outline-none"
                style={{ border: "1px solid rgba(255,34,68,0.3)" }} />
            )}

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Название *"
                className="bg-transparent px-3 py-2.5 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="bg-transparent px-3 py-2.5 font-plex text-sm outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.15)", color: form.category ? "#fff" : "#5a7a95" }}>
                <option value="" style={{ background: "#050810" }}>Категория</option>
                {categories.map(c => <option key={c} value={c} style={{ background: "#050810" }}>{c}</option>)}
              </select>
            </div>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Описание (необязательно)" rows={2}
              className="w-full bg-transparent px-3 py-2.5 font-plex text-sm text-white outline-none resize-none"
              style={{ border: "1px solid rgba(0,245,255,0.15)" }} />

            {uploading && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-[#3a5570]">
                  <span>Загрузка...</span><span>{uploadProgress}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg,#00f5ff,#00ff88)" }} />
                </div>
              </div>
            )}

            <button onClick={handleUpload} disabled={uploading}
              className="flex items-center justify-center gap-2 w-full py-3 font-mono text-xs font-bold tracking-wider transition-all"
              style={{ background: uploading ? "rgba(0,245,255,0.05)" : "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: uploading ? "#3a5570" : "#00f5ff" }}>
              {uploading ? <><Icon name="Loader" size={14} className="animate-spin" /> ЗАГРУЗКА...</> : <><Icon name="Upload" size={14} /> ЗАГРУЗИТЬ</>}
            </button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] transition-all"
              style={{ border: `1px solid ${section === s.key ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,0.1)"}`, color: section === s.key ? "#00f5ff" : "#5a7a95", background: section === s.key ? "rgba(0,245,255,0.08)" : "transparent" }}>
              <Icon name={s.icon as "Layers"} size={11} />{s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ key: "all", label: "ВСЕ" }, { key: "video", label: "ВИДЕО" }, { key: "document", label: "ДОКУМЕНТЫ" }, { key: "youtube", label: "YOUTUBE" }].map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              className="px-3 py-1.5 font-mono text-[10px] transition-all"
              style={{ border: `1px solid ${typeFilter === t.key ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.08)"}`, color: typeFilter === t.key ? "#00ff88" : "#5a7a95", background: typeFilter === t.key ? "rgba(0,255,136,0.06)" : "transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[180px] relative">
          <Icon name="Search" size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
            className="w-full bg-transparent pl-8 pr-3 py-1.5 font-mono text-xs text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.1)" }} />
        </div>
        <span className="font-mono text-[10px] text-[#3a5570] ml-auto">{filtered.length} файлов</span>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 animate-fade-in" style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.15)" }}>
          <input type="checkbox" checked={selected.size === filtered.length} onChange={toggleSelectAll} className="w-3.5 h-3.5 cursor-pointer accent-[#00f5ff]" />
          <span className="font-mono text-xs text-[#00f5ff]">Выбрано: {selected.size}</span>
          <button onClick={handleBulkDelete} disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs text-[#ff2244] disabled:opacity-50 transition-colors"
            style={{ border: "1px solid rgba(255,34,68,0.3)" }}>
            <Icon name={bulkDeleting ? "Loader" : "Trash2"} size={11} className={bulkDeleting ? "animate-spin" : ""} />
            Удалить выбранные
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto font-mono text-[10px] text-[#3a5570] hover:text-white">
            <Icon name="X" size={13} />
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid rgba(0,245,255,0.08)", background: "rgba(4,7,14,0.6)" }}>
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2" style={{ borderBottom: "1px solid rgba(0,245,255,0.06)", background: "rgba(0,245,255,0.02)" }}>
          {[
            { label: "", cols: 1, isCheckbox: true },
            { label: "НАЗВАНИЕ", cols: 5, sort: "name" as const },
            { label: "РАЗДЕЛ", cols: 2 },
            { label: "КАТЕГОРИЯ", cols: 2 },
            { label: "РАЗМЕР", cols: 1, sort: "size" as const },
            { label: "", cols: 1 },
          ].map(col => (
            <div key={col.label || "cb"} className={`col-span-${col.cols} font-mono text-[9px] text-[#2a4060] tracking-widest flex items-center gap-1`}>
              {(col as { isCheckbox?: boolean }).isCheckbox ? (
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll} className="w-3.5 h-3.5 cursor-pointer accent-[#00f5ff]" />
              ) : col.sort ? (
                <button onClick={() => toggleSort(col.sort!)} className="flex items-center gap-1 hover:text-[#00f5ff] transition-colors">
                  {col.label}
                  <Icon name={sortBy === col.sort ? (sortDir === "asc" ? "ChevronUp" : "ChevronDown") : "ChevronsUpDown"} size={10} />
                </button>
              ) : col.label}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 font-mono text-xs text-[#3a5570]">ЗАГРУЗКА...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="Inbox" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
            <div className="font-mono text-xs text-[#3a5570]">Файлов не найдено</div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(0,245,255,0.04)" }}>
            {filtered.map((file, i) => {
              const ft = file.mime_type === "youtube" ? "youtube" : file.file_type;
              return (
                <div key={file.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 hover:bg-[rgba(0,245,255,0.02)] transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 0.02}s`, background: selected.has(file.id) ? "rgba(0,245,255,0.03)" : undefined }}>
                  <div className="md:col-span-1 flex items-center gap-2">
                    <input type="checkbox" checked={selected.has(file.id)} onChange={() => toggleSelect(file.id)}
                      className="w-3.5 h-3.5 cursor-pointer accent-[#00f5ff] flex-shrink-0" />
                    <div className="w-7 h-7 flex items-center justify-center" style={{ background: `${typeColor[ft]}10`, border: `1px solid ${typeColor[ft]}25` }}>
                      <Icon name={typeIcon[ft] as "Play"} size={12} style={{ color: typeColor[ft] }} />
                    </div>
                  </div>
                  <div className="md:col-span-5 flex flex-col justify-center">
                    <div className="font-plex text-sm text-white truncate">{file.title}</div>
                    <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">{formatDate(file.created_at)} · {file.uploader}</div>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.12)", color: "#5a7a95" }}>
                      {file.section === "tacmed" ? "ТАК МЕД" : file.section === "firmware" ? "ПРОШИВКИ" : "МАТЕРИАЛЫ"}
                    </span>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <span className="font-mono text-[10px] text-[#3a5570] truncate">{file.category || "—"}</span>
                  </div>
                  <div className="md:col-span-1 flex items-center">
                    <span className="font-mono text-[10px] text-[#3a5570]">{formatSize(file.file_size)}</span>
                  </div>
                  <div className="md:col-span-1 flex items-center justify-end gap-2">
                    {file.cdn_url && file.mime_type !== "youtube" && (
                      <a href={file.cdn_url} target="_blank" rel="noopener noreferrer"
                        className="text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                        <Icon name="ExternalLink" size={13} />
                      </a>
                    )}
                    <button onClick={() => setDeleteTarget(file)} className="text-[#3a5570] hover:text-[#ff2244] transition-colors">
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Удалить файл"
        message={`Файл «${deleteTarget?.title}» будет удалён безвозвратно.`}
        confirmLabel="Удалить"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
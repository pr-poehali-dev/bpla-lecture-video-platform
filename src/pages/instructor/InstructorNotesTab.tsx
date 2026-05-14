import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface NoteFile {
  id: number;
  title: string;
  description: string;
  category: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  cdn_url: string;
  created_at: string;
  uploader_name: string;
  uploader_callsign: string;
}

const CATEGORIES = ["Конспект", "Методичка", "Программа", "Нормативный документ", "Прочее"];

const MIME_LABELS: Record<string, { label: string; color: string }> = {
  "application/pdf": { label: "PDF", color: "#ff6b00" },
  "text/plain": { label: "TXT", color: "#00ff88" },
  "application/msword": { label: "DOC", color: "#2b7fff" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOCX", color: "#2b7fff" },
  "application/vnd.ms-powerpoint": { label: "PPT", color: "#ff6b00" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { label: "PPTX", color: "#ff6b00" },
  "application/zip": { label: "ZIP", color: "#a855f7" },
  "application/octet-stream": { label: "BIN", color: "#00f5ff" },
};

function fmtSize(b: number) {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} КБ`;
  return `${(b / (1024 * 1024)).toFixed(1)} МБ`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface Props { user: User; }

export default function InstructorNotesTab({ user }: Props) {
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filterCat, setFilterCat] = useState("Все");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: CATEGORIES[0] });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [viewing, setViewing] = useState<NoteFile | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const load = () => {
    setLoading(true);
    api.instructor.notesList(showAll).then(res => { setFiles(res.notes || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [showAll]);

  const upload = async () => {
    if (!form.title.trim() || !selectedFile) { showMsg("Выберите файл и укажите название", false); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      const res = await api.instructor.noteUpload({
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        original_name: selectedFile.name,
        mime_type: selectedFile.type || "application/octet-stream",
        file_data: dataUrl,
      });
      setUploading(false);
      if (res.error) { showMsg(res.error, false); return; }
      showMsg("Конспект загружен");
      setForm({ title: "", description: "", category: CATEGORIES[0] });
      setSelectedFile(null);
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = "";
      load();
    };
    reader.readAsDataURL(selectedFile);
  };

  const del = async (id: number) => {
    if (!confirm("Удалить конспект?")) return;
    const res = await api.instructor.noteDelete(id);
    if (res.error) showMsg(res.error, false);
    else { showMsg("Удалён"); load(); }
  };

  const filtered = files.filter(f => {
    const matchCat = filterCat === "Все" || f.category === filterCat;
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
            className="w-full bg-transparent pl-8 pr-3 py-1.5 font-mono text-xs text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </div>
        {user.is_admin && (
          <button onClick={() => setShowAll(v => !v)}
            className="font-mono text-xs px-3 py-1.5 transition-all"
            style={{ border: `1px solid ${showAll ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.15)"}`, color: showAll ? "#00ff88" : "#5a7a95" }}>
            {showAll ? "Все инструкторы" : "Мои"}
          </button>
        )}
        <button onClick={() => setShowUpload(v => !v)}
          className="flex items-center gap-2 px-4 py-1.5 font-mono text-xs transition-all"
          style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: showUpload ? "rgba(0,255,136,0.08)" : "rgba(0,255,136,0.04)" }}>
          <Icon name={showUpload ? "X" : "Upload"} size={13} />
          {showUpload ? "ОТМЕНА" : "ЗАГРУЗИТЬ"}
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {["Все", ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="font-mono text-xs px-3 py-1 transition-all"
            style={{ border: `1px solid ${filterCat === cat ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.1)"}`, color: filterCat === cat ? "#00ff88" : "#5a7a95", background: filterCat === cat ? "rgba(0,255,136,0.05)" : "transparent" }}>
            {cat}
          </button>
        ))}
      </div>

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {/* Upload form */}
      {showUpload && (
        <div className="p-5 space-y-3 animate-fade-in" style={{ border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.02)" }}>
          <div className="font-orbitron text-sm font-bold text-[#00ff88]">ЗАГРУЗКА КОНСПЕКТА</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">НАЗВАНИЕ *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Конспект по теме..."
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">КАТЕГОРИЯ</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-[#0a1520] px-3 py-2 font-mono text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)" }}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#050810" }}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ОПИСАНИЕ</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Краткое описание (необязательно)"
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
            </div>
          </div>
          <label className="flex flex-col items-center justify-center py-8 cursor-pointer transition-all"
            style={{ border: `2px dashed ${selectedFile ? "rgba(0,255,136,0.4)" : "rgba(0,255,136,0.15)"}`, background: selectedFile ? "rgba(0,255,136,0.03)" : "transparent" }}>
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") })); }}} />
            {selectedFile ? (
              <><Icon name="CheckCircle" size={24} className="text-[#00ff88] mb-2" /><div className="font-mono text-xs text-[#00ff88]">{selectedFile.name}</div><div className="font-mono text-[10px] text-[#3a5570] mt-1">{fmtSize(selectedFile.size)}</div></>
            ) : (
              <><Icon name="Upload" size={24} className="text-[#3a5570] mb-2" /><div className="font-mono text-xs text-[#5a7a95]">PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP</div></>
            )}
          </label>
          <div className="flex gap-3">
            <button onClick={upload} disabled={uploading || !selectedFile || !form.title.trim()}
              className="flex items-center gap-2 px-5 py-2 font-mono text-xs disabled:opacity-50 transition-all"
              style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
              <Icon name={uploading ? "Loader" : "Upload"} size={12} className={uploading ? "animate-spin" : ""} />
              {uploading ? "ЗАГРУЗКА..." : "ЗАГРУЗИТЬ"}
            </button>
          </div>
        </div>
      )}

      {/* File viewer modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(5,8,16,0.95)" }}
          onClick={e => { if (e.target === e.currentTarget) setViewing(null); }}>
          <div className="w-full sm:max-w-4xl flex flex-col" style={{ border: "1px solid rgba(0,255,136,0.3)", background: "#0a1520", maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
              <span className="font-mono text-sm text-white truncate">{viewing.title}</span>
              <div className="flex items-center gap-3 ml-4">
                <a href={viewing.cdn_url} download={viewing.original_name}
                  className="font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex items-center gap-1">
                  <Icon name="Download" size={13} /> Скачать
                </a>
                <button onClick={() => setViewing(null)} className="text-[#3a5570] hover:text-white transition-colors">
                  <Icon name="X" size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              {viewing.mime_type === "application/pdf" ? (
                <iframe src={`${viewing.cdn_url}#toolbar=1`} className="w-full h-full" style={{ minHeight: "70vh", border: "none" }} title={viewing.title} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                  <Icon name="FileDown" size={48} className="text-[#3a5570]" />
                  <div className="font-mono text-sm text-[#3a5570]">Предпросмотр недоступен</div>
                  <a href={viewing.cdn_url} download={viewing.original_name}
                    className="font-mono text-xs px-4 py-2" style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88" }}>
                    СКАЧАТЬ ФАЙЛ
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ border: "1px solid rgba(0,255,136,0.08)" }}>
          <Icon name="FileText" size={36} className="text-[#1a3050] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570]">Конспектов нет</div>
        </div>
      ) : (
        <div style={{ border: "1px solid rgba(0,255,136,0.08)" }}>
          {filtered.map((file, i) => {
            const meta = MIME_LABELS[file.mime_type] || { label: "FILE", color: "#3a5570" };
            return (
              <div key={file.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[rgba(0,255,136,0.02)] transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,245,255,0.04)" : "none" }}
                onClick={() => setViewing(file)}>
                <span className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                  style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}55`, color: meta.color }}>
                  {meta.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-plex text-sm text-white truncate">{file.title}</div>
                  <div className="font-mono text-[10px] text-[#3a5570] flex flex-wrap gap-x-3">
                    {file.category && <span>{file.category}</span>}
                    <span>{fmtDate(file.created_at)}</span>
                    {(showAll || user.is_admin) && <span className="text-[#a855f7]">{file.uploader_callsign || file.uploader_name}</span>}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[#3a5570] flex-shrink-0 hidden sm:block">{fmtSize(file.file_size)}</span>
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setViewing(file)} title="Открыть"
                    className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00ff88] transition-colors">
                    <Icon name="Eye" size={14} />
                  </button>
                  <a href={file.cdn_url} download={file.original_name} title="Скачать"
                    className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                    <Icon name="Download" size={14} />
                  </a>
                  <button onClick={() => del(file.id)} title="Удалить"
                    className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

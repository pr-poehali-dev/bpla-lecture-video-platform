import { useState, useEffect, useRef } from "react";
import { api, FileItem } from "@/api";
import Icon from "@/components/ui/icon";

const DOC_CATEGORIES = ["Регламенты", "Технические", "Учебные", "Схемы", "Карты"];

const ACCEPTED = {
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-powerpoint": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
  "text/plain": "document",
} as Record<string, string>;

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return iso; }
}

type UploadState = "idle" | "reading" | "uploading" | "done" | "error";

export default function AdminLecturesTab() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Все");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(DOC_CATEGORIES[0]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const loadFiles = async () => {
    setLoading(true);
    const res = await api.files.list("document", undefined, "general");
    setFiles(res.files || []);
    setLoading(false);
  };

  useEffect(() => { loadFiles(); }, []);

  const deleteFile = async (id: number, name: string) => {
    if (!confirm(`Удалить «${name}»?`)) return;
    const res = await api.files.delete(id);
    if (res.message) { showMsg(res.message); loadFiles(); }
    else showMsg(res.error || "Ошибка удаления", false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED[f.type]) { setUploadError("Неподдерживаемый формат. Допустимы PDF, DOC, DOCX, PPT, PPTX, TXT"); return; }
    setUploadError("");
    setSelectedFile(f);
  };

  const handleUpload = async () => {
    if (!title.trim()) { setUploadError("Укажите название"); return; }
    if (!selectedFile) { setUploadError("Выберите файл"); return; }
    setUploadState("reading");
    setUploadError("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadState("uploading");
      const res = await api.files.upload({
        title: title.trim(),
        description: description.trim(),
        category,
        section: "general",
        original_name: selectedFile.name,
        mime_type: selectedFile.type,
        file_data: dataUrl,
      });
      if (res.error) { setUploadError(res.error); setUploadState("error"); return; }
      setUploadState("done");
      showMsg("Лекция загружена");
      setTitle(""); setDescription(""); setSelectedFile(null); setCategory(DOC_CATEGORIES[0]);
      setShowUpload(false); setUploadState("idle");
      loadFiles();
    };
    reader.readAsDataURL(selectedFile);
  };

  const filtered = files.filter(f => {
    const matchCat = filterCat === "Все" || f.category === filterCat;
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="p-4 text-center" style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}>
            <div className="font-orbitron text-3xl font-black mb-1 text-[#00f5ff]">{files.length}</div>
            <div className="font-mono text-xs text-[#3a5570] tracking-wider">ДОКУМЕНТОВ</div>
          </div>
          <div className="p-4 text-center" style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}>
            <div className="font-orbitron text-3xl font-black mb-1 text-[#00ff88]">{DOC_CATEGORIES.length}</div>
            <div className="font-mono text-xs text-[#3a5570] tracking-wider">КАТЕГОРИЙ</div>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 font-mono text-xs px-4 py-2.5 transition-colors flex-shrink-0"
          style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: showUpload ? "rgba(0,245,255,0.1)" : "transparent" }}
        >
          <Icon name={showUpload ? "X" : "Plus"} size={13} />
          {showUpload ? "ОТМЕНА" : "ЗАГРУЗИТЬ"}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="p-5 space-y-4" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(0,245,255,0.02)" }}>
          <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-2">НОВАЯ ЛЕКЦИЯ</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider">НАЗВАНИЕ *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm bg-transparent text-white placeholder-[#3a5570] outline-none"
                style={{ border: "1px solid #1a2a3a" }}
                placeholder="Название документа"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider">КАТЕГОРИЯ</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm bg-[#0a1520] text-white outline-none"
                style={{ border: "1px solid #1a2a3a" }}
              >
                {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] text-[#3a5570] tracking-wider">ОПИСАНИЕ</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 font-mono text-sm bg-transparent text-white placeholder-[#3a5570] outline-none resize-none"
              style={{ border: "1px solid #1a2a3a" }}
              placeholder="Краткое описание (необязательно)"
            />
          </div>
          <div
            className="relative flex flex-col items-center justify-center py-8 cursor-pointer transition-colors"
            style={{ border: "2px dashed #1a2a3a" }}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="FileUp" size={24} className="text-[#3a5570] mb-2" />
            {selectedFile
              ? <span className="font-mono text-sm text-[#00f5ff]">{selectedFile.name}</span>
              : <span className="font-mono text-xs text-[#3a5570]">PDF, DOC, DOCX, PPT, PPTX, TXT</span>
            }
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleFileChange} />
          </div>
          {uploadError && (
            <div className="font-mono text-xs text-[#ff2244]">✗ {uploadError}</div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploadState === "reading" || uploadState === "uploading"}
            className="flex items-center gap-2 font-mono text-xs px-5 py-2.5 transition-all disabled:opacity-50"
            style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}
          >
            {uploadState === "uploading" || uploadState === "reading"
              ? <><Icon name="Loader" size={13} className="animate-spin" />ЗАГРУЗКА...</>
              : <><Icon name="Upload" size={13} />ЗАГРУЗИТЬ</>
            }
          </button>
        </div>
      )}

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="flex-1 min-w-[160px] px-3 py-2 font-mono text-sm bg-transparent text-white placeholder-[#3a5570] outline-none"
          style={{ border: "1px solid #1a2a3a" }}
        />
        <div className="flex flex-wrap gap-1.5">
          {["Все", ...DOC_CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className="font-mono text-[10px] px-3 py-1.5 transition-colors"
              style={{
                border: `1px solid ${filterCat === cat ? "rgba(0,245,255,0.5)" : "rgba(0,245,255,0.1)"}`,
                color: filterCat === cat ? "#00f5ff" : "#5a7a95",
                background: filterCat === cat ? "rgba(0,245,255,0.08)" : "transparent",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 font-mono text-sm text-[#3a5570] tracking-widest">ЗАГРУЗКА...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 font-mono text-sm text-[#3a5570]" style={{ border: "1px solid #1a2a3a" }}>
          Документов не найдено
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f, i) => (
            <div
              key={f.id}
              className="flex items-center gap-4 p-4 animate-fade-in"
              style={{ background: "#0a1520", border: "1px solid #1a2a3a", animationDelay: `${i * 0.03}s` }}
            >
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.04)" }}>
                <Icon name="FileText" size={15} className="text-[#00f5ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] text-[#3a5570] mb-0.5">{f.category}</div>
                <div className="font-plex text-sm text-white truncate">{f.title}</div>
                {f.description && <div className="font-mono text-[10px] text-[#3a5570] truncate mt-0.5">{f.description}</div>}
              </div>
              <div className="hidden md:flex items-center gap-4 text-[#3a5570] flex-shrink-0">
                {f.file_size > 0 && <span className="font-mono text-xs">{formatSize(f.file_size)}</span>}
                <span className="font-mono text-xs">{fmtDate(f.created_at)}</span>
                {f.uploader && <span className="font-mono text-xs">{f.uploader}</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={f.cdn_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors"
                >
                  <Icon name="ExternalLink" size={13} />
                </a>
                <button
                  onClick={() => deleteFile(f.id, f.title)}
                  className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors"
                >
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

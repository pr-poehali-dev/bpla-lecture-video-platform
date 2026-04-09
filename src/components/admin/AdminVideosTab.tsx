import { useState, useEffect, useRef } from "react";
import { api, FileItem } from "@/api";
import Icon from "@/components/ui/icon";

const VIDEO_CATEGORIES = ["Боевые", "Учебные", "Технические", "Разбор миссий"];

const ACCEPTED_VIDEO = [
  "video/mp4", "video/webm", "video/x-matroska", "video/quicktime", "video/avi"
];

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return iso; }
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

type UploadMode = "file" | "youtube";
type UploadState = "idle" | "reading" | "uploading" | "done" | "error";

export default function AdminVideosTab() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Все");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");

  // общие поля
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(VIDEO_CATEGORIES[0]);

  // file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // youtube
  const [ytUrl, setYtUrl] = useState("");
  const [ytPreview, setYtPreview] = useState<string | null>(null);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const loadFiles = async () => {
    setLoading(true);
    const res = await api.files.list("video", undefined, "general");
    setFiles(res.files || []);
    setLoading(false);
  };

  useEffect(() => { loadFiles(); }, []);

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory(VIDEO_CATEGORIES[0]);
    setSelectedFile(null); setYtUrl(""); setYtPreview(null);
    setUploadState("idle"); setUploadError(""); setUploadProgress(0);
  };

  const deleteFile = async (id: number, name: string) => {
    if (!confirm(`Удалить «${name}»?`)) return;
    const res = await api.files.delete(id);
    if (res.message) { showMsg(res.message); loadFiles(); }
    else showMsg(res.error || "Ошибка удаления", false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_VIDEO.includes(f.type)) {
      setUploadError("Неподдерживаемый формат. Допустимы MP4, WebM, MKV, MOV");
      return;
    }
    setUploadError("");
    setSelectedFile(f);
  };

  const handleYtUrlChange = (val: string) => {
    setYtUrl(val);
    const id = extractYoutubeId(val);
    setYtPreview(id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null);
  };

  const handleUploadFile = async () => {
    if (!title.trim()) { setUploadError("Укажите название"); return; }
    if (!selectedFile) { setUploadError("Выберите файл"); return; }
    setUploadState("reading"); setUploadError("");
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 50));
    };
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadState("uploading"); setUploadProgress(60);
      const res = await api.files.upload({
        title: title.trim(), description: description.trim(),
        category, section: "general",
        original_name: selectedFile.name, mime_type: selectedFile.type,
        file_data: dataUrl,
      });
      setUploadProgress(100);
      if (res.error) { setUploadError(res.error); setUploadState("error"); return; }
      setUploadState("done");
      showMsg("Видео загружено");
      resetForm(); setShowUpload(false);
      loadFiles();
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUploadYoutube = async () => {
    if (!title.trim()) { setUploadError("Укажите название"); return; }
    const ytId = extractYoutubeId(ytUrl);
    if (!ytId) { setUploadError("Неверная ссылка на YouTube"); return; }
    setUploadState("uploading"); setUploadError("");
    const res = await api.files.addYoutube({
      title: title.trim(), description: description.trim(),
      category, section: "general", youtube_id: ytId,
    });
    if (res.error) { setUploadError(res.error); setUploadState("error"); return; }
    setUploadState("done");
    showMsg("YouTube видео добавлено");
    resetForm(); setShowUpload(false);
    loadFiles();
  };

  const isYoutube = (f: FileItem) => f.mime_type === "youtube";

  const filtered = files.filter(f => {
    const matchCat = filterCat === "Все" || f.category === filterCat;
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const youtubeCount = files.filter(isYoutube).length;
  const fileCount = files.length - youtubeCount;

  return (
    <div className="space-y-4">
      {/* Stats + upload button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <div className="p-4 text-center" style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}>
            <div className="font-orbitron text-2xl font-black mb-1 text-[#00f5ff]">{files.length}</div>
            <div className="font-mono text-[10px] text-[#3a5570] tracking-wider">ВСЕГО</div>
          </div>
          <div className="p-4 text-center" style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}>
            <div className="font-orbitron text-2xl font-black mb-1 text-[#00ff88]">{fileCount}</div>
            <div className="font-mono text-[10px] text-[#3a5570] tracking-wider">ФАЙЛОВ</div>
          </div>
          <div className="p-4 text-center" style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}>
            <div className="font-orbitron text-2xl font-black mb-1 text-[#ff2244]">{youtubeCount}</div>
            <div className="font-mono text-[10px] text-[#3a5570] tracking-wider">YOUTUBE</div>
          </div>
        </div>
        <button
          onClick={() => { setShowUpload(!showUpload); resetForm(); }}
          className="flex items-center gap-2 font-mono text-xs px-4 py-2.5 transition-colors flex-shrink-0"
          style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: showUpload ? "rgba(0,245,255,0.1)" : "transparent" }}
        >
          <Icon name={showUpload ? "X" : "Plus"} size={13} />
          {showUpload ? "ОТМЕНА" : "ДОБАВИТЬ"}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="p-5 space-y-4" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(0,245,255,0.02)" }}>
          <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-2">НОВОЕ ВИДЕО</div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {(["file", "youtube"] as UploadMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setUploadMode(m); setUploadError(""); }}
                className="flex items-center gap-1.5 font-mono text-xs px-4 py-2 transition-colors"
                style={{
                  border: `1px solid ${uploadMode === m ? "rgba(0,245,255,0.5)" : "#1a2a3a"}`,
                  color: uploadMode === m ? "#00f5ff" : "#5a7a95",
                  background: uploadMode === m ? "rgba(0,245,255,0.08)" : "transparent",
                }}
              >
                <Icon name={m === "file" ? "FileVideo" : "Youtube"} size={12} />
                {m === "file" ? "Файл" : "YouTube"}
              </button>
            ))}
          </div>

          {/* Common fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider">НАЗВАНИЕ *</label>
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm bg-transparent text-white placeholder-[#3a5570] outline-none"
                style={{ border: "1px solid #1a2a3a" }}
                placeholder="Название видео"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider">КАТЕГОРИЯ</label>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm bg-[#0a1520] text-white outline-none"
                style={{ border: "1px solid #1a2a3a" }}
              >
                {VIDEO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] text-[#3a5570] tracking-wider">ОПИСАНИЕ</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 font-mono text-sm bg-transparent text-white placeholder-[#3a5570] outline-none resize-none"
              style={{ border: "1px solid #1a2a3a" }}
              placeholder="Краткое описание (необязательно)"
            />
          </div>

          {/* File picker */}
          {uploadMode === "file" && (
            <div
              className="relative flex flex-col items-center justify-center py-8 cursor-pointer transition-colors"
              style={{ border: "2px dashed #1a2a3a" }}
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="FileVideo" size={24} className="text-[#3a5570] mb-2" />
              {selectedFile
                ? <span className="font-mono text-sm text-[#00f5ff]">{selectedFile.name} ({formatSize(selectedFile.size)})</span>
                : <span className="font-mono text-xs text-[#3a5570]">MP4, WebM, MKV, MOV — кликни чтобы выбрать</span>
              }
              {uploadState === "reading" || uploadState === "uploading" ? (
                <div className="mt-3 w-48 h-1 rounded-full overflow-hidden" style={{ background: "#1a2a3a" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: "#00f5ff" }} />
                </div>
              ) : null}
              <input ref={fileRef} type="file" className="hidden" accept="video/mp4,video/webm,.mkv,.mov" onChange={handleFileChange} />
            </div>
          )}

          {/* YouTube picker */}
          {uploadMode === "youtube" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#3a5570] tracking-wider">ССЫЛКА НА YOUTUBE *</label>
                <input
                  value={ytUrl} onChange={e => handleYtUrlChange(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm bg-transparent text-white placeholder-[#3a5570] outline-none"
                  style={{ border: "1px solid #1a2a3a" }}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              {ytPreview && (
                <div className="flex items-center gap-3 p-3" style={{ border: "1px solid rgba(255,34,68,0.2)", background: "rgba(255,34,68,0.04)" }}>
                  <img src={ytPreview} alt="" className="w-24 h-14 object-cover flex-shrink-0" />
                  <div className="font-mono text-xs text-[#00ff88]">✓ Видео найдено</div>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div className="font-mono text-xs text-[#ff2244]">✗ {uploadError}</div>
          )}

          <button
            onClick={uploadMode === "file" ? handleUploadFile : handleUploadYoutube}
            disabled={uploadState === "reading" || uploadState === "uploading"}
            className="flex items-center gap-2 font-mono text-xs px-5 py-2.5 transition-all disabled:opacity-50"
            style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}
          >
            {uploadState === "uploading" || uploadState === "reading"
              ? <><Icon name="Loader" size={13} className="animate-spin" />ЗАГРУЗКА...</>
              : uploadMode === "file"
                ? <><Icon name="Upload" size={13} />ЗАГРУЗИТЬ ФАЙЛ</>
                : <><Icon name="Plus" size={13} />ДОБАВИТЬ YOUTUBE</>
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
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="flex-1 min-w-[160px] px-3 py-2 font-mono text-sm bg-transparent text-white placeholder-[#3a5570] outline-none"
          style={{ border: "1px solid #1a2a3a" }}
        />
        <div className="flex flex-wrap gap-1.5">
          {["Все", ...VIDEO_CATEGORIES].map(cat => (
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
          Видео не найдено
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f, i) => {
            const isYt = isYoutube(f);
            const ytId = isYt ? f.cdn_url?.split("/").pop() : null;
            const thumbUrl = isYt && ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

            return (
              <div
                key={f.id}
                className="flex items-center gap-4 p-4 animate-fade-in"
                style={{ background: "#0a1520", border: "1px solid #1a2a3a", animationDelay: `${i * 0.03}s` }}
              >
                {/* Thumbnail / icon */}
                <div className="w-16 h-10 flex-shrink-0 overflow-hidden" style={{ border: "1px solid #1a2a3a" }}>
                  {thumbUrl
                    ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(0,245,255,0.04)" }}>
                        <Icon name="Play" size={14} className="text-[#00f5ff]" />
                      </div>
                    )
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0" style={{
                      border: `1px solid ${isYt ? "rgba(255,34,68,0.3)" : "rgba(0,245,255,0.2)"}`,
                      color: isYt ? "#ff2244" : "#00f5ff",
                      background: isYt ? "rgba(255,34,68,0.06)" : "rgba(0,245,255,0.04)",
                    }}>
                      {isYt ? "YOUTUBE" : "ФАЙЛ"}
                    </span>
                    <span className="font-mono text-[10px] text-[#3a5570]">{f.category}</span>
                  </div>
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
                    href={isYt && ytId ? `https://youtube.com/watch?v=${ytId}` : f.cdn_url}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

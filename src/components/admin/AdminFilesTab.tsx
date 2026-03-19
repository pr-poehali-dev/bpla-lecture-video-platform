import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api, FileItem } from "@/api";

const VIDEO_CATEGORIES = ["Боевые", "Учебные", "Технические", "Разбор миссий"];
const DOC_CATEGORIES = ["Регламенты", "Технические", "Учебные", "Схемы", "Карты"];
const FIRMWARE_CATEGORIES = ["Betaflight", "ArduPilot", "ExpressLRS", "OpenTX/EdgeTX", "Инструкции"];

const SECTIONS = [
  { key: "general", label: "Материалы / Видео" },
  { key: "firmware", label: "Прошивки FPV КТ" },
];

const ACCEPTED_MIME: Record<string, string> = {
  "video/mp4": "video",
  "video/webm": "video",
  "video/x-matroska": "video",
  "video/quicktime": "video",
  "application/pdf": "document",
  "text/plain": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-powerpoint": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
};

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

export default function AdminFilesTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "youtube">("file");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", section: "general" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);

  const loadFiles = () => {
    setFilesLoading(true);
    api.files.list().then((res) => {
      setUploadedFiles(res.files || []);
      setFilesLoading(false);
    });
  };

  useEffect(() => { loadFiles(); }, []);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_MIME[f.type]) { showMsg(`Формат не поддерживается: ${f.type}`, false); return; }
    setSelectedFile(f);
    if (!form.title) setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, "") }));
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !form.title.trim()) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const res = await api.files.upload({
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        section: form.section,
        original_name: selectedFile.name,
        mime_type: selectedFile.type,
        file_data: base64,
      });
      setUploading(false);
      if (res.id) {
        showMsg("Файл загружен успешно!");
        setSelectedFile(null);
        setForm({ title: "", description: "", category: "", section: "general" });
        if (fileRef.current) fileRef.current.value = "";
        loadFiles();
      } else {
        showMsg(res.error || "Ошибка загрузки", false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAddYoutube = async () => {
    const ytId = extractYoutubeId(youtubeUrl.trim());
    if (!ytId) { showMsg("Неверная ссылка YouTube", false); return; }
    if (!form.title.trim()) { showMsg("Укажите название", false); return; }
    setUploading(true);
    const res = await api.files.addYoutube({
      title: form.title.trim(),
      description: form.description,
      category: form.category,
      section: form.section,
      youtube_id: ytId,
    });
    setUploading(false);
    if (res.id) {
      showMsg("Видео добавлено!");
      setYoutubeUrl("");
      setForm({ title: "", description: "", category: "", section: "general" });
      loadFiles();
    } else {
      showMsg(res.error || "Ошибка", false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить?")) return;
    await api.files.delete(id);
    loadFiles();
  };

  const detectedType = selectedFile ? ACCEPTED_MIME[selectedFile.type] : null;
  const isFirmware = form.section === "firmware";
  const categories = isFirmware
    ? FIRMWARE_CATEGORIES
    : mode === "youtube" || detectedType === "video"
      ? VIDEO_CATEGORIES
      : DOC_CATEGORIES;
  const ytId = extractYoutubeId(youtubeUrl);
  const formatSize = (b: number) => !b ? "YouTube" : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / (1024 * 1024)).toFixed(1)} МБ`;

  return (
    <div className="space-y-6">
      <div className="p-5 space-y-4" style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}>
        {/* Mode tabs */}
        <div className="flex gap-2">
          {[
            { key: "file", label: "ФАЙЛ", icon: "Upload" },
            { key: "youtube", label: "YOUTUBE", icon: "Youtube" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setMode(t.key as "file" | "youtube"); setSelectedFile(null); setYoutubeUrl(""); setForm({ title: "", description: "", category: "" }); }}
              className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 transition-all"
              style={{
                border: `1px solid ${mode === t.key ? "#00f5ff" : "#1a2a3a"}`,
                color: mode === t.key ? "#050810" : "#3a5570",
                background: mode === t.key ? "#00f5ff" : "transparent",
              }}
            >
              <Icon name={t.icon as "Upload" | "Youtube"} size={12} />
              {t.label}
            </button>
          ))}
        </div>

        {msg && (
          <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
            {msg.text}
          </div>
        )}

        {mode === "file" ? (
          <div
            className="flex flex-col items-center justify-center p-8 cursor-pointer transition-all"
            style={{ border: `2px dashed ${selectedFile ? "#00ff88" : "#1a2a3a"}`, background: selectedFile ? "rgba(0,255,136,0.03)" : "transparent" }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className="hidden" accept="video/mp4,video/webm,video/x-matroska,video/quicktime,application/pdf,text/plain,application/msword,.docx,application/vnd.ms-powerpoint,.pptx" onChange={handleFileChange} />
            {selectedFile ? (
              <>
                <Icon name="CheckCircle" size={32} className="text-[#00ff88] mb-2" />
                <div className="font-mono text-sm text-white">{selectedFile.name}</div>
                <div className="font-mono text-xs text-[#3a5570]">{formatSize(selectedFile.size)} • {detectedType === "video" ? "Видео" : "Документ"}</div>
              </>
            ) : (
              <>
                <Icon name="Upload" size={32} className="text-[#3a5570] mb-2" />
                <div className="font-mono text-sm text-[#3a5570]">Выберите файл</div>
                <div className="font-mono text-xs text-[#1a2a3a] mt-1">MP4, WebM, MKV, PDF, DOCX, TXT, PPT</div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="font-mono text-xs text-[#3a5570] block mb-1">ССЫЛКА НА YOUTUBE *</label>
              <input
                className="w-full font-mono text-sm bg-transparent px-3 py-2 text-white focus:outline-none"
                style={{ border: `1px solid ${ytId ? "#00ff88" : "#1a2a3a"}` }}
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
              {youtubeUrl && !ytId && <div className="font-mono text-xs text-[#ff2244] mt-1">Неверная ссылка</div>}
            </div>
            {ytId && (
              <div className="relative" style={{ aspectRatio: "16/9", background: "#000" }}>
                <img
                  src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                  alt="preview"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 flex items-center justify-center" style={{ background: "rgba(255,0,0,0.85)" }}>
                    <Icon name="Play" size={20} className="text-white ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="font-mono text-xs text-[#3a5570] block mb-1">РАЗДЕЛ</label>
          <div className="flex gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setForm((p) => ({ ...p, section: s.key, category: "" }))}
                className="font-mono text-xs px-3 py-1.5 transition-all"
                style={{
                  border: `1px solid ${form.section === s.key ? "#00f5ff" : "#1a2a3a"}`,
                  color: form.section === s.key ? "#050810" : "#3a5570",
                  background: form.section === s.key ? "#00f5ff" : "transparent",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-xs text-[#3a5570] block mb-1">НАЗВАНИЕ *</label>
            <input
              className="w-full font-mono text-sm bg-transparent px-3 py-2 text-white focus:outline-none"
              style={{ border: "1px solid #1a2a3a" }}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Название"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-[#3a5570] block mb-1">КАТЕГОРИЯ</label>
            <select
              className="w-full font-mono text-sm bg-[#050810] px-3 py-2 text-white focus:outline-none"
              style={{ border: "1px solid #1a2a3a" }}
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="">Без категории</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-[#3a5570] block mb-1">ОПИСАНИЕ</label>
          <input
            className="w-full font-mono text-sm bg-transparent px-3 py-2 text-white focus:outline-none"
            style={{ border: "1px solid #1a2a3a" }}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Краткое описание"
          />
        </div>

        <button
          onClick={mode === "file" ? handleUploadFile : handleAddYoutube}
          disabled={uploading || (mode === "file" ? !selectedFile || !form.title.trim() : !ytId || !form.title.trim())}
          className="w-full font-mono text-sm py-3 tracking-wider transition-all disabled:opacity-40"
          style={{ border: "1px solid #00f5ff", color: uploading ? "#3a5570" : "#00f5ff", background: "rgba(0,245,255,0.05)" }}
        >
          {uploading ? "ЗАГРУЗКА..." : mode === "file" ? "ЗАГРУЗИТЬ" : "ДОБАВИТЬ ВИДЕО"}
        </button>
      </div>

      {/* Files list */}
      <div style={{ border: "1px solid #1a2a3a" }}>
        <div className="px-4 py-3 font-mono text-xs text-[#00f5ff] tracking-wider" style={{ borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
          ЗАГРУЖЕННЫЕ ФАЙЛЫ {!filesLoading && `(${uploadedFiles.length})`}
        </div>
        {filesLoading ? (
          <div className="p-6 text-center font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
        ) : uploadedFiles.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-[#3a5570]">Файлы ещё не загружены</div>
        ) : (
          uploadedFiles.map((f, i) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < uploadedFiles.length - 1 ? "1px solid #0d1a28" : "none" }}>
              <Icon name={f.file_type === "video" ? (f.mime_type === "youtube" ? "Youtube" : "Video") : "FileText"} size={16} className={f.file_type === "video" ? "text-[#00f5ff]" : "text-[#ff6b00]"} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-white truncate">{f.title}</div>
                <div className="font-mono text-xs text-[#3a5570]">{f.category || "Без категории"} • {formatSize(f.file_size)}</div>
              </div>
              <span className="font-mono text-xs text-[#3a5570]">{f.mime_type === "youtube" ? "YOUTUBE" : f.file_type === "video" ? "ВИДЕО" : "ДОКУМЕНТ"}</span>
              <button onClick={() => handleDelete(f.id)} className="text-[#3a5570] hover:text-[#ff2244] transition-colors flex-shrink-0">
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
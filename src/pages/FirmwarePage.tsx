import { useState, useEffect } from "react";
import { api, FileItem } from "@/api";
import Icon from "@/components/ui/icon";
import { User } from "@/App";

const FIRMWARE_CATEGORIES = ["Все", "Betaflight", "ArduPilot", "ExpressLRS", "OpenTX/EdgeTX", "Инструкции"];

const MIME_LABELS: Record<string, { label: string; color: string }> = {
  "application/pdf": { label: "PDF", color: "#ff6b00" },
  "text/plain": { label: "TXT", color: "#00ff88" },
  "application/msword": { label: "DOC", color: "#2b7fff" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOCX", color: "#2b7fff" },
  "application/zip": { label: "ZIP", color: "#a855f7" },
  "application/octet-stream": { label: "BIN", color: "#00f5ff" },
};

const STATIC_SECTIONS = [
  {
    title: "Прошивки и ПО",
    icon: "Cpu",
    color: "#00f5ff",
    items: [
      { name: "Betaflight 4.5.1 — стабильный релиз", size: "12.4 МБ", version: "v4.5.1", date: "10 мар 2026", url: "https://github.com/betaflight/betaflight/releases/tag/4.5.1" },
      { name: "ArduPilot 4.6.0 — боевая конфигурация", size: "28.1 МБ", version: "v4.6.0", date: "05 мар 2026", url: "https://firmware.ardupilot.org/" },
      { name: "ExpressLRS 3.5.2 — прошивка TX/RX", size: "3.7 МБ", version: "v3.5.2", date: "01 мар 2026", url: "https://github.com/ExpressLRS/ExpressLRS/releases/tag/3.5.2" },
      { name: "OpenTX 2.3.15 — апдейт аппаратуры", size: "8.9 МБ", version: "v2.3.15", date: "20 фев 2026", url: "https://www.open-tx.org/downloads" },
    ],
  },
  {
    title: "Конфигурационные файлы",
    icon: "Settings",
    color: "#00ff88",
    items: [
      { name: "Betaflight пресет — боевой FPV", size: "0.02 МБ", version: "BF-WAR", date: "12 мар 2026", url: "https://github.com/betaflight/firmware-presets" },
      { name: "Конфигурация PID для ударных задач", size: "0.01 МБ", version: "PID-1.0", date: "08 мар 2026", url: "https://github.com/betaflight/betaflight/wiki/PID-Tuning-Guide" },
      { name: "OSD профиль — боевой режим", size: "0.03 МБ", version: "OSD-WAR", date: "02 мар 2026", url: "https://betaflight.com/docs/development/OSD" },
    ],
  },
  {
    title: "Документация",
    icon: "BookOpen",
    color: "#ff6b00",
    items: [
      { name: "Полный справочник FPV пилота", size: "14.5 МБ", version: "2026", date: "15 мар 2026", url: "https://oscarliang.com/fpv-drone-guide/" },
      { name: "Руководство по ремонту в полевых условиях", size: "6.2 МБ", version: "v2.1", date: "10 мар 2026", url: "https://ardupilot.org/copter/docs/common-field-repairs.html" },
      { name: "Нормативная база применения БпЛА", size: "2.8 МБ", version: "2026", date: "01 мар 2026", url: "https://favt.gov.ru/dejatelnost-uvs-i-bvs/" },
    ],
  },
];

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function DocViewerModal({ file, onClose }: { file: FileItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isPdf = file.mime_type === "application/pdf";
  const isTxt = file.mime_type === "text/plain";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,8,16,0.95)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-5xl flex flex-col"
        style={{ border: "1px solid #00f5ff", boxShadow: "0 0 40px rgba(0,245,255,0.2)", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
          <span className="font-mono text-sm text-white truncate">{file.title}</span>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <a href={file.cdn_url} download={file.original_name} className="font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors flex items-center gap-1">
              <Icon name="Download" size={14} />
              Скачать
            </a>
            <button onClick={onClose} className="text-[#3a5570] hover:text-[#00f5ff]">
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden" style={{ background: "#050810", minHeight: 0 }}>
          {isPdf ? (
            <iframe src={`${file.cdn_url}#toolbar=1`} className="w-full h-full" style={{ minHeight: "70vh", border: "none" }} title={file.title} />
          ) : isTxt ? (
            <TxtViewer url={file.cdn_url} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <Icon name="FileDown" size={48} className="text-[#3a5570]" />
              <div className="font-mono text-sm text-[#3a5570] text-center">Предпросмотр недоступен для этого формата</div>
              <a href={file.cdn_url} download={file.original_name} className="font-mono text-xs px-4 py-2 transition-all" style={{ border: "1px solid #00f5ff", color: "#00f5ff", background: "rgba(0,245,255,0.05)" }}>
                СКАЧАТЬ ФАЙЛ
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TxtViewer({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    fetch(url).then((r) => r.text()).then(setText).catch(() => setText("Не удалось загрузить файл"));
  }, [url]);
  if (text === null) return <div className="flex items-center justify-center h-full py-20"><div className="font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div></div>;
  return <div className="h-full overflow-auto p-6" style={{ minHeight: "60vh" }}><pre className="font-mono text-xs text-[#8899aa] whitespace-pre-wrap leading-relaxed">{text}</pre></div>;
}

type Tab = "firmware" | "downloads";

export default function FirmwarePage({ user }: { user?: User | null }) {
  const isInstructor = ["инструктор кт", "инструктор fpv", "инструктор оператор-сапер"].includes(user?.role || "");
  const canUpload = user?.is_admin || isInstructor;
  const canSeeDownloads = user?.is_admin || isInstructor;
  const [tab, setTab] = useState<Tab>("firmware");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [viewing, setViewing] = useState<FileItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    api.files.list("document", undefined, "firmware").then((res) => {
      setFiles(res.files || []);
      setLoading(false);
    });
  }, []);

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.txt,.doc,.docx,.zip,.bin,.hex,.config,.diff";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = (ev.target?.result as string).split(",")[1];
          const res = await api.files.upload({
            title: file.name.replace(/\.[^/.]+$/, ""),
            description: "",
            category: "Все",
            section: "firmware",
            original_name: file.name,
            mime_type: file.type || "application/octet-stream",
            file_data: base64,
          });
          if (res.id) {
            setUploadSuccess(`Файл «${file.name}» успешно загружен`);
            const updated = await api.files.list("document", undefined, "firmware");
            setFiles(updated.files || []);
          } else {
            setUploadError(res.error || "Ошибка загрузки");
          }
          setUploading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        setUploadError("Ошибка загрузки файла");
        setUploading(false);
      }
    };
    input.click();
  };

  const filtered = activeCategory === "Все"
    ? files
    : files.filter((f) => f.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 animate-fade-in">
      {viewing && <DocViewerModal file={viewing} onClose={() => setViewing(null)} />}

      {/* Заголовок */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ХРАНИЛИЩЕ ФАЙЛОВ</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white tracking-wider">ЗАГРУЗКИ И ПРОШИВКИ</h1>
      <p className="font-plex text-sm text-[#5a7a95]">Прошивки FPV-КТ, конфиги, документация — всё для работы</p>

      {/* Вкладки */}
      <div className="flex gap-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
        {([
          { id: "firmware" as Tab, label: "ПРОШИВКИ FPV КТ", icon: "Cpu", visible: true },
          { id: "downloads" as Tab, label: "ЗАГРУЗКИ", icon: "Download", visible: canSeeDownloads },
        ] as { id: Tab; label: string; icon: string; visible: boolean }[]).filter(t => t.visible).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 py-3 font-mono text-xs tracking-wider transition-all"
            style={{
              borderBottom: tab === t.id ? "2px solid #00f5ff" : "2px solid transparent",
              color: tab === t.id ? "#00f5ff" : "#3a5570",
              background: tab === t.id ? "rgba(0,245,255,0.04)" : "transparent",
              marginBottom: "-1px",
            }}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* === Вкладка: Прошивки === */}
      {tab === "firmware" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {FIRMWARE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="font-mono text-xs px-3 py-1.5 transition-all"
                style={{
                  border: `1px solid ${activeCategory === cat ? "#00f5ff" : "#1a2a3a"}`,
                  color: activeCategory === cat ? "#00f5ff" : "#3a5570",
                  background: activeCategory === cat ? "rgba(0,245,255,0.05)" : "transparent",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="font-mono text-xs text-[#3a5570] tracking-widest animate-pulse">ЗАГРУЗКА...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20" style={{ border: "1px solid #1a2a3a" }}>
              <Icon name="Cpu" size={32} className="text-[#3a5570] mx-auto mb-3" />
              <div className="font-mono text-xs text-[#3a5570] tracking-widest">ФАЙЛЫ НЕ НАЙДЕНЫ</div>
              <div className="font-mono text-xs text-[#1a2a3a] mt-1">Администратор ещё не добавил прошивки</div>
            </div>
          ) : (
            <div style={{ border: "1px solid #1a2a3a" }}>
              <div className="hidden md:grid font-mono text-xs text-[#3a5570] px-4 py-2" style={{ gridTemplateColumns: "auto 1fr auto auto auto", gap: "1rem", borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
                <span>#</span><span>НАЗВАНИЕ</span><span>КАТЕГОРИЯ</span><span>РАЗМЕР</span><span>ДЕЙСТВИЯ</span>
              </div>
              {filtered.map((file, i) => {
                const meta = MIME_LABELS[file.mime_type] || { label: "FILE", color: "#3a5570" };
                return (
                  <div
                    key={file.id}
                    className="flex items-center px-4 py-3 transition-colors hover:bg-[#0a1520] cursor-pointer gap-3"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #0d1a28" : "none" }}
                    onClick={() => setViewing(file)}
                  >
                    <span className="font-mono text-xs text-[#1a2a3a] w-6 flex-shrink-0">{i + 1}</span>
                    <span className="font-mono text-xs px-1.5 py-0.5 flex-shrink-0" style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}66`, color: meta.color }}>
                      {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-white truncate">{file.title}</div>
                      {file.description && <div className="font-mono text-xs text-[#3a5570] truncate">{file.description}</div>}
                    </div>
                    {file.category && <span className="font-mono text-xs text-[#3a5570] hidden md:block">{file.category}</span>}
                    <span className="font-mono text-xs text-[#1a2a3a]">{formatSize(file.file_size)}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setViewing(file)} className="font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors" title="Открыть">
                        <Icon name="Eye" size={16} />
                      </button>
                      <a href={file.cdn_url} download={file.original_name} className="font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors" title="Скачать">
                        <Icon name="Download" size={16} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === Вкладка: Загрузки === */}
      {tab === "downloads" && (
        <div className="space-y-10">
          <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: "rgba(0,245,255,0.03)", border: "1px dashed rgba(0,245,255,0.2)" }}>
            <div>
              <div className="font-orbitron text-sm text-white mb-1">ЗАГРУЗИТЬ ФАЙЛ</div>
              <div className="font-plex text-xs text-[#5a7a95]">
                {canUpload
                  ? "Поделитесь материалом с сообществом — прошивки, конфиги, документы"
                  : "Загрузка материалов доступна только инструкторам и администраторам"}
              </div>
            </div>
            {canUpload && (
              <button
                className="btn-neon flex items-center gap-2 flex-shrink-0"
                onClick={handleUpload}
                disabled={uploading}
              >
                <Icon name={uploading ? "Loader" : "Upload"} size={14} />
                {uploading ? "Загрузка..." : "Загрузить"}
              </button>
            )}
            {!canUpload && (
              <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 font-mono text-xs" style={{ border: "1px solid rgba(90,122,149,0.3)", color: "#3a5570" }}>
                <Icon name="Lock" size={12} />
                ТОЛЬКО ДЛЯ ИНСТРУКТОРОВ
              </div>
            )}
          </div>
          {uploadSuccess && (
            <div className="font-mono text-xs px-4 py-2 mt-2" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88" }}>
              ✓ {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div className="font-mono text-xs px-4 py-2 mt-2" style={{ background: "rgba(255,50,50,0.06)", border: "1px solid rgba(255,50,50,0.3)", color: "#ff5050" }}>
              ✗ {uploadError}
            </div>
          )}

          {STATIC_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 flex items-center justify-center" style={{ border: `1px solid ${section.color}40`, background: `${section.color}08` }}>
                  <Icon name={section.icon} size={14} style={{ color: section.color }} />
                </div>
                <h2 className="font-orbitron text-sm font-bold tracking-wider" style={{ color: section.color }}>{section.title.toUpperCase()}</h2>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${section.color}30, transparent)` }} />
              </div>

              <div className="space-y-2">
                {section.items.map((item, i) => (
                  <div
                    key={item.name}
                    className="card-drone flex items-center gap-4 p-4 animate-fade-in"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${section.color}10`, border: `1px solid ${section.color}25` }}>
                      <Icon name="File" size={16} style={{ color: section.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-plex text-sm text-white">{item.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-mono text-[10px] text-[#3a5570]">{item.size}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: `${section.color}10`, color: section.color, border: `1px solid ${section.color}25` }}>{item.version}</span>
                        <span className="font-mono text-[10px] text-[#2a4060]">{item.date}</span>
                      </div>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-wider transition-all duration-200 flex-shrink-0"
                      style={{ border: `1px solid ${section.color}40`, color: section.color, background: `${section.color}05`, textDecoration: "none" }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${section.color}15`; }}
                      onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${section.color}05`; }}
                    >
                      <Icon name="ExternalLink" size={12} />
                      СКАЧАТЬ
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
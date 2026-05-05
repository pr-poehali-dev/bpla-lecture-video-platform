import { useState, useEffect } from "react";
import { api, FileItem } from "@/api";
import Icon from "@/components/ui/icon";
import { type User } from "@/App";
import { usePageData } from "@/hooks/usePageData";

const TACMED_CATEGORIES = ["Все", "Первая помощь", "Турникеты и жгуты", "Эвакуация", "Протоколы", "Аптечка"];

const TOURNIQUETS = [
  {
    name: "CAT (Combat Application Tourniquet)",
    type: "Механический, одноручный",
    image: "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/785a66d7-b1b8-4eda-8aca-7206716218e2.jpg",
    badge: "НАТО",
    badgeColor: "#00f5ff",
    desc: "Стандарт армии США и НАТО. Накладывается одной рукой за 60 секунд. Ветрошпиль с защёлкой фиксирует давление. Работает при температурах от −50°C до +65°C.",
    apply: "Наложить петлю выше раны на 5–7 см. Затянуть свободный конец. Вращать ветрошпиль до остановки кровотечения. Зафиксировать, записать время.",
    pros: ["Одноручное наложение", "Надёжная фиксация ветрошпиля", "Стандарт НАТО"],
    cons: ["Требует обучения", "Не применяется на шее/животе"],
  },
  {
    name: "SOFTT-W (Special Operations Forces Tactical Tourniquet Wide)",
    type: "Механический, широкий",
    image: "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/90cb1dce-2a13-4226-ac1d-e689f7640a10.jpg",
    badge: "SOFTT",
    badgeColor: "#00ff88",
    desc: "Широкая манжета (3,8 см) обеспечивает равномерное давление. Металлический ветрошпиль. Применяется при ранениях высокого бедра и плеча, где CAT неэффективен.",
    apply: "Надеть петлю, затянуть ремень. Вращать металлический ветрошпиль. Закрепить конец ветрошпиля в держателе. Зафиксировать время.",
    pros: ["Широкая манжета", "Металлический ветрошпиль прочнее", "Эффективен на бедре"],
    cons: ["Сложнее наложить одной рукой", "Больший размер"],
  },
  {
    name: "SAM XT",
    type: "Механический, нового поколения",
    image: "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/4521ad28-5ab5-4da1-8573-9678991308f6.jpg",
    badge: "NEW GEN",
    badgeColor: "#ffbe32",
    desc: "Разработан для улучшения эффективности остановки кровотечения. Имеет встроенный индикатор давления (STOP-LOK) и широкую манжету. Одобрен FDA, используется ВС США.",
    apply: "Обернуть вокруг конечности. Продеть конец в пряжку. Затянуть до упора. Активировать STOP-LOK механизм. Записать время.",
    pros: ["Встроенный индикатор давления", "Быстрее CAT на 20%", "Широкая манжета"],
    cons: ["Менее распространён", "Выше стоимость"],
  },
  {
    name: "Пневматический жгут",
    type: "Пневматический (надувной)",
    image: "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/d77b7ddf-17ad-4c5d-bbfc-471b1d774402.jpg",
    badge: "ПНЕВМО",
    badgeColor: "#a855f7",
    desc: "Надувная манжета обеспечивает равномерное давление по всей поверхности. Минимальный риск повреждения тканей. Применяется при обширных травмах конечностей и в хирургии.",
    apply: "Надеть манжету выше раны. Подключить насос. Накачать до давления 250–300 мм рт. ст. для ноги, 150–200 для руки. Зафиксировать время.",
    pros: ["Равномерное давление", "Меньше повреждений тканей", "Контроль давления"],
    cons: ["Требует насос", "Больший вес и объём", "Сложнее в боевых условиях"],
  },
];

const FIRST_AID_KITS = [
  {
    name: "IFAK (Individual First Aid Kit)",
    level: "Индивидуальный",
    image: "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/583cad05-2987-477b-aea0-43b82d7a226f.jpg",
    badge: "ИАК",
    badgeColor: "#00f5ff",
    desc: "Носимый боевым военнослужащим минимальный комплект для само- и взаимопомощи. Стандарт армии США. Размещается на бронежилете или разгрузке в быстроизвлекаемом подсумке.",
    contents: ["CAT турникет (×2)", "Израильский бандаж 6\"", "Гемостатическая марля Combat Gauze", "Носовой воздуховод NPA", "Перчатки нитриловые (×2 пары)", "Декомпрессионная игла 14G", "Маркер для записи времени"],
    who: "Каждый боец",
    weight: "~400–600 г",
  },
  {
    name: "AFAK (Advanced First Aid Kit)",
    level: "Расширенный",
    image: "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/ffd8e564-45cb-482a-bd1f-6fcf7172adc1.jpg",
    badge: "АФАК",
    badgeColor: "#00ff88",
    desc: "Расширенный комплект для медика звена (Combat Medic / Pararescue). Содержит средства для проведения расширенных мероприятий TACEVAC. Размещается в тактическом рюкзаке.",
    contents: ["Всё из IFAK", "Хирургические ножницы", "Зонд для ранений", "Chest seal (окклюзионный пластырь) ×2", "Система для в/в доступа", "Физраствор 500 мл", "Кровоостанавливающий жгут SOFTT-W", "ЭКГ-электроды", "Налоксон"],
    who: "Медик отделения/взвода",
    weight: "~2–4 кг",
  },
  {
    name: "Гражданская аптечка первой помощи",
    level: "Гражданский",
    image: "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/ee1a615c-8181-494a-bbd9-335518ba067c.jpg",
    badge: "BASE",
    badgeColor: "#ffbe32",
    desc: "Базовый комплект для оказания первой помощи в гражданских условиях. Соответствует требованиям Приказа Минздрава РФ. Обязателен в автомобиле, на предприятии и в общественных местах.",
    contents: ["Жгут кровоостанавливающий", "Бинты стерильные (×3)", "Вата медицинская", "Лейкопластырь (рулонный + бактерицидный)", "Перчатки латексные", "Ножницы медицинские", "Маска для ИВЛ", "Антисептик (йод, зелёнка)"],
    who: "Каждый гражданин",
    weight: "~200–400 г",
  },
];

const MIME_LABELS: Record<string, { label: string; color: string }> = {
  "application/pdf": { label: "PDF", color: "#ff6b00" },
  "text/plain": { label: "TXT", color: "#00ff88" },
  "application/msword": { label: "DOC", color: "#2b7fff" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOCX", color: "#2b7fff" },
  "application/vnd.ms-powerpoint": { label: "PPT", color: "#ff6b00" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { label: "PPTX", color: "#ff6b00" },
};

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function DocViewerModal({ file, onClose, canDownload }: { file: FileItem; onClose: () => void; canDownload: boolean }) {
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
        style={{ border: "1px solid #00ff88", boxShadow: "0 0 40px rgba(0,255,136,0.15)", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="font-mono text-xs px-2 py-0.5 flex-shrink-0"
              style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88" }}
            >
              {MIME_LABELS[file.mime_type]?.label || "DOC"}
            </span>
            <span className="font-mono text-sm text-white truncate">{file.title}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {canDownload && (
              <a
                href={file.cdn_url}
                download={file.original_name}
                className="font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex items-center gap-1"
              >
                <Icon name="Download" size={14} />
                Скачать
              </a>
            )}
            <button onClick={onClose} className="text-[#3a5570] hover:text-[#00ff88]">
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden" style={{ background: "#050810", minHeight: 0 }}>
          {isPdf ? (
            <iframe
              src={`${file.cdn_url}#toolbar=1`}
              className="w-full h-full"
              style={{ minHeight: "70vh", border: "none" }}
              title={file.title}
            />
          ) : isTxt ? (
            <TxtViewer url={file.cdn_url} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <Icon name="FileText" size={48} className="text-[#3a5570]" />
              <div className="font-mono text-sm text-[#3a5570] text-center">
                Формат {MIME_LABELS[file.mime_type]?.label || "документа"} не поддерживает предпросмотр
              </div>
              {canDownload ? (
                <a
                  href={file.cdn_url}
                  download={file.original_name}
                  className="font-mono text-xs px-4 py-2 transition-all"
                  style={{ border: "1px solid #00ff88", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}
                >
                  СКАЧАТЬ ФАЙЛ
                </a>
              ) : (
                <div className="font-mono text-xs text-[#3a5570]">Скачивание недоступно для курсантов</div>
              )}
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

  if (text === null) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ minHeight: "60vh" }}>
      <pre className="font-mono text-xs text-[#8899aa] whitespace-pre-wrap leading-relaxed">{text}</pre>
    </div>
  );
}

interface Props {
  user: User | null;
}

export default function TacmedPage({ user }: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [viewing, setViewing] = useState<FileItem | null>(null);
  const [equipTab, setEquipTab] = useState<"tourniquets" | "kits">("tourniquets");

  const canDownload = !user || user.is_admin || user.role !== "курсант";

  useEffect(() => {
    api.files.list("document", undefined, "tacmed").then((res) => {
      setFiles(res.files || []);
      setLoading(false);
    }).catch(() => {
      api.files.list("document").then((res) => {
        const all: FileItem[] = res.files || [];
        setFiles(all.filter((f) => f.section === "tacmed" || f.category === "tacmed"));
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const { header } = usePageData("tacmed");
  const categories = header?.categories ?? TACMED_CATEGORIES;

  const filtered = activeCategory === "Все"
    ? files
    : files.filter((f) => f.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {viewing && <DocViewerModal file={viewing} onClose={() => setViewing(null)} canDownload={canDownload} />}

      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">{header?.subtitle ?? "// ТАКТИЧЕСКАЯ МЕДИЦИНА"}</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-5 sm:mb-6 tracking-wider">{header?.title ?? "ТАК МЕД"}</h1>

      {/* ── Вкладки: Жгуты / Аптечки ── */}
      <div className="mb-8">
        <div className="flex items-center gap-0 mb-6" style={{ borderBottom: "1px solid rgba(0,245,255,0.12)" }}>
          {([
            { key: "tourniquets", label: "ЖГУТЫ", icon: "Activity", color: "#00f5ff" },
            { key: "kits", label: "АПТЕЧКИ", icon: "Cross", color: "#00ff88" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setEquipTab(tab.key)}
              className="flex items-center gap-2 px-5 py-3 font-mono text-xs tracking-wider transition-all"
              style={{
                color: equipTab === tab.key ? tab.color : "#3a5570",
                borderBottom: equipTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent",
                background: equipTab === tab.key ? `${tab.color}08` : "transparent",
                marginBottom: -1,
              }}
            >
              <Icon name={tab.icon} size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Вкладка: Жгуты */}
        {equipTab === "tourniquets" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOURNIQUETS.map((t) => (
              <div key={t.name} className="flex flex-col overflow-hidden transition-all hover:border-[rgba(0,245,255,0.3)]"
                style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,7,14,0.8)" }}>
                <div className="relative h-48 overflow-hidden flex-shrink-0">
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(4,7,14,0.95))" }} />
                  <span className="absolute top-3 left-3 font-mono text-[10px] px-2 py-0.5 font-bold"
                    style={{ background: `${t.badgeColor}22`, border: `1px solid ${t.badgeColor}60`, color: t.badgeColor }}>
                    {t.badge}
                  </span>
                  <span className="absolute top-3 right-3 font-mono text-[10px] px-2 py-0.5"
                    style={{ background: "rgba(4,7,14,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#5a7a95" }}>
                    {t.type}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <h3 className="font-orbitron text-sm font-bold text-white leading-tight">{t.name}</h3>
                  <p className="font-plex text-sm text-[#8aacbf] leading-relaxed">{t.desc}</p>
                  <div className="p-3" style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.1)" }}>
                    <div className="font-mono text-[10px] text-[#00f5ff] tracking-wider mb-1.5">// ПОРЯДОК НАЛОЖЕНИЯ</div>
                    <p className="font-plex text-xs text-[#7a9ab5] leading-relaxed">{t.apply}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="font-mono text-[10px] text-[#00ff88] mb-1">✓ ПЛЮСЫ</div>
                      {t.pros.map(p => <div key={p} className="font-plex text-xs text-[#5a8a6a] leading-snug">· {p}</div>)}
                    </div>
                    <div>
                      <div className="font-mono text-[10px] text-[#ff6b00] mb-1">✗ МИНУСЫ</div>
                      {t.cons.map(c => <div key={c} className="font-plex text-xs text-[#7a5040] leading-snug">· {c}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Вкладка: Аптечки */}
        {equipTab === "kits" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FIRST_AID_KITS.map((kit) => (
              <div key={kit.name} className="flex flex-col overflow-hidden transition-all hover:border-[rgba(0,255,136,0.3)]"
                style={{ border: "1px solid rgba(0,255,136,0.12)", background: "rgba(4,7,14,0.8)" }}>
                <div className="relative h-44 overflow-hidden flex-shrink-0">
                  <img src={kit.image} alt={kit.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(4,7,14,0.97))" }} />
                  <span className="absolute top-3 left-3 font-mono text-[10px] px-2 py-0.5 font-bold"
                    style={{ background: `${kit.badgeColor}22`, border: `1px solid ${kit.badgeColor}60`, color: kit.badgeColor }}>
                    {kit.badge}
                  </span>
                  <span className="absolute top-3 right-3 font-mono text-[10px] px-2 py-0.5"
                    style={{ background: "rgba(4,7,14,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#5a7a95" }}>
                    {kit.level}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="font-orbitron text-sm font-bold text-white leading-tight">{kit.name}</h3>
                  <p className="font-plex text-sm text-[#8aacbf] leading-relaxed">{kit.desc}</p>
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-[#00ff88] tracking-wider mb-2">// СОСТАВ</div>
                    <div className="flex flex-col gap-1">
                      {kit.contents.map(item => (
                        <div key={item} className="flex items-start gap-1.5">
                          <span className="text-[#00ff88] text-[10px] mt-0.5 flex-shrink-0">▸</span>
                          <span className="font-plex text-xs text-[#6a8fa8] leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2"
                    style={{ borderTop: "1px solid rgba(0,255,136,0.08)" }}>
                    <div>
                      <div className="font-mono text-[9px] text-[#3a5570]">КТО НОСИТ</div>
                      <div className="font-mono text-[11px] text-[#00ff88]">{kit.who}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[9px] text-[#3a5570]">ВЕС</div>
                      <div className="font-mono text-[11px] text-[#5a7a95]">{kit.weight}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Документы ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 bg-[#3a5570]" />
        <h2 className="font-orbitron text-lg font-bold text-white tracking-wider">МАТЕРИАЛЫ И ДОКУМЕНТЫ</h2>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="font-mono text-xs px-3 py-1.5 transition-all"
            style={{
              border: `1px solid ${activeCategory === cat ? "#00ff88" : "#1a2a3a"}`,
              color: activeCategory === cat ? "#00ff88" : "#3a5570",
              background: activeCategory === cat ? "rgba(0,255,136,0.05)" : "transparent",
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
          <Icon name="HeartPulse" size={32} className="text-[#3a5570] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570] tracking-widest">МАТЕРИАЛЫ НЕ НАЙДЕНЫ</div>
          <div className="font-mono text-xs text-[#1a2a3a] mt-1">Администратор ещё не добавил материалы по тактической медицине</div>
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
                className="flex md:grid items-center gap-3 px-4 py-3 transition-all cursor-pointer group flex-wrap"
                style={{
                  gridTemplateColumns: "auto 1fr auto auto auto",
                  gap: "1rem",
                  borderBottom: "1px solid #0d1a27",
                  background: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,255,136,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => setViewing(file)}
              >
                <span className="font-mono text-xs text-[#1a2a3a] w-6 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>

                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                    style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}40`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs text-white truncate group-hover:text-[#00ff88] transition-colors">
                    {file.title}
                  </span>
                </div>

                <span className="font-mono text-xs text-[#3a5570] hidden md:block flex-shrink-0">
                  {file.category || "—"}
                </span>
                <span className="font-mono text-xs text-[#3a5570] hidden md:block flex-shrink-0">
                  {formatSize(file.size)}
                </span>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewing(file); }}
                    className="font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex items-center gap-1"
                  >
                    <Icon name="Eye" size={13} />
                    <span className="hidden md:inline">Открыть</span>
                  </button>
                  {canDownload && (
                    <a
                      href={file.cdn_url}
                      download={file.original_name}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex items-center gap-1"
                    >
                      <Icon name="Download" size={13} />
                      <span className="hidden md:inline">Скачать</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";

interface Page { id: number; slug: string; title: string; is_system: boolean; is_visible: boolean; sort_order: number; }
interface Block { id: number; type: string; sort_order: number; data: unknown; }

const BLOCK_TYPES = [
  { type: "hero", label: "Герой (главный баннер)" },
  { type: "stats", label: "Статистика (цифры)" },
  { type: "features", label: "Карточки разделов" },
  { type: "cta", label: "Призыв к действию" },
  { type: "text", label: "Текстовый блок" },
  { type: "intro-video", label: "Интро-видео" },
];

const BLOCK_LABELS: Record<string, string> = {
  hero: "Главный баннер", stats: "Статистика", features: "Карточки разделов", cta: "Призыв к действию",
  text: "Текст", header: "Заголовок страницы", "drone-list": "Список дронов", rules: "Правила платформы",
  "rules-header": "Вводный и завершающий текст правил", "intro-video": "Интро-видео",
};

function HeroEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
  const f = (key: string) => (
    <div key={key}>
      <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">{key}</label>
      <input
        className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-plex text-sm text-white outline-none focus:border-[#00f5ff] transition-colors"
        value={data[key] ?? ""}
        onChange={e => onChange({ ...data, [key]: e.target.value })}
      />
    </div>
  );
  return (
    <div className="space-y-3">
      {["sysLabel","title1","title2","title3","subtitle","btn1Label","btn1Page","btn2Label","btn2Page"].map(f)}
    </div>
  );
}

function StatsEditor({ data, onChange }: { data: { value: string; label: string; icon: string }[]; onChange: (d: unknown) => void }) {
  const update = (i: number, key: string, val: string) => {
    const next = data.map((item, idx) => idx === i ? { ...item, [key]: val } : item);
    onChange(next);
  };
  const add = () => onChange([...data, { value: "0", label: "Метрика", icon: "BarChart" }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="p-3 space-y-2" style={{ border: "1px solid #1a2a3a" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-[#3a5570]">МЕТРИКА {i + 1}</span>
            <button onClick={() => remove(i)} className="text-[#ff2244] hover:text-red-400"><Icon name="X" size={12} /></button>
          </div>
          {["value","label","icon"].map(key => (
            <div key={key}>
              <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">{key}</label>
              <input className="w-full bg-transparent border border-[#1a2a3a] px-3 py-1.5 font-plex text-sm text-white outline-none focus:border-[#00f5ff]"
                value={(item as Record<string, string>)[key] ?? ""} onChange={e => update(i, key, e.target.value)} />
            </div>
          ))}
        </div>
      ))}
      <button onClick={add} className="font-mono text-xs text-[#00ff88] border border-[rgba(0,255,136,0.3)] px-3 py-1.5 hover:bg-[rgba(0,255,136,0.05)]">
        + Добавить метрику
      </button>
    </div>
  );
}

function FeaturesEditor({ data, onChange }: { data: { icon: string; title: string; desc: string; page: string }[]; onChange: (d: unknown) => void }) {
  const update = (i: number, key: string, val: string) => {
    const next = data.map((item, idx) => idx === i ? { ...item, [key]: val } : item);
    onChange(next);
  };
  const add = () => onChange([...data, { icon: "Star", title: "Раздел", desc: "Описание", page: "home" }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="p-3 space-y-2" style={{ border: "1px solid #1a2a3a" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-[#3a5570]">КАРТОЧКА {i + 1}</span>
            <button onClick={() => remove(i)} className="text-[#ff2244] hover:text-red-400"><Icon name="X" size={12} /></button>
          </div>
          {["icon","title","desc","page"].map(key => (
            <div key={key}>
              <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">{key}</label>
              <input className="w-full bg-transparent border border-[#1a2a3a] px-3 py-1.5 font-plex text-sm text-white outline-none focus:border-[#00f5ff]"
                value={(item as Record<string, string>)[key] ?? ""} onChange={e => update(i, key, e.target.value)} />
            </div>
          ))}
        </div>
      ))}
      <button onClick={add} className="font-mono text-xs text-[#00ff88] border border-[rgba(0,255,136,0.3)] px-3 py-1.5 hover:bg-[rgba(0,255,136,0.05)]">
        + Добавить карточку
      </button>
    </div>
  );
}

function CtaEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
  return (
    <div className="space-y-3">
      {["label","title","subtitle","btnLabel","btnPage"].map(key => (
        <div key={key}>
          <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">{key}</label>
          <input className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-plex text-sm text-white outline-none focus:border-[#00f5ff]"
            value={data[key] ?? ""} onChange={e => onChange({ ...data, [key]: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

function IntroVideoEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">Ссылка на видео (YouTube / прямая ссылка)</label>
        <input className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-plex text-sm text-white outline-none focus:border-[#00f5ff]"
          value={data.url ?? ""} onChange={e => onChange({ ...data, url: e.target.value })}
          placeholder="https://www.youtube.com/embed/... или https://..." />
        <p className="font-mono text-[10px] text-[#3a5570] mt-1">Для YouTube используй ссылку вида: youtube.com/embed/VIDEO_ID</p>
      </div>
      <div>
        <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">Подпись (необязательно)</label>
        <input className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-plex text-sm text-white outline-none focus:border-[#00f5ff]"
          value={data.caption ?? ""} onChange={e => onChange({ ...data, caption: e.target.value })}
          placeholder="Краткое описание видео" />
      </div>
    </div>
  );
}

function TextEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">Заголовок</label>
        <input className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-plex text-sm text-white outline-none focus:border-[#00f5ff]"
          value={data.title ?? ""} onChange={e => onChange({ ...data, title: e.target.value })} />
      </div>
      <div>
        <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">Содержимое</label>
        <textarea rows={5} className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-plex text-sm text-white outline-none focus:border-[#00f5ff] resize-none"
          value={data.content ?? ""} onChange={e => onChange({ ...data, content: e.target.value })} />
      </div>
    </div>
  );
}

interface RuleItem { num: string; title: string; text: string; }

function RulesEditor({ data, onChange }: { data: RuleItem[]; onChange: (d: unknown) => void }) {
  const update = (i: number, key: string, val: string) => {
    onChange(data.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  };
  const add = () => {
    const num = String(data.length + 1).padStart(2, "0");
    onChange([...data, { num, title: "Новый пункт", text: "Описание правила" }]);
  };
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {data.map((rule, i) => (
        <div key={i} className="p-3 space-y-2" style={{ border: "1px solid #1a2a3a" }}>
          <div className="flex items-center justify-between">
            <span className="font-orbitron text-xs font-bold" style={{ color: "#00f5ff", opacity: 0.5 }}>{rule.num}</span>
            <button onClick={() => remove(i)} className="text-[#3a5570] hover:text-[#ff2244]"><Icon name="X" size={12} /></button>
          </div>
          <div>
            <label className="font-mono text-[10px] text-[#3a5570] block mb-0.5">Номер (01, 02...)</label>
            <input className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1 font-mono text-xs text-white outline-none focus:border-[#00f5ff]"
              value={rule.num} onChange={e => update(i, "num", e.target.value)} />
          </div>
          <div>
            <label className="font-mono text-[10px] text-[#3a5570] block mb-0.5">Заголовок</label>
            <input className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1 font-plex text-sm text-white outline-none focus:border-[#00f5ff]"
              value={rule.title} onChange={e => update(i, "title", e.target.value)} />
          </div>
          <div>
            <label className="font-mono text-[10px] text-[#3a5570] block mb-0.5">Текст</label>
            <textarea rows={3} className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1 font-plex text-xs text-white outline-none focus:border-[#00f5ff] resize-none"
              value={rule.text} onChange={e => update(i, "text", e.target.value)} />
          </div>
        </div>
      ))}
      <button onClick={add} className="font-mono text-xs text-[#00ff88] border border-[rgba(0,255,136,0.3)] px-3 py-1.5 hover:bg-[rgba(0,255,136,0.05)]">
        + Добавить пункт
      </button>
    </div>
  );
}

function HeaderEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: unknown) => void }) {
  const cats = Array.isArray(data.categories) ? (data.categories as string[]) : [];
  const setCats = (arr: string[]) => onChange({ ...data, categories: arr });
  return (
    <div className="space-y-3">
      {["title", "subtitle"].map(key => (
        <div key={key}>
          <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">{key}</label>
          <input className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-plex text-sm text-white outline-none focus:border-[#00f5ff]"
            value={(data[key] as string) ?? ""} onChange={e => onChange({ ...data, [key]: e.target.value })} />
        </div>
      ))}
      <div>
        <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-2">Категории (каждая с новой строки)</label>
        <textarea rows={5} className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#00f5ff] resize-none"
          value={cats.join("\n")}
          onChange={e => setCats(e.target.value.split("\n").map(s => s.trim()).filter(Boolean))} />
      </div>
    </div>
  );
}

interface DroneItem { id: number; code: string; name: string; category: string; range: string; payload: string; speed: string; endurance: string; emoji: string; color: string; description: string; tags: string[]; }

function DroneListEditor({ data, onChange }: { data: DroneItem[]; onChange: (d: unknown) => void }) {
  const update = (i: number, key: string, val: string) => {
    onChange(data.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  };
  const updateTags = (i: number, val: string) => {
    onChange(data.map((item, idx) => idx === i ? { ...item, tags: val.split(",").map(t => t.trim()).filter(Boolean) } : item));
  };
  const add = () => onChange([...data, { id: Date.now(), code: `TYPE-0${data.length + 1}`, name: "Новый тип", category: "Разведка", range: "0", payload: "0", speed: "0", endurance: "0", emoji: "✈️", color: "#00f5ff", description: "Описание", tags: [] }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const DRONE_FIELDS: { key: string; label: string }[] = [
    { key: "code", label: "Код" }, { key: "name", label: "Название" }, { key: "category", label: "Категория" },
    { key: "range", label: "Дальность" }, { key: "payload", label: "Нагрузка" }, { key: "speed", label: "Скорость" },
    { key: "endurance", label: "Время полёта" }, { key: "emoji", label: "Эмодзи" }, { key: "color", label: "Цвет (#hex)" }, { key: "description", label: "Описание" },
  ];
  return (
    <div className="space-y-4">
      {data.map((drone, i) => (
        <div key={drone.id} className="p-3 space-y-2" style={{ border: "1px solid #1a2a3a" }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px]" style={{ color: drone.color }}>{drone.emoji} {drone.name}</span>
            <button onClick={() => remove(i)} className="text-[#3a5570] hover:text-[#ff2244]"><Icon name="X" size={12} /></button>
          </div>
          {DRONE_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="font-mono text-[10px] text-[#3a5570] block mb-0.5">{label}</label>
              {key === "description"
                ? <textarea rows={2} className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1 font-plex text-xs text-white outline-none focus:border-[#00f5ff] resize-none"
                    value={(drone as unknown as Record<string, string>)[key] ?? ""} onChange={e => update(i, key, e.target.value)} />
                : <input className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1 font-plex text-xs text-white outline-none focus:border-[#00f5ff]"
                    value={(drone as unknown as Record<string, string>)[key] ?? ""} onChange={e => update(i, key, e.target.value)} />
              }
            </div>
          ))}
          <div>
            <label className="font-mono text-[10px] text-[#3a5570] block mb-0.5">Теги (через запятую)</label>
            <input className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1 font-plex text-xs text-white outline-none focus:border-[#00f5ff]"
              value={drone.tags.join(", ")} onChange={e => updateTags(i, e.target.value)} />
          </div>
        </div>
      ))}
      <button onClick={add} className="font-mono text-xs text-[#00ff88] border border-[rgba(0,255,136,0.3)] px-3 py-1.5 hover:bg-[rgba(0,255,136,0.05)]">
        + Добавить тип дрона
      </button>
    </div>
  );
}

function BlockEditor({ block, onSave, onDelete }: { block: Block; onSave: (id: number, data: unknown) => Promise<void>; onDelete: (id: number) => void }) {
  const [localData, setLocalData] = useState<unknown>(block.data);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(block.id, localData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderEditor = () => {
    switch (block.type) {
      case "hero": return <HeroEditor data={localData as Record<string, string>} onChange={setLocalData} />;
      case "stats": return <StatsEditor data={localData as { value: string; label: string; icon: string }[]} onChange={setLocalData} />;
      case "features": return <FeaturesEditor data={localData as { icon: string; title: string; desc: string; page: string }[]} onChange={setLocalData} />;
      case "cta": return <CtaEditor data={localData as Record<string, string>} onChange={setLocalData} />;
      case "text": return <TextEditor data={localData as Record<string, string>} onChange={setLocalData} />;
      case "intro-video": return <IntroVideoEditor data={localData as Record<string, string>} onChange={setLocalData} />;
      case "header": return <HeaderEditor data={localData as Record<string, unknown>} onChange={setLocalData} />;
      case "drone-list": return <DroneListEditor data={localData as DroneItem[]} onChange={setLocalData} />;
      case "rules": return <RulesEditor data={localData as RuleItem[]} onChange={setLocalData} />;
      case "rules-header": return (
        <div className="space-y-3">
          {["intro", "footer"].map(key => (
            <div key={key}>
              <label className="font-mono text-[10px] text-[#3a5570] uppercase tracking-widest block mb-1">
                {key === "intro" ? "Вводный текст (вверху)" : "Нижний текст (внизу)"}
              </label>
              <textarea rows={4} className="w-full bg-transparent border border-[#1a2a3a] px-3 py-2 font-plex text-sm text-white outline-none focus:border-[#00f5ff] resize-none"
                value={(localData as Record<string, string>)[key] ?? ""}
                onChange={e => setLocalData({ ...(localData as Record<string, string>), [key]: e.target.value })} />
            </div>
          ))}
        </div>
      );
      default: return <pre className="font-mono text-xs text-[#5a7a95] overflow-auto">{JSON.stringify(localData, null, 2)}</pre>;
    }
  };

  return (
    <div className="p-4 space-y-4" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#070d18" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4" style={{ background: "#00f5ff" }} />
          <span className="font-mono text-xs text-white tracking-wider">{BLOCK_LABELS[block.type] ?? block.type}</span>
        </div>
        <button onClick={() => onDelete(block.id)} className="font-mono text-[10px] text-[#3a5570] hover:text-[#ff2244] transition-colors flex items-center gap-1">
          <Icon name="Trash2" size={11} /> удалить
        </button>
      </div>
      {renderEditor()}
      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 font-mono text-xs px-4 py-2 transition-all disabled:opacity-50"
        style={{ border: "1px solid rgba(0,245,255,0.3)", color: saved ? "#00ff88" : "#00f5ff", background: saved ? "rgba(0,255,136,0.05)" : "rgba(0,245,255,0.04)" }}>
        {saving ? <><Icon name="Loader" size={11} className="animate-spin" />Сохранение...</> :
          saved ? <><Icon name="Check" size={11} />Сохранено</> :
          <><Icon name="Save" size={11} />Сохранить блок</>}
      </button>
    </div>
  );
}

export default function AdminPagesTab() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const loadPages = async () => {
    const res = await api.admin.getPages();
    if (res.pages) setPages(res.pages.filter((p: Page) => !p.slug.includes("_deleted_")));
    setLoading(false);
  };

  const loadBlocks = async (page: Page) => {
    setBlocksLoading(true);
    const res = await api.admin.getPageBlocks(page.id);
    if (res.blocks) setBlocks(res.blocks.filter((b: Block) => b.sort_order >= 0));
    setBlocksLoading(false);
  };

  useEffect(() => { loadPages(); }, []);

  const selectPage = (page: Page) => {
    setSelectedPage(page);
    loadBlocks(page);
  };

  const createPage = async () => {
    if (!newSlug || !newTitle) return;
    setCreating(true);
    const res = await api.admin.createPage(newSlug, newTitle);
    setCreating(false);
    if (res.id) { flash("Страница создана"); setShowNewPage(false); setNewSlug(""); setNewTitle(""); loadPages(); }
    else flash(res.error || "Ошибка", false);
  };

  const toggleVisible = async (page: Page) => {
    await api.admin.updatePage(page.id, { is_visible: !page.is_visible });
    loadPages();
  };

  const deletePage = async (page: Page) => {
    if (!confirm(`Удалить страницу «${page.title}»?`)) return;
    const res = await api.admin.deletePage(page.id);
    if (res.message) { flash("Страница удалена"); if (selectedPage?.id === page.id) { setSelectedPage(null); setBlocks([]); } loadPages(); }
    else flash(res.error || "Ошибка", false);
  };

  const saveBlock = async (block_id: number, data: unknown) => {
    await api.admin.updateBlock(block_id, data);
  };

  const deleteBlock = async (block_id: number) => {
    if (!confirm("Удалить блок?")) return;
    const res = await api.admin.deleteBlock(block_id);
    if (res.message && selectedPage) loadBlocks(selectedPage);
    else flash(res.error || "Ошибка", false);
  };

  const addBlock = async (type: string) => {
    if (!selectedPage) return;
    setAddingBlock(true);
    const res = await api.admin.addBlock(selectedPage.id, type);
    setAddingBlock(false);
    if (res.block_id) loadBlocks(selectedPage);
    else flash(res.error || "Ошибка", false);
  };

  if (loading) return <div className="text-center py-16 font-mono text-sm text-[#3a5570] tracking-widest">ЗАГРУЗКА...</div>;

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left: pages list */}
      <div className="w-64 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs text-[#00f5ff] tracking-widest">СТРАНИЦЫ</span>
          <button onClick={() => setShowNewPage(!showNewPage)}
            className="font-mono text-[10px] px-2 py-1 transition-all flex items-center gap-1"
            style={{ border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88" }}>
            <Icon name="Plus" size={10} /> НОВАЯ
          </button>
        </div>

        {showNewPage && (
          <div className="p-3 space-y-2 mb-3" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "#0a1520" }}>
            <input placeholder="slug (напр. about)" value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-[#00f5ff]" />
            <input placeholder="Название" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1.5 font-plex text-sm text-white outline-none focus:border-[#00f5ff]" />
            <button onClick={createPage} disabled={creating || !newSlug || !newTitle}
              className="w-full font-mono text-xs py-1.5 disabled:opacity-40 transition-all"
              style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
              {creating ? "Создание..." : "Создать"}
            </button>
          </div>
        )}

        {pages.map(page => (
          <div key={page.id}
            className="group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all"
            style={{
              border: selectedPage?.id === page.id ? "1px solid rgba(0,245,255,0.4)" : "1px solid rgba(0,245,255,0.08)",
              background: selectedPage?.id === page.id ? "rgba(0,245,255,0.06)" : "transparent",
            }}
            onClick={() => selectPage(page)}
          >
            <div className="min-w-0">
              <div className="font-plex text-sm text-white truncate">{page.title}</div>
              <div className="font-mono text-[10px] text-[#3a5570]">/{page.slug}</div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button title={page.is_visible ? "Скрыть" : "Показать"} onClick={() => toggleVisible(page)}
                className={page.is_visible ? "text-[#00ff88]" : "text-[#3a5570]"}>
                <Icon name={page.is_visible ? "Eye" : "EyeOff"} size={12} />
              </button>
              {!page.is_system && (
                <button title="Удалить" onClick={() => deletePage(page)} className="text-[#3a5570] hover:text-[#ff2244]">
                  <Icon name="Trash2" size={12} />
                </button>
              )}
            </div>
          </div>
        ))}

        {msg && (
          <div className="mt-3 p-2 font-mono text-[10px]" style={{
            border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`,
            color: msg.ok ? "#00ff88" : "#ff2244",
          }}>{msg.ok ? "✓" : "✗"} {msg.text}</div>
        )}
      </div>

      {/* Right: block editor */}
      <div className="flex-1 min-w-0">
        {!selectedPage ? (
          <div className="flex items-center justify-center h-full text-center py-20">
            <div>
              <Icon name="Layout" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
              <div className="font-mono text-xs text-[#3a5570]">Выбери страницу слева</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-[#00f5ff] tracking-widest">{selectedPage.title.toUpperCase()}</div>
                <div className="font-mono text-[10px] text-[#3a5570]">/{selectedPage.slug} · {blocks.length} блоков</div>
              </div>
              <div className="flex items-center gap-2">
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type} onClick={() => addBlock(bt.type)} disabled={addingBlock}
                    title={bt.label}
                    className="font-mono text-[10px] px-2 py-1 transition-all disabled:opacity-40"
                    style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#5a7a95" }}>
                    + {bt.type}
                  </button>
                ))}
              </div>
            </div>

            {blocksLoading ? (
              <div className="text-center py-10 font-mono text-xs text-[#3a5570]">ЗАГРУЗКА БЛОКОВ...</div>
            ) : blocks.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="Layers" size={28} className="text-[#1a2a3a] mx-auto mb-2" />
                <div className="font-mono text-xs text-[#3a5570]">Нет блоков. Добавь первый.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map(block => (
                  <BlockEditor key={block.id} block={block} onSave={saveBlock} onDelete={deleteBlock} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
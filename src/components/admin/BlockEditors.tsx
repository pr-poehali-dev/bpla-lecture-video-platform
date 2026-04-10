import Icon from "@/components/ui/icon";

export function HeroEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
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

export function StatsEditor({ data, onChange }: { data: { value: string; label: string; icon: string }[]; onChange: (d: unknown) => void }) {
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

export function FeaturesEditor({ data, onChange }: { data: { icon: string; title: string; desc: string; page: string }[]; onChange: (d: unknown) => void }) {
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

export function CtaEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
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

export function IntroVideoEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
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

export function TextEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
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

export interface RuleItem { num: string; title: string; text: string; }

export function RulesEditor({ data, onChange }: { data: RuleItem[]; onChange: (d: unknown) => void }) {
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

export function HeaderEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: unknown) => void }) {
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

export interface DroneItem { id: number; code: string; name: string; category: string; range: string; payload: string; speed: string; endurance: string; emoji: string; color: string; description: string; tags: string[]; }

const DRONE_FIELDS: { key: string; label: string }[] = [
  { key: "code", label: "Код" }, { key: "name", label: "Название" }, { key: "category", label: "Категория" },
  { key: "range", label: "Дальность" }, { key: "payload", label: "Нагрузка" }, { key: "speed", label: "Скорость" },
  { key: "endurance", label: "Время полёта" }, { key: "emoji", label: "Эмодзи" }, { key: "color", label: "Цвет (#hex)" }, { key: "description", label: "Описание" },
];

export function DroneListEditor({ data, onChange }: { data: DroneItem[]; onChange: (d: unknown) => void }) {
  const update = (i: number, key: string, val: string) => {
    onChange(data.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  };
  const updateTags = (i: number, val: string) => {
    onChange(data.map((item, idx) => idx === i ? { ...item, tags: val.split(",").map(t => t.trim()).filter(Boolean) } : item));
  };
  const add = () => onChange([...data, { id: Date.now(), code: `TYPE-0${data.length + 1}`, name: "Новый тип", category: "Разведка", range: "0", payload: "0", speed: "0", endurance: "0", emoji: "✈️", color: "#00f5ff", description: "Описание", tags: [] }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));

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

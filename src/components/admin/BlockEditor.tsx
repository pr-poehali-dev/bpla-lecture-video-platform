import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  HeroEditor, StatsEditor, FeaturesEditor, CtaEditor, TextEditor,
  IntroVideoEditor, HeaderEditor, DroneListEditor, RulesEditor,
  type RuleItem, type DroneItem,
} from "@/components/admin/BlockEditors";

interface Block { id: number; type: string; sort_order: number; data: unknown; }

export const BLOCK_LABELS: Record<string, string> = {
  hero: "Главный баннер", stats: "Статистика", features: "Карточки разделов", cta: "Призыв к действию",
  text: "Текст", header: "Заголовок страницы", "drone-list": "Список дронов", rules: "Правила платформы",
  "rules-header": "Вводный и завершающий текст правил", "intro-video": "Интро-видео",
};

export default function BlockEditor({ block, onSave, onDelete }: { block: Block; onSave: (id: number, data: unknown) => Promise<void>; onDelete: (id: number) => void }) {
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

import Icon from "@/components/ui/icon";
import { CATEGORIES } from "./DiscTypes";

interface Props {
  form: { title: string; category: string; text: string };
  creating: boolean;
  createError: string;
  onClose: () => void;
  onChange: (form: { title: string; category: string; text: string }) => void;
  onCreate: () => void;
}

export default function DiscCreateModal({ form, creating, createError, onClose, onChange, onCreate }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,8,16,0.95)" }} onClick={onClose}>
      <div className="w-full sm:max-w-lg space-y-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
        style={{ border: "1px solid #00f5ff", background: "#050810", boxShadow: "0 0 40px rgba(0,245,255,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="font-orbitron text-lg font-bold text-white tracking-wider">НОВОЕ ОБСУЖДЕНИЕ</div>
        <div>
          <label className="font-mono text-xs text-[#3a5570] block mb-1">ЗАГОЛОВОК *</label>
          <input
            className="w-full bg-transparent font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
            style={{ border: "1px solid #1a2a3a" }}
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="Тема обсуждения"
            autoFocus
          />
        </div>
        <div>
          <label className="font-mono text-xs text-[#3a5570] block mb-1">КАТЕГОРИЯ</label>
          <select
            className="w-full bg-[#0a1520] font-mono text-sm text-white px-3 py-2 outline-none"
            style={{ border: "1px solid #1a2a3a" }}
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono text-xs text-[#3a5570] block mb-1">ПЕРВОЕ СООБЩЕНИЕ</label>
          <textarea
            className="w-full bg-transparent font-mono text-sm text-white px-3 py-2 outline-none resize-none"
            style={{ border: "1px solid #1a2a3a" }}
            rows={4}
            value={form.text}
            onChange={(e) => onChange({ ...form, text: e.target.value })}
            placeholder="Поддерживается форматирование: **жирный**, `код`, ```блок кода```"
          />
        </div>
        {createError && <div className="font-mono text-xs text-[#ff2244]">{createError}</div>}
        <div className="flex gap-3">
          <button onClick={onCreate} disabled={creating} className="btn-neon flex items-center gap-2 disabled:opacity-50">
            {creating ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
            {creating ? "СОЗДАНИЕ..." : "СОЗДАТЬ"}
          </button>
          <button onClick={onClose} className="font-mono text-xs px-4 py-2 text-[#3a5570]" style={{ border: "1px solid #1a2a3a" }}>ОТМЕНА</button>
        </div>
      </div>
    </div>
  );
}

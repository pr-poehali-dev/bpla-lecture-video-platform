import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import ConfirmModal from "./ConfirmModal";

interface DroneType {
  id: number;
  code: string;
  name: string;
  category: string;
  range_val: string;
  payload: string;
  speed: string;
  endurance: string;
  emoji: string;
  color: string;
  description: string;
  tags: string[];
  sort_order: number;
  is_visible: boolean;
}

const COLORS = ["#ff2244","#00f5ff","#00ff88","#ff6b00","#a855f7","#f59e0b","#3b82f6","#ec4899"];
const EMOJIS = ["🚁","💥","🔍","📦","✈️","👁️","📡","⚡","🎯","🛸"];

const EMPTY: Omit<DroneType, "id" | "sort_order" | "is_visible"> = {
  code: "", name: "", category: "", range_val: "—", payload: "—",
  speed: "—", endurance: "—", emoji: "🚁", color: "#00f5ff",
  description: "", tags: [],
};

export default function AdminDronesTab() {
  const [drones, setDrones] = useState<DroneType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DroneType | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DroneType | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const load = () => {
    setLoading(true);
    api.drones.list(true).then(res => {
      setDrones(res.drones || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ ...EMPTY });
    setTagsInput("");
    setEditing(null);
    setIsNew(true);
  };

  const openEdit = (d: DroneType) => {
    setForm({
      code: d.code, name: d.name, category: d.category,
      range_val: d.range_val, payload: d.payload,
      speed: d.speed, endurance: d.endurance,
      emoji: d.emoji, color: d.color, description: d.description,
      tags: d.tags || [],
    });
    setTagsInput((d.tags || []).join(", "));
    setEditing(d);
    setIsNew(false);
  };

  const closeForm = () => { setEditing(null); setIsNew(false); };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      showMsg("Код и название обязательны", false);
      return;
    }
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    setSaving(true);
    let res;
    if (isNew) {
      res = await api.drones.create({ ...form, tags });
    } else if (editing) {
      res = await api.drones.update({ id: editing.id, ...form, tags });
    }
    setSaving(false);
    if (res?.error) { showMsg(res.error, false); return; }
    showMsg(res?.message || "Сохранено");
    closeForm();
    load();
  };

  const handleToggleVisible = async (d: DroneType) => {
    await api.drones.update({ id: d.id, is_visible: !d.is_visible });
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await api.drones.delete(deleteTarget.id);
    setDeleteTarget(null);
    if (res.error) { showMsg(res.error, false); return; }
    showMsg("Тип удалён");
    load();
  };

  const f = (field: keyof typeof EMPTY, val: string) => setForm(p => ({ ...p, [field]: val }));

  const showForm = isNew || !!editing;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-orbitron text-base font-bold text-white">Типы БпЛА</div>
          <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">Управление каталогом беспилотников · {drones.length} типов</div>
        </div>
        {!showForm && (
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold transition-all"
            style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}>
            <Icon name="Plus" size={13} /> ДОБАВИТЬ ТИП
          </button>
        )}
      </div>

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="p-5 space-y-4" style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(4,7,14,0.8)" }}>
          <div className="flex items-center justify-between">
            <div className="font-orbitron text-sm font-bold text-[#00f5ff]">{isNew ? "НОВЫЙ ТИП" : `РЕДАКТИРОВАНИЕ: ${editing?.name}`}</div>
            <button onClick={closeForm} className="text-[#3a5570] hover:text-white transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">КОД *</label>
              <input value={form.code} onChange={e => f("code", e.target.value.toUpperCase())} placeholder="TYPE-07"
                className="w-full bg-transparent px-3 py-2 font-mono text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">НАЗВАНИЕ *</label>
              <input value={form.name} onChange={e => f("name", e.target.value)} placeholder="Название типа"
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">КАТЕГОРИЯ</label>
              <input value={form.category} onChange={e => f("category", e.target.value)} placeholder="Ударный / Разведка / ..."
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ДАЛЬНОСТЬ</label>
              <input value={form.range_val} onChange={e => f("range_val", e.target.value)} placeholder="5-10 км"
                className="w-full bg-transparent px-3 py-2 font-mono text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">НАГРУЗКА</label>
              <input value={form.payload} onChange={e => f("payload", e.target.value)} placeholder="0.3-1.5 кг"
                className="w-full bg-transparent px-3 py-2 font-mono text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">СКОРОСТЬ</label>
              <input value={form.speed} onChange={e => f("speed", e.target.value)} placeholder="120-200 км/ч"
                className="w-full bg-transparent px-3 py-2 font-mono text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ВРЕМЯ В ВОЗДУХЕ</label>
              <input value={form.endurance} onChange={e => f("endurance", e.target.value)} placeholder="8-20 мин"
                className="w-full bg-transparent px-3 py-2 font-mono text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ТЕГИ (через запятую)</label>
              <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Ударный, FPV, Одноразовый"
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
            </div>
          </div>

          {/* Emoji + color pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-2">ЭМОДЗИ</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => f("emoji", e)}
                    className="w-9 h-9 flex items-center justify-center text-lg transition-all"
                    style={{ border: `1px solid ${form.emoji === e ? "rgba(0,245,255,0.5)" : "rgba(0,245,255,0.1)"}`, background: form.emoji === e ? "rgba(0,245,255,0.1)" : "transparent" }}>
                    {e}
                  </button>
                ))}
                <input value={form.emoji} onChange={e => f("emoji", e.target.value)}
                  className="w-9 h-9 bg-transparent px-1 text-center font-mono text-lg text-white outline-none"
                  style={{ border: "1px solid rgba(0,245,255,0.1)" }} placeholder="✏️" maxLength={4} />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-2">ЦВЕТ</label>
              <div className="flex flex-wrap gap-2 items-center">
                {COLORS.map(c => (
                  <button key={c} onClick={() => f("color", c)}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{ background: c, border: form.color === c ? "2px solid white" : "2px solid transparent", boxShadow: form.color === c ? `0 0 8px ${c}` : "none" }} />
                ))}
                <input value={form.color} onChange={e => f("color", e.target.value)}
                  className="w-24 bg-transparent px-2 py-1 font-mono text-xs text-white outline-none"
                  style={{ border: "1px solid rgba(0,245,255,0.2)" }} placeholder="#00f5ff" />
                <div className="w-6 h-6 rounded-full" style={{ background: form.color }} />
              </div>
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ОПИСАНИЕ</label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)}
              rows={3} placeholder="Подробное описание типа БпЛА, его назначения и применения..."
              className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none resize-none"
              style={{ border: "1px solid rgba(0,245,255,0.2)" }} />
          </div>

          {/* Preview */}
          <div className="p-3 flex items-center gap-3" style={{ border: `1px solid ${form.color}30`, background: `${form.color}05` }}>
            <span className="text-2xl">{form.emoji}</span>
            <div>
              <div className="font-mono text-xs" style={{ color: form.color }}>{form.code || "CODE"}</div>
              <div className="font-plex text-sm text-white">{form.name || "Название"}</div>
              <div className="font-mono text-xs text-[#3a5570]">{form.category || "Категория"}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 font-mono text-xs font-bold transition-all disabled:opacity-40"
              style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.08)" }}>
              <Icon name={saving ? "Loader" : "Save"} size={13} className={saving ? "animate-spin" : ""} />
              {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
            </button>
            <button onClick={closeForm}
              className="px-4 py-2 font-mono text-xs text-[#5a7a95] hover:text-white transition-colors"
              style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
              ОТМЕНА
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      ) : drones.length === 0 ? (
        <div className="text-center py-16" style={{ border: "1px solid rgba(0,245,255,0.08)" }}>
          <Icon name="Plane" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570]">Типов БпЛА пока нет</div>
        </div>
      ) : (
        <div className="space-y-2">
          {drones.map((drone, i) => (
            <div key={drone.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s`, background: "rgba(13,27,46,0.5)", border: `1px solid ${drone.is_visible ? drone.color + "20" : "rgba(0,245,255,0.05)"}`, opacity: drone.is_visible ? 1 : 0.5 }}>
              <div className="text-2xl flex-shrink-0">{drone.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs" style={{ color: drone.color }}>{drone.code}</span>
                  <span className="font-plex text-sm text-white">{drone.name}</span>
                  <span className="font-mono text-[10px] text-[#3a5570]">{drone.category}</span>
                  {!drone.is_visible && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#ff6b00" }}>СКРЫТ</span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-[#2a4060] mt-0.5">
                  {drone.range_val} · {drone.speed} · {drone.endurance}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleToggleVisible(drone)} title={drone.is_visible ? "Скрыть" : "Показать"}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${drone.is_visible ? "text-[#00ff88]" : "text-[#3a5570] hover:text-[#00ff88]"}`}>
                  <Icon name={drone.is_visible ? "Eye" : "EyeOff"} size={14} />
                </button>
                <button onClick={() => openEdit(drone)} title="Редактировать"
                  className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                  <Icon name="Pencil" size={14} />
                </button>
                <button onClick={() => setDeleteTarget(drone)} title="Удалить"
                  className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Удалить тип БпЛА"
        message={`«${deleteTarget?.name}» будет удалён из каталога. Это действие нельзя отменить.`}
        confirmLabel="Удалить" danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

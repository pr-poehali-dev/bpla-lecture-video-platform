import { useState, useEffect } from "react";
import { api } from "@/api";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface ScheduleItem {
  id: number;
  title: string;
  subject: string;
  group_name: string;
  location: string;
  scheduled_date: string;
  time_start: string | null;
  time_end: string | null;
  notes: string;
  is_cancelled: boolean;
  instructor_name: string;
  instructor_callsign: string;
}

const EMPTY_FORM = {
  title: "", subject: "", group_name: "", location: "",
  scheduled_date: "", time_start: "", time_end: "", notes: "",
};

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return iso; }
}

function fmtTime(t: string | null) {
  if (!t) return "";
  return t.slice(0, 5);
}

function weekday(iso: string) {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return days[new Date(iso).getDay()];
}

interface Props { user: User; }

export default function InstructorScheduleTab({ user }: Props) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [filterFrom, setFilterFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [filterTo, setFilterTo] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 2, 0);
    return d.toISOString().slice(0, 10);
  });
  const [showAll, setShowAll] = useState(false);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500);
  };

  const load = () => {
    setLoading(true);
    api.instructor.scheduleList({ date_from: filterFrom, date_to: filterTo, all: showAll })
      .then(res => { setItems(res.schedule || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterFrom, filterTo, showAll]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, scheduled_date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditing(item);
    setForm({
      title: item.title, subject: item.subject, group_name: item.group_name,
      location: item.location, scheduled_date: item.scheduled_date,
      time_start: fmtTime(item.time_start), time_end: fmtTime(item.time_end),
      notes: item.notes,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.scheduled_date) { showMsg("Заполните название и дату", false); return; }
    setSaving(true);
    const data = { ...form, time_start: form.time_start || null, time_end: form.time_end || null };
    const res = editing
      ? await api.instructor.scheduleUpdate({ id: editing.id, ...data })
      : await api.instructor.scheduleCreate(data);
    setSaving(false);
    if (res.error) { showMsg(res.error, false); return; }
    showMsg(res.message || "Сохранено");
    setShowForm(false); setEditing(null);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить занятие?")) return;
    const res = await api.instructor.scheduleDelete(id);
    if (res.error) showMsg(res.error, false);
    else { showMsg("Удалено"); load(); }
  };

  const toggleCancel = async (item: ScheduleItem) => {
    await api.instructor.scheduleUpdate({ id: item.id, is_cancelled: !item.is_cancelled });
    load();
  };

  const f = (k: keyof typeof EMPTY_FORM, v: string) => setForm(p => ({ ...p, [k]: v }));

  // group by date
  const grouped = items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    const d = item.scheduled_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
            className="bg-transparent px-3 py-1.5 font-mono text-xs text-white outline-none"
            style={{ border: "1px solid rgba(0,255,136,0.2)", colorScheme: "dark" }} />
          <span className="font-mono text-xs text-[#3a5570]">—</span>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
            className="bg-transparent px-3 py-1.5 font-mono text-xs text-white outline-none"
            style={{ border: "1px solid rgba(0,255,136,0.2)", colorScheme: "dark" }} />
        </div>
        {user.is_admin && (
          <button onClick={() => setShowAll(v => !v)}
            className="font-mono text-xs px-3 py-1.5 transition-all"
            style={{ border: `1px solid ${showAll ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.15)"}`, color: showAll ? "#00ff88" : "#5a7a95" }}>
            {showAll ? "Все инструкторы" : "Мои занятия"}
          </button>
        )}
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-1.5 font-mono text-xs ml-auto"
          style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
          <Icon name="Plus" size={13} /> ДОБАВИТЬ ЗАНЯТИЕ
        </button>
      </div>

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="p-5 space-y-4 animate-fade-in" style={{ border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.02)" }}>
          <div className="flex items-center justify-between">
            <span className="font-orbitron text-sm font-bold text-[#00ff88]">{editing ? "РЕДАКТИРОВАТЬ" : "НОВОЕ ЗАНЯТИЕ"}</span>
            <button onClick={() => setShowForm(false)} className="text-[#3a5570] hover:text-white transition-colors"><Icon name="X" size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ТЕМА ЗАНЯТИЯ *</label>
              <input value={form.title} onChange={e => f("title", e.target.value)} placeholder="Название занятия"
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ПРЕДМЕТ</label>
              <input value={form.subject} onChange={e => f("subject", e.target.value)} placeholder="Тактика FPV"
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ГРУППА</label>
              <input value={form.group_name} onChange={e => f("group_name", e.target.value)} placeholder="Группа А-1"
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">МЕСТО</label>
              <input value={form.location} onChange={e => f("location", e.target.value)} placeholder="Класс 3, полигон"
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ДАТА *</label>
              <input type="date" value={form.scheduled_date} onChange={e => f("scheduled_date", e.target.value)}
                className="w-full bg-transparent px-3 py-2 font-mono text-sm text-white outline-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)", colorScheme: "dark" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ВРЕМЯ</label>
              <div className="flex gap-2">
                <input type="time" value={form.time_start} onChange={e => f("time_start", e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 font-mono text-sm text-white outline-none"
                  style={{ border: "1px solid rgba(0,255,136,0.2)", colorScheme: "dark" }} placeholder="09:00" />
                <input type="time" value={form.time_end} onChange={e => f("time_end", e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 font-mono text-sm text-white outline-none"
                  style={{ border: "1px solid rgba(0,255,136,0.2)", colorScheme: "dark" }} placeholder="11:00" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ЗАМЕТКИ</label>
              <textarea value={form.notes} onChange={e => f("notes", e.target.value)} rows={2}
                placeholder="Дополнительная информация..."
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none resize-none"
                style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 font-mono text-xs disabled:opacity-50 transition-all"
              style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
              <Icon name={saving ? "Loader" : "Save"} size={12} className={saving ? "animate-spin" : ""} />
              {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 font-mono text-xs text-[#5a7a95] hover:text-white transition-colors"
              style={{ border: "1px solid rgba(0,245,255,0.1)" }}>ОТМЕНА</button>
          </div>
        </div>
      )}

      {/* Calendar list */}
      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16" style={{ border: "1px solid rgba(0,255,136,0.08)" }}>
          <Icon name="CalendarDays" size={36} className="text-[#1a3050] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570]">Занятий не найдено</div>
          <div className="font-mono text-[10px] text-[#1a2840] mt-1">Добавьте первое занятие</div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, dayItems]) => (
            <div key={date} className="animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-mono text-xs font-bold text-[#00ff88]">{weekday(date)}</div>
                <div className="font-plex text-sm text-white">{fmtDate(date)}</div>
                <div className="flex-1 h-px" style={{ background: "rgba(0,255,136,0.1)" }} />
                <div className="font-mono text-[10px] text-[#3a5570]">{dayItems.length} занятий</div>
              </div>
              <div className="space-y-2">
                {dayItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 transition-all"
                    style={{ background: item.is_cancelled ? "rgba(255,34,68,0.03)" : "rgba(13,27,46,0.5)", border: `1px solid ${item.is_cancelled ? "rgba(255,34,68,0.15)" : "rgba(0,255,136,0.1)"}`, opacity: item.is_cancelled ? 0.6 : 1 }}>
                    {/* Time */}
                    <div className="flex-shrink-0 text-center" style={{ minWidth: 60 }}>
                      {item.time_start ? (
                        <>
                          <div className="font-orbitron text-sm font-bold" style={{ color: item.is_cancelled ? "#ff2244" : "#00ff88" }}>{fmtTime(item.time_start)}</div>
                          {item.time_end && <div className="font-mono text-[10px] text-[#3a5570]">{fmtTime(item.time_end)}</div>}
                        </>
                      ) : (
                        <div className="font-mono text-[10px] text-[#3a5570]">—</div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {item.is_cancelled && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ background: "rgba(255,34,68,0.1)", color: "#ff2244", border: "1px solid rgba(255,34,68,0.3)" }}>ОТМЕНЕНО</span>
                        )}
                        <span className="font-plex text-sm text-white">{item.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {item.subject && <span className="font-mono text-[10px] text-[#5a7a95]">{item.subject}</span>}
                        {item.group_name && <span className="font-mono text-[10px] text-[#00f5ff]">{item.group_name}</span>}
                        {item.location && (
                          <span className="font-mono text-[10px] text-[#3a5570] flex items-center gap-1">
                            <Icon name="MapPin" size={9} />{item.location}
                          </span>
                        )}
                        {showAll && item.instructor_callsign && (
                          <span className="font-mono text-[10px] text-[#a855f7]">{item.instructor_callsign}</span>
                        )}
                      </div>
                      {item.notes && <div className="font-plex text-[11px] text-[#3a5570] mt-1 truncate">{item.notes}</div>}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleCancel(item)} title={item.is_cancelled ? "Восстановить" : "Отменить"}
                        className="w-8 h-8 flex items-center justify-center transition-colors"
                        style={{ color: item.is_cancelled ? "#00ff88" : "#ff6b00" }}>
                        <Icon name={item.is_cancelled ? "RotateCcw" : "Ban"} size={14} />
                      </button>
                      <button onClick={() => openEdit(item)}
                        className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button onClick={() => del(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
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

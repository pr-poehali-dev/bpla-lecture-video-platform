import { useState, useEffect } from "react";
import { api } from "@/api";
import { User } from "@/App";
import Icon from "@/components/ui/icon";
import ConfirmModal from "@/components/admin/ConfirmModal";

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

function isToday(iso: string) {
  return iso === new Date().toISOString().slice(0, 10);
}

interface Props { user: User; onOpenSheets?: (group?: string, subject?: string) => void; }

export default function InstructorScheduleTab({ user, onOpenSheets }: Props) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [repeat, setRepeat] = useState(0);
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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
    setRepeat(0);
    setForm({ ...EMPTY_FORM, scheduled_date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setRepeat(0);
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
    const base = { ...form, time_start: form.time_start || null, time_end: form.time_end || null };
    if (editing) {
      const res = await api.instructor.scheduleUpdate({ id: editing.id, ...base });
      setSaving(false);
      if (res.error) { showMsg(res.error, false); return; }
      showMsg("Сохранено");
    } else {
      // Создаём занятие + повторения
      const dates: string[] = [base.scheduled_date];
      for (let i = 1; i <= repeat; i++) {
        const d = new Date(base.scheduled_date);
        d.setDate(d.getDate() + i * 7);
        dates.push(d.toISOString().slice(0, 10));
      }
      for (const date of dates) {
        await api.instructor.scheduleCreate({ ...base, scheduled_date: date });
      }
      setSaving(false);
      showMsg(dates.length > 1 ? `Создано ${dates.length} занятий` : "Занятие создано");
    }
    setShowForm(false); setEditing(null); setRepeat(0);
    load();
  };

  const doDelete = async (id: number) => {
    const res = await api.instructor.scheduleDelete(id);
    setConfirmDeleteId(null);
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
            {!editing && (
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ПОВТОРЯТЬ ЕЩЁ (НЕДЕЛЬ)</label>
                <div className="flex items-center gap-2">
                  {[0,1,2,3,4,7,11].map(n => (
                    <button key={n} type="button" onClick={() => setRepeat(n)}
                      className="font-mono text-xs px-3 py-1.5 transition-all"
                      style={{ border: `1px solid ${repeat === n ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,0.1)"}`, color: repeat === n ? "#00f5ff" : "#3a5570", background: repeat === n ? "rgba(0,245,255,0.06)" : "transparent" }}>
                      {n === 0 ? "Нет" : `×${n+1}`}
                    </button>
                  ))}
                  {repeat > 0 && (
                    <span className="font-mono text-[10px] text-[#5a7a95]">→ {repeat + 1} занятий каждую неделю</span>
                  )}
                </div>
              </div>
            )}
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
                {dayItems.map(item => {
                  const isNow = (() => {
                    if (!item.time_start || !isToday(item.scheduled_date)) return false;
                    const now = new Date();
                    const [sh, sm] = item.time_start.split(":").map(Number);
                    const start = sh * 60 + sm;
                    const cur = now.getHours() * 60 + now.getMinutes();
                    const end = item.time_end ? (() => { const [eh, em] = item.time_end!.split(":").map(Number); return eh * 60 + em; })() : start + 90;
                    return cur >= start && cur <= end;
                  })();
                  return (
                  <div key={item.id} className="flex gap-0 overflow-hidden transition-all group"
                    style={{
                      background: item.is_cancelled ? "rgba(255,34,68,0.02)" : isNow ? "rgba(0,255,136,0.04)" : "rgba(13,27,46,0.5)",
                      border: `1px solid ${item.is_cancelled ? "rgba(255,34,68,0.2)" : isNow ? "rgba(0,255,136,0.35)" : "rgba(0,245,255,0.08)"}`,
                      opacity: item.is_cancelled ? 0.65 : 1,
                      boxShadow: isNow ? "0 0 16px rgba(0,255,136,0.08)" : "none",
                    }}
                    onMouseEnter={e => { if (!item.is_cancelled && !isNow) (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.2)"; }}
                    onMouseLeave={e => { if (!item.is_cancelled && !isNow) (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.08)"; }}>

                    {/* Полоса времени */}
                    <div className="flex flex-col items-center justify-center px-3 py-3 flex-shrink-0"
                      style={{
                        background: item.is_cancelled ? "rgba(255,34,68,0.06)" : isNow ? "rgba(0,255,136,0.1)" : "rgba(0,245,255,0.04)",
                        borderRight: `1px solid ${item.is_cancelled ? "rgba(255,34,68,0.15)" : isNow ? "rgba(0,255,136,0.2)" : "rgba(0,245,255,0.07)"}`,
                        minWidth: 60,
                      }}>
                      {item.time_start ? (
                        <>
                          <div className="font-orbitron text-sm font-black leading-none"
                            style={{ color: item.is_cancelled ? "#ff2244" : isNow ? "#00ff88" : "#00f5ff" }}>
                            {fmtTime(item.time_start)}
                          </div>
                          {item.time_end && <div className="font-mono text-[9px] text-[#3a5570] mt-0.5">{fmtTime(item.time_end)}</div>}
                        </>
                      ) : (
                        <Icon name="Clock" size={14} className="text-[#3a5570]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {isNow && (
                          <span className="font-mono text-[9px] px-2 py-0.5 flex items-center gap-1"
                            style={{ background: "rgba(0,255,136,0.12)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] inline-block" style={{ animation: "pulse 1.5s infinite" }} />
                            ИДЁТ СЕЙЧАС
                          </span>
                        )}
                        {item.is_cancelled && (
                          <span className="font-mono text-[9px] px-2 py-0.5"
                            style={{ background: "rgba(255,34,68,0.1)", color: "#ff2244", border: "1px solid rgba(255,34,68,0.3)" }}>
                            ОТМЕНЕНО
                          </span>
                        )}
                        <span className="font-plex text-sm text-white font-medium">{item.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {item.subject && (
                          <span className="font-mono text-[10px] text-[#5a7a95] flex items-center gap-1">
                            <Icon name="BookOpen" size={9} />{item.subject}
                          </span>
                        )}
                        {item.group_name && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5"
                            style={{ background: "rgba(0,245,255,0.06)", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.15)" }}>
                            {item.group_name}
                          </span>
                        )}
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
                    <div className="flex items-center gap-0.5 px-2 flex-shrink-0">
                      {onOpenSheets && !item.is_cancelled && (
                        <button onClick={() => onOpenSheets(item.group_name, item.subject)}
                          title="Открыть / создать ведомость"
                          className="w-8 h-8 flex items-center justify-center transition-colors text-[#3a5570] hover:text-[#a855f7]">
                          <Icon name="ClipboardList" size={13} />
                        </button>
                      )}
                      <button onClick={() => toggleCancel(item)} title={item.is_cancelled ? "Восстановить" : "Отменить"}
                        className="w-8 h-8 flex items-center justify-center transition-colors"
                        style={{ color: item.is_cancelled ? "#00ff88" : "#ff6b00" }}>
                        <Icon name={item.is_cancelled ? "RotateCcw" : "Ban"} size={13} />
                      </button>
                      <button onClick={() => openEdit(item)}
                        className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                        <Icon name="Pencil" size={13} />
                      </button>
                      <button onClick={() => setConfirmDeleteId(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Удалить занятие"
        message="Вы уверены, что хотите удалить это занятие? Действие необратимо."
        confirmLabel="Удалить"
        danger
        onConfirm={() => confirmDeleteId !== null && doDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
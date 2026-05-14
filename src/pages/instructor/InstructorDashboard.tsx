import { useState, useEffect } from "react";
import { api } from "@/api";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface ScheduleItem {
  id: number; title: string; subject: string; group_name: string;
  location: string; scheduled_date: string; time_start: string | null;
  time_end: string | null; notes: string; is_cancelled: boolean;
}
interface Sheet {
  id: number; title: string; group_name: string; subject: string;
  updated_at: string; rows_count?: number;
}
interface Props {
  user: User;
  onTabChange: (tab: string) => void;
}

function fmtTime(t: string | null) { return t ? t.slice(0, 5) : ""; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function weekday(iso: string) {
  return ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][new Date(iso).getDay()];
}

function isToday(iso: string) {
  return iso === new Date().toISOString().slice(0, 10);
}

function isTomorrow(iso: string) {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return iso === t.toISOString().slice(0, 10);
}

function dayLabel(iso: string) {
  if (isToday(iso)) return "Сегодня";
  if (isTomorrow(iso)) return "Завтра";
  return weekday(iso);
}

export default function InstructorDashboard({ user, onTabChange }: Props) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [docsCount, setDocsCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    Promise.all([
      api.instructor.scheduleList({ date_from: today, date_to: inTwoWeeks }),
      api.instructor.sheetsList(),
      api.instructor.foldersList(),
      api.instructor.notesList(),
    ]).then(([sch, sh, fm, nt]) => {
      setSchedule((sch.schedule || []).filter((s: ScheduleItem) => !s.is_cancelled));
      setSheets(sh.sheets || []);
      setDocsCount((fm.docs || []).length);
      setNotesCount((nt.notes || []).length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const todayItems = schedule.filter(s => isToday(s.scheduled_date));
  const upcomingItems = schedule.filter(s => !isToday(s.scheduled_date));

  // Группируем ближайшие по дням
  const upcomingByDay: Record<string, ScheduleItem[]> = {};
  upcomingItems.forEach(s => {
    if (!upcomingByDay[s.scheduled_date]) upcomingByDay[s.scheduled_date] = [];
    upcomingByDay[s.scheduled_date].push(s);
  });
  const upcomingDays = Object.entries(upcomingByDay).slice(0, 3);

  const recentSheets = sheets.slice(0, 4);

  const METRICS = [
    { label: "Сегодня",     value: todayItems.length,      icon: "Zap",          color: "#00ff88",  tab: "schedule" },
    { label: "Впереди",     value: upcomingItems.length,   icon: "CalendarDays", color: "#00f5ff",  tab: "schedule" },
    { label: "Ведомости",   value: sheets.length,          icon: "ClipboardList",color: "#a855f7",  tab: "sheets"   },
    { label: "Материалы",   value: docsCount + notesCount, icon: "FolderOpen",   color: "#ff6b00",  tab: "files"    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
          <div className="font-mono text-xs text-[#3a5570] tracking-widest animate-pulse">ЗАГРУЗКА...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Метрики ── */}
      <div className="flex gap-3 sm:gap-4 flex-wrap">
        {METRICS.map(m => (
          <button key={m.label} onClick={() => onTabChange(m.tab)}
            className="flex items-center gap-3 px-4 py-3 flex-1 min-w-[120px] transition-all group"
            style={{ border: `1px solid ${m.color}20`, background: `${m.color}06` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}45`; (e.currentTarget as HTMLElement).style.background = `${m.color}0e`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}20`; (e.currentTarget as HTMLElement).style.background = `${m.color}06`; }}>
            <div className="flex items-center justify-center w-9 h-9 flex-shrink-0"
              style={{ border: `1px solid ${m.color}35`, background: `${m.color}10` }}>
              <Icon name={m.icon as "Zap"} size={16} style={{ color: m.color }} />
            </div>
            <div>
              <div className="font-orbitron text-xl font-black leading-none"
                style={{ color: m.value > 0 ? m.color : "#2a4060" }}>{m.value}</div>
              <div className="font-mono text-[9px] text-[#3a5570] tracking-wide mt-0.5 group-hover:text-[#5a7a95] transition-colors">{m.label.toUpperCase()}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Зона 2: Сегодня + Расписание ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Сегодня */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-4" style={{ background: "#00ff88", boxShadow: "0 0 6px #00ff88" }} />
            <div className="font-mono text-[10px] text-[#00ff88] tracking-[0.3em]">СЕГОДНЯ</div>
            <div className="flex-1 h-px" style={{ background: "rgba(0,255,136,0.12)" }} />
            <button onClick={() => onTabChange("schedule")}
              className="font-mono text-[10px] text-[#3a5570] hover:text-[#00ff88] transition-colors flex items-center gap-1">
              Расписание <Icon name="ChevronRight" size={11} />
            </button>
          </div>

          {todayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3"
              style={{ border: "1px dashed rgba(0,255,136,0.1)", background: "rgba(0,255,136,0.02)" }}>
              <Icon name="CalendarCheck" size={28} className="text-[#1a3050]" />
              <div className="font-mono text-xs text-[#2a4060]">Занятий сегодня нет</div>
              <button onClick={() => onTabChange("schedule")}
                className="font-mono text-[10px] px-3 py-1.5 transition-all"
                style={{ border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88", background: "rgba(0,255,136,0.04)" }}>
                + Добавить занятие
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayItems.map(item => (
                <div key={item.id} className="flex gap-0 overflow-hidden transition-all group"
                  style={{ border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.04)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,136,0.4)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,136,0.2)"; }}>
                  {/* Полоса времени */}
                  <div className="flex flex-col items-center justify-center px-4 py-3 flex-shrink-0"
                    style={{ background: "rgba(0,255,136,0.08)", borderRight: "1px solid rgba(0,255,136,0.15)", minWidth: 64 }}>
                    {item.time_start
                      ? <>
                          <div className="font-orbitron text-base font-black text-[#00ff88] leading-none">{fmtTime(item.time_start)}</div>
                          {item.time_end && <div className="font-mono text-[9px] text-[#3a5570] mt-0.5">{fmtTime(item.time_end)}</div>}
                        </>
                      : <Icon name="Clock" size={18} className="text-[#00ff88] opacity-50" />}
                  </div>
                  {/* Контент */}
                  <div className="flex-1 min-w-0 px-4 py-3">
                    <div className="font-plex text-sm text-white font-medium truncate">{item.title}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {item.group_name && <span className="font-mono text-[10px] text-[#00f5ff]">{item.group_name}</span>}
                      {item.subject && <span className="font-mono text-[10px] text-[#5a7a95]">{item.subject}</span>}
                      {item.location && (
                        <span className="font-mono text-[10px] text-[#3a5570] flex items-center gap-1">
                          <Icon name="MapPin" size={9} />{item.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Кнопка ведомость */}
                  <button onClick={() => onTabChange("sheets")}
                    className="flex items-center gap-1.5 px-3 py-3 flex-shrink-0 font-mono text-[10px] transition-all self-stretch"
                    style={{ color: "#a855f7", borderLeft: "1px solid rgba(168,85,247,0.1)", background: "transparent" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <Icon name="ClipboardList" size={12} />
                    <span className="hidden sm:inline">Ведомость</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ближайшие занятия — таймлайн */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-4" style={{ background: "#00f5ff", boxShadow: "0 0 6px #00f5ff" }} />
            <div className="font-mono text-[10px] text-[#00f5ff] tracking-[0.3em]">БЛИЖАЙШИЕ</div>
            <div className="flex-1 h-px" style={{ background: "rgba(0,245,255,0.1)" }} />
          </div>

          {upcomingDays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3"
              style={{ border: "1px dashed rgba(0,245,255,0.08)", background: "rgba(0,245,255,0.01)" }}>
              <Icon name="Calendar" size={28} className="text-[#1a3050]" />
              <div className="font-mono text-xs text-[#2a4060]">Нет занятий на 2 недели</div>
            </div>
          ) : (
            <div className="space-y-1">
              {upcomingDays.map(([date, items]) => (
                <div key={date} className="flex gap-0 overflow-hidden"
                  style={{ border: "1px solid rgba(0,245,255,0.07)", background: "rgba(13,27,46,0.4)" }}>
                  {/* День */}
                  <div className="flex flex-col items-center justify-center px-3 py-3 flex-shrink-0"
                    style={{ background: "rgba(0,245,255,0.05)", borderRight: "1px solid rgba(0,245,255,0.08)", minWidth: 56 }}>
                    <div className="font-orbitron text-[10px] font-bold text-[#00f5ff] leading-none">
                      {isTomorrow(date) ? "ЗАВТРА" : weekday(date)}
                    </div>
                    <div className="font-mono text-[9px] text-[#3a5570] mt-0.5">{fmtDate(date)}</div>
                  </div>
                  {/* Занятия в этот день */}
                  <div className="flex-1 min-w-0 py-1.5">
                    {items.map((item, i) => (
                      <div key={item.id} className={`flex items-center gap-2 px-3 py-1 ${i > 0 ? "border-t" : ""}`}
                        style={{ borderColor: "rgba(0,245,255,0.04)" }}>
                        {item.time_start && (
                          <span className="font-mono text-[10px] text-[#00f5ff] flex-shrink-0 w-10">{fmtTime(item.time_start)}</span>
                        )}
                        <span className="font-plex text-xs text-white truncate">{item.title}</span>
                        {item.group_name && (
                          <span className="font-mono text-[9px] text-[#3a5570] flex-shrink-0 hidden sm:inline">{item.group_name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center px-2 flex-shrink-0">
                    <span className="font-mono text-[10px] text-[#3a5570]">{items.length}</span>
                  </div>
                </div>
              ))}
              {Object.keys(upcomingByDay).length > 3 && (
                <button onClick={() => onTabChange("schedule")}
                  className="w-full font-mono text-[10px] text-[#3a5570] hover:text-[#00f5ff] transition-colors py-2 flex items-center justify-center gap-1">
                  Ещё {Object.keys(upcomingByDay).length - 3} дней <Icon name="ChevronDown" size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Зона 3: Ведомости + Быстрые действия ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Последние ведомости */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-4" style={{ background: "#a855f7", boxShadow: "0 0 6px #a855f7" }} />
            <div className="font-mono text-[10px] text-[#a855f7] tracking-[0.3em]">ВЕДОМОСТИ</div>
            <div className="flex-1 h-px" style={{ background: "rgba(168,85,247,0.1)" }} />
            <button onClick={() => onTabChange("sheets")}
              className="font-mono text-[10px] text-[#3a5570] hover:text-[#a855f7] transition-colors flex items-center gap-1">
              Все <Icon name="ChevronRight" size={11} />
            </button>
          </div>

          {recentSheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3"
              style={{ border: "1px dashed rgba(168,85,247,0.1)", background: "rgba(168,85,247,0.01)" }}>
              <Icon name="ClipboardList" size={28} className="text-[#1a3050]" />
              <div className="font-mono text-xs text-[#2a4060]">Ведомостей нет</div>
              <button onClick={() => onTabChange("sheets")}
                className="font-mono text-[10px] px-3 py-1.5 transition-all"
                style={{ border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", background: "rgba(168,85,247,0.04)" }}>
                + Создать ведомость
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentSheets.map(s => (
                <button key={s.id} onClick={() => onTabChange("sheets")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all group"
                  style={{ border: "1px solid rgba(168,85,247,0.1)", background: "rgba(13,27,46,0.4)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.1)"; (e.currentTarget as HTMLElement).style.background = "rgba(13,27,46,0.4)"; }}>
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
                    <Icon name="ClipboardList" size={14} className="text-[#a855f7]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-plex text-sm text-white truncate group-hover:text-[#a855f7] transition-colors">{s.title}</div>
                    <div className="font-mono text-[10px] text-[#3a5570]">
                      {[s.group_name, s.subject].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {s.rows_count !== undefined && (
                    <div className="flex-shrink-0 text-right">
                      <div className="font-orbitron text-sm font-bold text-[#a855f7]">{s.rows_count}</div>
                      <div className="font-mono text-[9px] text-[#3a5570]">чел.</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Быстрые действия */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-4" style={{ background: "#ff6b00", boxShadow: "0 0 6px #ff6b00" }} />
            <div className="font-mono text-[10px] text-[#ff6b00] tracking-[0.3em]">БЫСТРЫЕ ДЕЙСТВИЯ</div>
            <div className="flex-1 h-px" style={{ background: "rgba(255,107,0,0.1)" }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Новое занятие",    icon: "CalendarPlus", color: "#00ff88",  tab: "schedule",  desc: "Добавить в расписание" },
              { label: "Загрузить файл",   icon: "Upload",       color: "#ff6b00",  tab: "files",     desc: "Материалы и презентации" },
              { label: "Новая ведомость",  icon: "ClipboardPlus",color: "#a855f7",  tab: "sheets",    desc: "Оценки и посещаемость" },
              { label: "Режим лекции",     icon: "Monitor",      color: "#00f5ff",  tab: "files",     desc: "Показ материалов онлайн" },
            ].map(a => (
              <button key={a.label} onClick={() => onTabChange(a.tab)}
                className="flex flex-col items-start gap-2 p-4 text-left transition-all group"
                style={{ border: `1px solid ${a.color}15`, background: `${a.color}05` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${a.color}40`; (e.currentTarget as HTMLElement).style.background = `${a.color}0c`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${a.color}15`; (e.currentTarget as HTMLElement).style.background = `${a.color}05`; }}>
                <div className="w-8 h-8 flex items-center justify-center"
                  style={{ background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
                  <Icon name={a.icon as "Upload"} size={15} style={{ color: a.color }} />
                </div>
                <div>
                  <div className="font-orbitron text-xs font-bold" style={{ color: a.color }}>{a.label}</div>
                  <div className="font-mono text-[9px] text-[#3a5570] mt-0.5 group-hover:text-[#5a7a95] transition-colors">{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
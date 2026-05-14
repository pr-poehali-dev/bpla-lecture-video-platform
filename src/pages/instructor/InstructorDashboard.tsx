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

export default function InstructorDashboard({ user, onTabChange }: Props) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [docsCount, setDocsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    Promise.all([
      api.instructor.scheduleList({ date_from: today, date_to: inTwoWeeks }),
      api.instructor.sheetsList(),
      api.instructor.foldersList(),
    ]).then(([sch, sh, fm]) => {
      setSchedule((sch.schedule || []).filter((s: ScheduleItem) => !s.is_cancelled));
      setSheets(sh.sheets || []);
      setDocsCount((fm.docs || []).length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const todayItems = schedule.filter(s => isToday(s.scheduled_date));
  const upcomingItems = schedule.filter(s => !isToday(s.scheduled_date)).slice(0, 4);
  const recentSheets = sheets.slice(0, 3);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Приветствие */}
      <div className="flex items-center gap-3 p-4"
        style={{ background: "rgba(0,255,136,0.03)", border: "1px solid rgba(0,255,136,0.1)" }}>
        <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
        <div>
          <div className="font-mono text-[10px] text-[#00ff88] tracking-[0.2em]">{greeting.toUpperCase()}, {(user.callsign || user.name).toUpperCase()}</div>
          <div className="font-plex text-sm text-[#5a7a95] mt-0.5">
            {todayItems.length > 0
              ? `Сегодня ${todayItems.length} занятий${todayItems.length === 1 ? "е" : "ий"}`
              : "Сегодня занятий нет"}
            {" · "}{docsCount} материалов · {sheets.length} ведомостей
          </div>
        </div>
      </div>

      {/* Сегодня */}
      {todayItems.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="font-mono text-[10px] text-[#00ff88] tracking-[0.25em]">// СЕГОДНЯ</div>
            <div className="flex-1 h-px" style={{ background: "rgba(0,255,136,0.15)" }} />
          </div>
          <div className="space-y-2">
            {todayItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3"
                style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}>
                <div className="flex-shrink-0 text-center w-12">
                  {item.time_start
                    ? <div className="font-orbitron text-sm font-bold text-[#00ff88]">{fmtTime(item.time_start)}</div>
                    : <Icon name="Clock" size={16} className="text-[#00ff88] mx-auto" />}
                  {item.time_end && <div className="font-mono text-[9px] text-[#3a5570]">{fmtTime(item.time_end)}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-plex text-sm text-white font-medium truncate">{item.title}</div>
                  <div className="flex gap-3 font-mono text-[10px] text-[#3a5570] mt-0.5 flex-wrap">
                    {item.group_name && <span className="text-[#00f5ff]">{item.group_name}</span>}
                    {item.subject && <span>{item.subject}</span>}
                    {item.location && <span className="flex items-center gap-1"><Icon name="MapPin" size={9} />{item.location}</span>}
                  </div>
                </div>
                <button onClick={() => onTabChange("sheets")}
                  className="flex items-center gap-1.5 font-mono text-[10px] px-3 py-1.5 flex-shrink-0 transition-all"
                  style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.05)" }}>
                  <Icon name="ClipboardList" size={11} /> Ведомость
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ближайшие занятия */}
      {upcomingItems.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="font-mono text-[10px] text-[#00f5ff] tracking-[0.25em]">// БЛИЖАЙШИЕ ЗАНЯТИЯ</div>
            <div className="flex-1 h-px" style={{ background: "rgba(0,245,255,0.1)" }} />
            <button onClick={() => onTabChange("schedule")}
              className="font-mono text-[10px] text-[#3a5570] hover:text-[#00f5ff] transition-colors flex items-center gap-1">
              Все <Icon name="ChevronRight" size={11} />
            </button>
          </div>
          <div className="space-y-1.5">
            {upcomingItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 transition-all"
                style={{ background: "rgba(13,27,46,0.5)", border: "1px solid rgba(0,245,255,0.07)" }}>
                <div className="flex-shrink-0 w-14 text-right">
                  <div className="font-mono text-[10px] text-[#00f5ff]">
                    {isTomorrow(item.scheduled_date) ? "Завтра" : weekday(item.scheduled_date)}
                  </div>
                  <div className="font-mono text-[9px] text-[#3a5570]">{fmtDate(item.scheduled_date)}</div>
                </div>
                <div className="w-px h-6 flex-shrink-0" style={{ background: "rgba(0,245,255,0.1)" }} />
                <div className="flex-1 min-w-0">
                  <span className="font-plex text-xs text-white truncate">{item.title}</span>
                  {item.group_name && <span className="font-mono text-[10px] text-[#00f5ff] ml-2">{item.group_name}</span>}
                </div>
                {item.time_start && (
                  <div className="font-mono text-[10px] text-[#3a5570] flex-shrink-0">{fmtTime(item.time_start)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Нижние виджеты */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Последние ведомости */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="font-mono text-[10px] text-[#a855f7] tracking-[0.25em]">// ВЕДОМОСТИ</div>
            <div className="flex-1 h-px" style={{ background: "rgba(168,85,247,0.1)" }} />
            <button onClick={() => onTabChange("sheets")}
              className="font-mono text-[10px] text-[#3a5570] hover:text-[#a855f7] transition-colors flex items-center gap-1">
              Все <Icon name="ChevronRight" size={11} />
            </button>
          </div>
          {recentSheets.length === 0 ? (
            <div className="text-center py-6" style={{ border: "1px dashed rgba(168,85,247,0.1)" }}>
              <div className="font-mono text-[10px] text-[#3a5570]">Нет ведомостей</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentSheets.map(s => (
                <button key={s.id} onClick={() => onTabChange("sheets")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all group"
                  style={{ background: "rgba(13,27,46,0.5)", border: "1px solid rgba(168,85,247,0.08)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.08)"; }}>
                  <Icon name="ClipboardList" size={13} className="text-[#a855f7] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-plex text-xs text-white truncate group-hover:text-[#a855f7] transition-colors">{s.title}</div>
                    {s.group_name && <div className="font-mono text-[9px] text-[#3a5570]">{s.group_name}</div>}
                  </div>
                  {s.rows_count !== undefined && (
                    <span className="font-mono text-[10px] text-[#3a5570] flex-shrink-0">{s.rows_count} чел.</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Материалы */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="font-mono text-[10px] text-[#ff6b00] tracking-[0.25em]">// МАТЕРИАЛЫ</div>
            <div className="flex-1 h-px" style={{ background: "rgba(255,107,0,0.1)" }} />
            <button onClick={() => onTabChange("files")}
              className="font-mono text-[10px] text-[#3a5570] hover:text-[#ff6b00] transition-colors flex items-center gap-1">
              Все <Icon name="ChevronRight" size={11} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Файлы", count: docsCount, icon: "FolderOpen", color: "#ff6b00", tab: "files" },
              { label: "Ведомости", count: sheets.length, icon: "ClipboardList", color: "#a855f7", tab: "sheets" },
              { label: "Занятий сегодня", count: todayItems.length, icon: "CalendarDays", color: "#00ff88", tab: "schedule" },
              { label: "Занятий впереди", count: upcomingItems.length, icon: "Calendar", color: "#00f5ff", tab: "schedule" },
            ].map(w => (
              <button key={w.label} onClick={() => onTabChange(w.tab)}
                className="flex flex-col items-center gap-1 py-4 transition-all"
                style={{ border: `1px solid ${w.color}15`, background: `${w.color}06` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${w.color}35`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${w.color}15`; }}>
                <Icon name={w.icon as "Calendar"} size={18} style={{ color: w.color }} />
                <div className="font-orbitron text-lg font-black" style={{ color: w.color }}>{w.count}</div>
                <div className="font-mono text-[9px] text-[#3a5570] text-center leading-tight">{w.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Пусто */}
      {schedule.length === 0 && sheets.length === 0 && docsCount === 0 && (
        <div className="text-center py-12" style={{ border: "1px dashed rgba(0,255,136,0.1)" }}>
          <Icon name="LayoutDashboard" size={36} className="text-[#1a3050] mx-auto mb-3" />
          <div className="font-orbitron text-sm text-white mb-1">Кабинет пуст</div>
          <div className="font-mono text-xs text-[#3a5570]">Добавьте занятие в расписание или загрузите материалы</div>
        </div>
      )}
    </div>
  );
}

import Icon from "@/components/ui/icon";
import { UserStats } from "./ProfileTypes";

interface Props {
  stats: UserStats | null;
  totalLectures: number;
  totalVideos: number;
}

function Bar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
        <div className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}80)`, borderRadius: 2 }} />
      </div>
      <span className="font-mono text-[10px] w-8 text-right flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function ProfileStats({ stats, totalLectures, totalVideos }: Props) {
  if (!stats) {
    return (
      <div className="p-5 flex flex-col gap-4"
        style={{ border: "1px solid rgba(255,190,50,0.12)", background: "rgba(4,7,14,0.8)" }}>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse"
              style={{ border: "1px solid rgba(255,190,50,0.06)", background: "rgba(255,190,50,0.03)" }} />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "ЛЕКЦИЙ",  value: stats.lectures_done,  total: totalLectures || stats.lectures_done, icon: "BookOpen",       color: "#00f5ff" },
    { label: "ВИДЕО",   value: stats.videos_done,    total: totalVideos   || stats.videos_done,   icon: "Play",           color: "#00f5ff" },
    { label: "ТЕСТОВ",  value: stats.quizzes_passed, total: null,                                  icon: "ClipboardCheck", color: "#00ff88" },
    { label: stats.my_position ? `#${stats.my_position} РЕЙТИНГ` : "ОЧКОВ",
      value: stats.my_position ?? stats.score,       total: null,                                  icon: "Trophy",         color: "#ffbe32" },
  ];

  return (
    <div className="p-5 flex flex-col gap-5"
      style={{ border: "1px solid rgba(255,190,50,0.12)", background: "rgba(4,7,14,0.8)" }}>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="flex flex-col items-center py-4 gap-1.5 transition-all"
            style={{ border: `1px solid ${m.color}18`, background: `${m.color}05` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}35`; (e.currentTarget as HTMLElement).style.background = `${m.color}0c`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}18`; (e.currentTarget as HTMLElement).style.background = `${m.color}05`; }}>
            <Icon name={m.icon as "Trophy"} size={15} style={{ color: m.color, opacity: 0.7 }} />
            <div className="font-orbitron text-2xl font-black leading-none"
              style={{ color: m.value > 0 ? m.color : "#2a4060" }}>
              {m.value}
            </div>
            <div className="font-mono text-[9px] text-[#3a5570] tracking-wider text-center leading-tight">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Прогресс-бары */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-px h-3" style={{ background: "#ffbe32" }} />
          <span className="font-mono text-[9px] text-[#3a5570] tracking-[0.2em]">ПРОГРЕСС</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Icon name="BookOpen" size={11} className="text-[#00f5ff]" />
              <span className="font-mono text-[10px] text-[#5a7a95]">Лекции</span>
            </div>
            <span className="font-mono text-[10px] text-[#3a5570]">
              {stats.lectures_done}{totalLectures ? ` / ${totalLectures}` : ""}
            </span>
          </div>
          <Bar value={stats.lectures_done} total={totalLectures || Math.max(stats.lectures_done, 1)} color="#00f5ff" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Icon name="Play" size={11} className="text-[#00f5ff]" />
              <span className="font-mono text-[10px] text-[#5a7a95]">Видео</span>
            </div>
            <span className="font-mono text-[10px] text-[#3a5570]">
              {stats.videos_done}{totalVideos ? ` / ${totalVideos}` : ""}
            </span>
          </div>
          <Bar value={stats.videos_done} total={totalVideos || Math.max(stats.videos_done, 1)} color="#00f5ff" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Icon name="Trophy" size={11} className="text-[#ffbe32]" />
              <span className="font-mono text-[10px] text-[#5a7a95]">Рейтинговые очки</span>
            </div>
            <span className="font-mono text-[10px] text-[#ffbe32]">{stats.score}</span>
          </div>
          <Bar value={stats.score} total={Math.max(stats.score, 500)} color="#ffbe32" />
        </div>

        {/* Позиция в рейтинге */}
        {stats.my_position && (
          <div className="flex items-center justify-between pt-3 border-t"
            style={{ borderColor: "rgba(255,190,50,0.1)" }}>
            <span className="font-mono text-[10px] text-[#5a7a95]">Позиция в рейтинге</span>
            <span className="font-orbitron text-sm font-bold text-[#ffbe32]">
              #{stats.my_position}
            </span>
          </div>
        )}

        {/* Нулевое состояние */}
        {stats.lectures_done === 0 && stats.videos_done === 0 && (
          <div className="text-center pt-2">
            <div className="font-mono text-[10px] text-[#2a4060]">Начните с первой лекции →</div>
            <div className="font-mono text-[9px] text-[#1a2840] mt-0.5">Прогресс появится здесь</div>
          </div>
        )}
      </div>
    </div>
  );
}

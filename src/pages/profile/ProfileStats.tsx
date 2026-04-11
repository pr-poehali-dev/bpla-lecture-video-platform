import Icon from "@/components/ui/icon";
import { UserStats, ProgressBar } from "./ProfileTypes";

interface Props {
  stats: UserStats | null;
  totalLectures: number;
  totalVideos: number;
}

export default function ProfileStats({ stats, totalLectures, totalVideos }: Props) {
  return (
    <div className="p-5" style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,7,14,0.8)" }}>
      <div className="font-mono text-[10px] text-[#3a5570] tracking-widest mb-4">ПРОГРЕСС ОБУЧЕНИЯ</div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats ? [
          { label: "ЛЕКЦИЙ", value: stats.lectures_done, icon: "BookOpen", color: "#00f5ff" },
          { label: "ВИДЕО", value: stats.videos_done, icon: "Play", color: "#00f5ff" },
          { label: "ТЕСТОВ", value: stats.quizzes_passed, icon: "ClipboardCheck", color: "#00ff88" },
          { label: stats.my_position ? `#${stats.my_position} МЕСТО` : "ОЧКОВ", value: stats.my_position ?? stats.score, icon: "Trophy", color: "#ffbe32" },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-3 gap-1"
            style={{ border: `1px solid ${s.color}18`, background: `${s.color}05` }}>
            <Icon name={s.icon as "Trophy"} size={14} style={{ color: s.color }} />
            <div className="font-orbitron text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="font-mono text-[9px] text-[#3a5570] tracking-wider">{s.label}</div>
          </div>
        )) : Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse"
            style={{ border: "1px solid rgba(0,245,255,0.06)", background: "rgba(0,245,255,0.03)" }} />
        ))}
      </div>

      {stats && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#3a5570]">ЛЕКЦИИ</span>
              <span className="font-mono text-[10px] text-[#5a7a95]">{stats.lectures_done} / {totalLectures || "?"}</span>
            </div>
            <ProgressBar value={stats.lectures_done} total={totalLectures || stats.lectures_done} color="#00f5ff" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#3a5570]">ВИДЕО</span>
              <span className="font-mono text-[10px] text-[#5a7a95]">{stats.videos_done} / {totalVideos || "?"}</span>
            </div>
            <ProgressBar value={stats.videos_done} total={totalVideos || stats.videos_done} color="#00f5ff" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#3a5570]">ОЧКИ РЕЙТИНГА</span>
              <span className="font-mono text-[10px] text-[#ffbe32]">{stats.score} очков</span>
            </div>
            <ProgressBar value={stats.score} total={Math.max(stats.score, 500)} color="#ffbe32" />
          </div>
        </div>
      )}
    </div>
  );
}

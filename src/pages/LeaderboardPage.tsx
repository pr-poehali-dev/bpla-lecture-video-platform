import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import { User } from "@/App";

interface LeaderEntry {
  id: number;
  callsign: string;
  name: string;
  rank: string | null;
  avatar_url: string | null;
  completed_count: number;
  lectures_done: number;
  videos_done: number;
  quizzes_passed: number;
  score: number;
}

interface Props { user: User; }

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage({ user }: Props) {
  const [rows, setRows] = useState<LeaderEntry[]>([]);
  const [myPos, setMyPos] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.progress.leaderboard().then(res => {
      if (res.leaderboard) setRows(res.leaderboard);
      if (res.my_position) setMyPos(res.my_position);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#ffbe32]" />
        <span className="font-mono text-xs text-[#ffbe32] tracking-[0.3em]">// РЕЙТИНГ</span>
      </div>
      <h1 className="font-orbitron text-2xl font-black text-white mb-2 tracking-wider">ТАБЛИЦА ЛИДЕРОВ</h1>
      <p className="font-mono text-xs text-[#3a5570] mb-8">
        Очки: +10 за лекцию/видео · +25 за пройденный тест
      </p>

      {myPos && (
        <div className="flex items-center gap-3 px-4 py-3 mb-6"
          style={{ border: "1px solid rgba(255,190,50,0.3)", background: "rgba(255,190,50,0.05)" }}>
          <Icon name="Trophy" size={16} className="text-[#ffbe32]" />
          <span className="font-mono text-sm text-white">Ваша позиция: <span style={{ color: "#ffbe32" }}>#{myPos}</span></span>
        </div>
      )}

      {loading ? (
        <div className="font-mono text-xs text-[#3a5570] text-center py-16 animate-pulse">ЗАГРУЗКА...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16" style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
          <Icon name="Trophy" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
          <div className="font-mono text-sm text-[#3a5570]">Рейтинг пока пуст</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, idx) => {
            const isMe = row.id === user.id;
            const medal = MEDALS[idx];
            return (
              <div key={row.id}
                className="flex items-center gap-4 px-4 py-3 transition-all"
                style={{
                  border: isMe ? "1px solid rgba(255,190,50,0.4)" : "1px solid rgba(0,245,255,0.08)",
                  background: isMe ? "rgba(255,190,50,0.05)" : idx < 3 ? "rgba(0,245,255,0.02)" : "transparent",
                }}>
                {/* Position */}
                <div className="w-8 text-center flex-shrink-0">
                  {medal
                    ? <span className="text-lg">{medal}</span>
                    : <span className="font-mono text-sm text-[#3a5570]">#{idx + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ border: `1px solid ${isMe ? "rgba(255,190,50,0.4)" : "rgba(0,245,255,0.15)"}`, background: "rgba(0,245,255,0.04)" }}>
                  {row.avatar_url
                    ? <img src={row.avatar_url} className="w-full h-full object-cover" alt="" />
                    : <Icon name="User" size={16} className="text-[#3a5570]" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold truncate ${isMe ? "text-[#ffbe32]" : "text-white"}`}>
                      {row.callsign || row.name}
                    </span>
                    {isMe && <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ background: "rgba(255,190,50,0.15)", color: "#ffbe32", border: "1px solid rgba(255,190,50,0.3)" }}>ВЫ</span>}
                  </div>
                  {row.rank && <div className="font-mono text-[10px] text-[#3a5570]">{row.rank}</div>}
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <div className="font-mono text-xs text-[#00f5ff]">{row.lectures_done}</div>
                    <div className="font-mono text-[8px] text-[#2a4060]">лекций</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-xs text-[#00f5ff]">{row.videos_done}</div>
                    <div className="font-mono text-[8px] text-[#2a4060]">видео</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-xs text-[#00ff88]">{row.quizzes_passed}</div>
                    <div className="font-mono text-[8px] text-[#2a4060]">тестов</div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-orbitron text-lg font-black" style={{ color: idx === 0 ? "#ffbe32" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : "#5a7a95" }}>
                    {row.score}
                  </div>
                  <div className="font-mono text-[8px] text-[#2a4060]">очков</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

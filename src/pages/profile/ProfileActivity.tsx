import Icon from "@/components/ui/icon";
import { Page } from "@/App";
import { Note, QuizResult, timeAgo, formatDate } from "./ProfileTypes";

interface Props {
  notes: Note[];
  quizResults: QuizResult[];
  rightTab: "notes" | "tests";
  deletingNote: number | null;
  onSetRightTab: (tab: "notes" | "tests") => void;
  onDeleteNote: (id: number) => void;
  onNavigate: (page: Page) => void;
}

export default function ProfileActivity({
  notes, quizResults, rightTab, deletingNote,
  onSetRightTab, onDeleteNote, onNavigate,
}: Props) {
  return (
    <>
      {/* Заметки и тесты — вкладки */}
      <div style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,7,14,0.8)" }}>
        <div className="flex border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
          {([
            { key: "notes" as const, label: "МОИ ЗАМЕТКИ", icon: "PenLine", count: notes.length },
            { key: "tests" as const, label: "МОИ ТЕСТЫ", icon: "ClipboardCheck", count: quizResults.length },
          ]).map(t => (
            <button key={t.key} onClick={() => onSetRightTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-wider transition-colors"
              style={{
                color: rightTab === t.key ? "#00f5ff" : "#3a5570",
                borderBottom: rightTab === t.key ? "1px solid #00f5ff" : "1px solid transparent",
                background: rightTab === t.key ? "rgba(0,245,255,0.04)" : "transparent",
              }}>
              <Icon name={t.icon as "PenLine"} size={12} />
              {t.label}
              {t.count > 0 && (
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: rightTab === t.key ? "rgba(0,245,255,0.15)" : "rgba(0,245,255,0.06)",
                    color: rightTab === t.key ? "#00f5ff" : "#3a5570",
                  }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Заметки */}
        {rightTab === "notes" && (
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Icon name="PenLine" size={24} className="text-[#1a2a3a]" />
                <div className="font-mono text-xs text-[#3a5570]">Нет заметок</div>
                <div className="font-mono text-[10px] text-[#2a4060]">Добавляйте заметки прямо в лекциях</div>
              </div>
            ) : notes.map(note => (
              <div key={note.id} className="flex items-start gap-3 px-4 py-3 border-b group"
                style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(0,245,255,0.05)" }}>
                  <Icon name={note.item_type === "lecture" ? "FileText" : "Play"} size={11} className="text-[#00f5ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[9px] text-[#3a5570] mb-1 flex items-center gap-2">
                    <span>{note.item_type === "lecture" ? "Лекция" : "Видео"} #{note.item_id}</span>
                    <span>·</span>
                    <span>{timeAgo(note.updated_at)}</span>
                  </div>
                  <div className="font-plex text-sm text-[#c0d8e8] leading-relaxed line-clamp-3">{note.content}</div>
                </div>
                <button onClick={() => onDeleteNote(note.id)}
                  disabled={deletingNote === note.id}
                  className="opacity-0 group-hover:opacity-100 text-[#2a4060] hover:text-[#ff2244] transition-all flex-shrink-0 mt-0.5">
                  <Icon name={deletingNote === note.id ? "Loader" : "Trash2"} size={12}
                    className={deletingNote === note.id ? "animate-spin" : ""} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Результаты тестов */}
        {rightTab === "tests" && (
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {quizResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Icon name="ClipboardCheck" size={24} className="text-[#1a2a3a]" />
                <div className="font-mono text-xs text-[#3a5570]">Тестов пока нет</div>
                <div className="font-mono text-[10px] text-[#2a4060]">Проходите тесты в разделе Лекции</div>
              </div>
            ) : quizResults.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{
                    border: `1px solid ${r.passed ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`,
                    background: r.passed ? "rgba(0,255,136,0.06)" : "rgba(255,34,68,0.06)",
                  }}>
                  <Icon name={r.passed ? "CheckCircle" : "XCircle"} size={14}
                    style={{ color: r.passed ? "#00ff88" : "#ff2244" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-white truncate">{r.title}</div>
                  <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">{formatDate(r.completed_at)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-orbitron text-sm font-bold" style={{ color: r.passed ? "#00ff88" : "#ff2244" }}>
                    {r.score}/{r.total}
                  </div>
                  <div className="font-mono text-[9px]" style={{ color: r.passed ? "#00ff88" : "#ff2244" }}>
                    {Math.round((r.score / r.total) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Навигация к разделам */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { page: "lectures" as Page, icon: "BookOpen", label: "Лекции", color: "#00f5ff" },
          { page: "videos" as Page, icon: "Play", label: "Видео", color: "#00f5ff" },
          { page: "leaderboard" as Page, icon: "Trophy", label: "Рейтинг", color: "#ffbe32" },
          { page: "discussions" as Page, icon: "MessageSquare", label: "Обсуждения", color: "#00ff88" },
          { page: "messages" as Page, icon: "MessageCircle", label: "Сообщения", color: "#00f5ff" },
          { page: "support" as Page, icon: "Headphones", label: "Поддержка", color: "#00ff88" },
        ].map(item => (
          <button key={item.page} onClick={() => onNavigate(item.page)}
            className="flex items-center gap-2.5 px-3 py-3 transition-all group"
            style={{ border: "1px solid rgba(0,245,255,0.08)", background: "transparent" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = `${item.color}08`;
              (e.currentTarget as HTMLElement).style.borderColor = `${item.color}25`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.08)";
            }}>
            <Icon name={item.icon as "Trophy"} size={13} style={{ color: item.color }} />
            <span className="font-mono text-[11px] text-[#5a7a95] group-hover:text-white transition-colors">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

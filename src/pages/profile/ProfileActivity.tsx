import Icon from "@/components/ui/icon";
import { Page, User } from "@/App";
import { Note, timeAgo } from "./ProfileTypes";
import AdminFilesTab from "@/components/admin/AdminFilesTab";

interface Props {
  user: User;
  notes: Note[];
  rightTab: "notes" | "upload";
  deletingNote: number | null;
  onSetRightTab: (tab: "notes" | "upload") => void;
  onDeleteNote: (id: number) => void;
  onNavigate: (page: Page) => void;
}

const canUpload = (user: User) =>
  user.is_admin || ["инструктор кт", "инструктор fpv", "инструктор оператор-сапер"].includes(user.role || "");

export default function ProfileActivity({
  user, notes, rightTab, deletingNote,
  onSetRightTab, onDeleteNote,
}: Props) {
  const showUpload = canUpload(user);

  const tabs = [
    { key: "notes" as const, label: "МОИ ЗАМЕТКИ", icon: "PenLine", count: notes.length, color: "#a855f7" },
    ...(showUpload ? [{ key: "upload" as const, label: "ЗАГРУЗКА", icon: "Upload", count: 0, color: "#00ff88" }] : []),
  ];

  return (
    <div style={{ border: "1px solid rgba(168,85,247,0.15)", background: "rgba(4,7,14,0.8)" }}>

      {/* Вкладки */}
      <div className="flex border-b" style={{ borderColor: "rgba(168,85,247,0.1)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => onSetRightTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-wider transition-all"
            style={{
              color: rightTab === t.key ? t.color : "#3a5570",
              borderBottom: rightTab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
              background: rightTab === t.key ? `${t.color}06` : "transparent",
              marginBottom: "-1px",
            }}>
            <Icon name={t.icon as "PenLine"} size={12} />
            {t.label}
            {t.count > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.5"
                style={{
                  background: rightTab === t.key ? `${t.color}20` : "rgba(168,85,247,0.06)",
                  color: rightTab === t.key ? t.color : "#3a5570",
                  borderRadius: 10,
                }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Заметки */}
      {rightTab === "notes" && (
        <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-12 h-12 flex items-center justify-center"
                style={{ border: "1px solid rgba(168,85,247,0.12)", background: "rgba(168,85,247,0.04)" }}>
                <Icon name="PenLine" size={20} className="text-[#2a2040]" />
              </div>
              <div className="text-center">
                <div className="font-mono text-xs text-[#3a5570]">Заметок пока нет</div>
                <div className="font-mono text-[10px] text-[#2a4060] mt-1">Добавляйте заметки прямо в лекциях и видео</div>
              </div>
            </div>
          ) : notes.map(note => (
            <div key={note.id} className="flex items-start gap-3 px-4 py-3.5 border-b group transition-all"
              style={{ borderColor: "rgba(168,85,247,0.06)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.03)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ border: "1px solid rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.06)" }}>
                <Icon name={note.item_type === "lecture" ? "FileText" : "Play"} size={12} className="text-[#a855f7]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[9px] text-[#3a5570] mb-1 flex items-center gap-2">
                  <span className="text-[#a855f7]">{note.item_type === "lecture" ? "Лекция" : "Видео"} #{note.item_id}</span>
                  <span>·</span>
                  <span>{timeAgo(note.updated_at)}</span>
                </div>
                <div className="font-plex text-sm text-[#c0d8e8] leading-relaxed line-clamp-3">{note.content}</div>
              </div>
              <button onClick={() => onDeleteNote(note.id)}
                disabled={deletingNote === note.id}
                className="opacity-0 group-hover:opacity-100 text-[#2a4060] hover:text-[#ff2244] transition-all flex-shrink-0 mt-1">
                <Icon name={deletingNote === note.id ? "Loader" : "Trash2"} size={13}
                  className={deletingNote === note.id ? "animate-spin" : ""} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Загрузка материалов */}
      {rightTab === "upload" && showUpload && (
        <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
          <AdminFilesTab isAdmin={user.is_admin} />
        </div>
      )}
    </div>
  );
}

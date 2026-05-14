import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { User } from "./AdminUsersTab";

interface ProfileData extends User {
  rank?: string;
  last_seen?: string;
  progress_count: number;
  topics_count: number;
  replies_count: number;
  messages_count: number;
  admin_note: string;
}

interface Props {
  user: User;
  onClose: () => void;
}

const statusColor: Record<string, string> = { pending: "#ff6b00", approved: "#00ff88", rejected: "#ff2244" };
const statusLabel: Record<string, string> = { pending: "Ожидает", approved: "Одобрен", rejected: "Отклонён" };
const roleColor: Record<string, string> = {
  "курсант": "#00f5ff", "инструктор кт": "#00ff88",
  "инструктор fpv": "#a855f7", "инструктор оператор-сапер": "#fbbf24",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso?: string | null) {
  if (!iso) return "неизвестно";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} д назад`;
  return fmtDate(iso);
}

export default function AdminUserProfileModal({ user, onClose }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.admin.userProfile(user.id).catch(() => null);
    if (res?.user) { setProfile(res.user); setNote(res.user.admin_note || ""); }
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const saveNote = async () => {
    setNoteSaving(true);
    await api.admin.saveNote(user.id, note);
    setNoteSaving(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  const exportCSV = () => {
    const p = profile || user;
    const rows = [
      ["Поле", "Значение"],
      ["ID", String(p.id)],
      ["Имя", p.name],
      ["Позывной", p.callsign || ""],
      ["Email", p.email],
      ["Роль", p.role],
      ["Статус", p.status],
      ["Создан", fmtDate(p.created_at)],
      ["Одобрен", fmtDate(p.approved_at)],
    ];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `user_${p.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,8,16,0.92)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
        style={{ background: "#0a1520", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 0 60px rgba(0,245,255,0.08)" }}>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
          <div className="w-12 h-12 flex items-center justify-center font-orbitron text-lg font-black flex-shrink-0"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>
            {(user.callsign || user.name)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-orbitron text-base font-black text-white">{user.callsign || user.name}</div>
            {user.callsign && <div className="font-plex text-xs text-[#5a7a95]">{user.name}</div>}
            <div className="font-mono text-[10px] text-[#3a5570]">{user.email}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={exportCSV} title="Экспорт CSV"
              className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00ff88] transition-colors">
              <Icon name="Download" size={15} />
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-white transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА ПРОФИЛЯ...</div>
        ) : (
          <div className="p-6 space-y-5">

            {/* Status + role badges */}
            <div className="flex flex-wrap gap-2">
              <span className="font-mono text-xs px-3 py-1.5"
                style={{ border: `1px solid ${statusColor[user.status]}40`, color: statusColor[user.status], background: `${statusColor[user.status]}08` }}>
                {statusLabel[user.status] || user.status}
              </span>
              {user.role && (
                <span className="font-mono text-xs px-3 py-1.5"
                  style={{ border: `1px solid ${(roleColor[user.role] || "#5a7a95")}40`, color: roleColor[user.role] || "#5a7a95", background: `${roleColor[user.role] || "#5a7a95"}08` }}>
                  {user.role}
                </span>
              )}
              {user.is_admin && (
                <span className="font-mono text-xs px-3 py-1.5 flex items-center gap-1"
                  style={{ border: "1px solid rgba(168,85,247,0.4)", color: "#a855f7", background: "rgba(168,85,247,0.06)" }}>
                  <Icon name="Shield" size={10} /> АДМИНИСТРАТОР
                </span>
              )}
              {user.is_blocked && (
                <span className="font-mono text-xs px-3 py-1.5 flex items-center gap-1"
                  style={{ border: "1px solid rgba(255,34,68,0.4)", color: "#ff2244", background: "rgba(255,34,68,0.06)" }}>
                  <Icon name="Ban" size={10} /> ЗАБЛОКИРОВАН
                </span>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Материалов пройдено", value: profile?.progress_count ?? 0, icon: "BookOpen", color: "#00f5ff" },
                { label: "Тем создано", value: profile?.topics_count ?? 0, icon: "MessageSquare", color: "#00ff88" },
                { label: "Ответов", value: profile?.replies_count ?? 0, icon: "MessageCircle", color: "#a855f7" },
                { label: "Сообщений в чатах", value: profile?.messages_count ?? 0, icon: "Send", color: "#ff6b00" },
              ].map(s => (
                <div key={s.label} className="p-3 text-center" style={{ background: "rgba(13,27,46,0.6)", border: `1px solid ${s.color}15` }}>
                  <div className="font-orbitron text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="font-mono text-[9px] text-[#3a5570] leading-tight">{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "ЗАРЕГИСТРИРОВАН", value: fmtDate(user.created_at) },
                { label: "ОДОБРЕН", value: fmtDate(user.approved_at) },
                { label: "ПОСЛЕДНИЙ ВХОД", value: timeAgo(profile?.last_seen) },
              ].map(d => (
                <div key={d.label} className="p-3" style={{ background: "rgba(13,27,46,0.6)", border: "1px solid rgba(0,245,255,0.06)" }}>
                  <div className="font-mono text-[9px] text-[#3a5570] tracking-wider mb-1">{d.label}</div>
                  <div className="font-mono text-xs text-[#8ab0cc]">{d.value}</div>
                </div>
              ))}
            </div>

            {/* Admin note */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="StickyNote" size={13} className="text-[#f59e0b]" />
                <span className="font-mono text-xs text-[#f59e0b] tracking-wider">ЗАМЕТКА АДМИНИСТРАТОРА</span>
                <span className="font-mono text-[9px] text-[#3a5570]">(видна только вам)</span>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Добавьте заметку о пользователе..."
                className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none resize-none"
                style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.03)" }}
              />
              <button onClick={saveNote} disabled={noteSaving}
                className="flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all disabled:opacity-50"
                style={{ border: `1px solid ${noteSaved ? "rgba(0,255,136,0.4)" : "rgba(245,158,11,0.3)"}`, color: noteSaved ? "#00ff88" : "#f59e0b", background: noteSaved ? "rgba(0,255,136,0.05)" : "rgba(245,158,11,0.04)" }}>
                <Icon name={noteSaved ? "Check" : noteSaving ? "Loader" : "Save"} size={12} className={noteSaving ? "animate-spin" : ""} />
                {noteSaved ? "СОХРАНЕНО" : noteSaving ? "СОХРАНЯЮ..." : "СОХРАНИТЬ ЗАМЕТКУ"}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

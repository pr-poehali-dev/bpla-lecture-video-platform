import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { User } from "./AdminUsersTab";

const RANKS = [
  "Рядовой", "Ефрейтор", "Младший сержант", "Сержант", "Старший сержант",
  "Старшина", "Прапорщик", "Старший прапорщик",
  "Младший лейтенант", "Лейтенант", "Старший лейтенант", "Капитан",
  "Майор", "Подполковник", "Полковник",
  "Генерал-майор", "Генерал-лейтенант", "Генерал-полковник", "Генерал армии",
];

interface RankOrder {
  id: number;
  old_rank: string | null;
  new_rank: string;
  order_number: string | null;
  order_date: string | null;
  note: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  issued_by_name: string;
  created_at: string;
}

interface ProfileData extends User {
  rank?: string;
  dog_tag?: string;
  unit?: string;
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

  // Звание
  const [showRankForm, setShowRankForm] = useState(false);
  const [rankOrders, setRankOrders] = useState<RankOrder[]>([]);
  const [rankOrdersLoaded, setRankOrdersLoaded] = useState(false);
  const [newRank, setNewRank] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [rankNote, setRankNote] = useState("");
  const [rankFile, setRankFile] = useState<File | null>(null);
  const [rankSaving, setRankSaving] = useState(false);
  const [rankMsg, setRankMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const rankFileRef = useRef<HTMLInputElement>(null);

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

  const loadRankOrders = async () => {
    const res = await api.admin.getRankOrders(user.id).catch(() => null);
    if (res?.orders) setRankOrders(res.orders);
    setRankOrdersLoaded(true);
  };

  const handleOpenRankForm = () => {
    setShowRankForm(true);
    setNewRank(profile?.rank || user.rank || "");
    if (!rankOrdersLoaded) loadRankOrders();
  };

  const saveRank = async () => {
    if (!newRank) { setRankMsg({ text: "Выберите звание", ok: false }); return; }
    setRankSaving(true);
    setRankMsg(null);
    let file_data: string | undefined;
    let file_name: string | undefined;
    let file_mime: string | undefined;
    if (rankFile) {
      await new Promise<void>(resolve => {
        const reader = new FileReader();
        reader.onload = ev => {
          file_data = ev.target?.result as string;
          file_name = rankFile.name;
          file_mime = rankFile.type || "application/octet-stream";
          resolve();
        };
        reader.readAsDataURL(rankFile);
      });
    }
    const res = await api.admin.setRank({
      user_id: user.id, new_rank: newRank,
      order_number: orderNumber || undefined,
      order_date: orderDate || undefined,
      note: rankNote || undefined,
      file_data, file_name, file_mime,
    });
    setRankSaving(false);
    if (res.error) { setRankMsg({ text: res.error, ok: false }); return; }
    setRankMsg({ text: res.message || "Звание присвоено", ok: true });
    setOrderNumber(""); setOrderDate(""); setRankNote(""); setRankFile(null);
    if (rankFileRef.current) rankFileRef.current.value = "";
    setRankOrdersLoaded(false);
    loadRankOrders();
    load();
  };

  function fmtFileSize(bytes?: number | null) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  }

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
      ["Номер жетона", p.dog_tag || ""],
      ["Подразделение", p.unit || ""],
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

            {/* Жетон и подразделение */}
            {(profile?.dog_tag || user.dog_tag || profile?.unit || user.unit) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "НОМЕР ЖЕТОНА", value: profile?.dog_tag || user.dog_tag || "—", icon: "Tag" },
                  { label: "ПОДРАЗДЕЛЕНИЕ", value: profile?.unit || user.unit || "—", icon: "Shield" },
                ].map(d => (
                  <div key={d.label} className="p-3 flex items-start gap-2"
                    style={{ background: "rgba(13,27,46,0.6)", border: "1px solid rgba(0,245,255,0.06)" }}>
                    <Icon name={d.icon as "Tag"} size={12} className="text-[#3a5570] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-mono text-[9px] text-[#3a5570] tracking-wider mb-1">{d.label}</div>
                      <div className="font-mono text-xs text-[#8ab0cc]">{d.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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

            {/* ── Смена звания ── */}
            <div style={{ border: "1px solid rgba(255,190,50,0.15)", background: "rgba(255,190,50,0.02)" }}>
              <button onClick={handleOpenRankForm}
                className="w-full flex items-center justify-between px-4 py-3 transition-all"
                style={{ color: showRankForm ? "#ffbe32" : "#5a7a95" }}>
                <div className="flex items-center gap-2">
                  <Icon name="Award" size={14} />
                  <span className="font-mono text-xs tracking-wider">ИЗМЕНИТЬ ЗВАНИЕ</span>
                  {(profile?.rank || user.rank) && (
                    <span className="font-mono text-[10px] px-2 py-0.5"
                      style={{ background: "rgba(255,190,50,0.1)", border: "1px solid rgba(255,190,50,0.25)", color: "#ffbe32" }}>
                      {profile?.rank || user.rank}
                    </span>
                  )}
                </div>
                <Icon name={showRankForm ? "ChevronUp" : "ChevronDown"} size={14} />
              </button>

              {showRankForm && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,190,50,0.1)" }}>

                  {rankMsg && (
                    <div className="mt-3 p-2 font-mono text-xs"
                      style={{ background: rankMsg.ok ? "rgba(0,255,136,0.06)" : "rgba(255,34,68,0.06)", border: `1px solid ${rankMsg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: rankMsg.ok ? "#00ff88" : "#ff2244" }}>
                      {rankMsg.ok ? "✓" : "✗"} {rankMsg.text}
                    </div>
                  )}

                  {/* Новое звание */}
                  <div className="pt-3">
                    <label className="font-mono text-[10px] text-[#ffbe32] tracking-wider block mb-1.5">НОВОЕ ЗВАНИЕ *</label>
                    <select value={newRank} onChange={e => setNewRank(e.target.value)}
                      className="w-full bg-[#080d1a] font-plex text-sm text-white px-3 py-2 outline-none"
                      style={{ border: "1px solid rgba(255,190,50,0.3)" }}>
                      <option value="">— выберите звание —</option>
                      {RANKS.map(r => <option key={r} value={r} style={{ background: "#050810" }}>{r}</option>)}
                    </select>
                  </div>

                  {/* Реквизиты приказа */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">№ ПРИКАЗА</label>
                      <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
                        placeholder="123/2026"
                        className="w-full bg-transparent font-plex text-sm text-white px-3 py-2 outline-none"
                        style={{ border: "1px solid rgba(255,190,50,0.2)" }} />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ДАТА ПРИКАЗА</label>
                      <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                        className="w-full bg-transparent font-mono text-sm text-white px-3 py-2 outline-none"
                        style={{ border: "1px solid rgba(255,190,50,0.2)", colorScheme: "dark" }} />
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ПРИМЕЧАНИЕ</label>
                    <textarea value={rankNote} onChange={e => setRankNote(e.target.value)}
                      rows={2} placeholder="Основание, дополнительные сведения..."
                      className="w-full bg-transparent font-plex text-sm text-white px-3 py-2 outline-none resize-none"
                      style={{ border: "1px solid rgba(255,190,50,0.2)" }} />
                  </div>

                  {/* Прикрепить файл приказа */}
                  <div>
                    <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1.5">ФАЙЛ ПРИКАЗА (PDF, DOC, JPG...)</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => rankFileRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 font-mono text-xs transition-all"
                        style={{ border: "1px solid rgba(255,190,50,0.3)", color: "#ffbe32", background: "rgba(255,190,50,0.05)" }}>
                        <Icon name="Paperclip" size={12} />
                        {rankFile ? rankFile.name : "Прикрепить файл"}
                      </button>
                      {rankFile && (
                        <button onClick={() => { setRankFile(null); if (rankFileRef.current) rankFileRef.current.value = ""; }}
                          className="text-[#3a5570] hover:text-[#ff2244] transition-colors">
                          <Icon name="X" size={14} />
                        </button>
                      )}
                    </div>
                    <input ref={rankFileRef} type="file" className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setRankFile(f); }} />
                  </div>

                  <button onClick={saveRank} disabled={rankSaving || !newRank}
                    className="flex items-center gap-2 px-5 py-2.5 font-mono text-xs font-bold tracking-wider transition-all disabled:opacity-40"
                    style={{ border: "1px solid rgba(255,190,50,0.5)", color: "#ffbe32", background: "rgba(255,190,50,0.08)" }}>
                    <Icon name={rankSaving ? "Loader" : "Award"} size={13} className={rankSaving ? "animate-spin" : ""} />
                    {rankSaving ? "ПРИСВОЕНИЕ..." : "ПРИСВОИТЬ ЗВАНИЕ"}
                  </button>

                  {/* История приказов */}
                  {rankOrders.length > 0 && (
                    <div className="pt-2 border-t" style={{ borderColor: "rgba(255,190,50,0.1)" }}>
                      <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-2">ИСТОРИЯ ИЗМЕНЕНИЙ ЗВАНИЯ</div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {rankOrders.map(ord => (
                          <div key={ord.id} className="px-3 py-2.5"
                            style={{ background: "rgba(13,27,46,0.6)", border: "1px solid rgba(255,190,50,0.08)" }}>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-mono text-[10px] text-[#3a5570]">{ord.old_rank || "—"}</span>
                              <Icon name="ArrowRight" size={10} className="text-[#ffbe32]" />
                              <span className="font-mono text-xs font-bold text-[#ffbe32]">{ord.new_rank}</span>
                              {ord.order_number && (
                                <span className="font-mono text-[10px] text-[#5a7a95]">пр. №{ord.order_number}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              {ord.order_date && (
                                <span className="font-mono text-[9px] text-[#3a5570]">
                                  {new Date(ord.order_date).toLocaleDateString("ru-RU")}
                                </span>
                              )}
                              <span className="font-mono text-[9px] text-[#3a5570]">от: {ord.issued_by_name}</span>
                              {ord.note && <span className="font-plex text-[10px] text-[#5a7a95] truncate flex-1">{ord.note}</span>}
                              {ord.file_url && (
                                <a href={ord.file_url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1 font-mono text-[10px] text-[#00f5ff] hover:underline">
                                  <Icon name="FileText" size={10} />
                                  {ord.file_name || "Приказ"} {ord.file_size ? `(${fmtFileSize(ord.file_size)})` : ""}
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
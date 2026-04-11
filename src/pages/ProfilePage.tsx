import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { api } from "@/api";
import { User, Page } from "@/App";

interface UserStats {
  completed_count: number;
  lectures_done: number;
  videos_done: number;
  quizzes_passed: number;
  score: number;
  my_position: number | null;
}

interface Note {
  id: number;
  item_type: string;
  item_id: number;
  content: string;
  updated_at: string;
}

interface QuizResult {
  id: number;
  quiz_id: number;
  title: string;
  lecture_id: number;
  score: number;
  total: number;
  passed: boolean;
  completed_at: string;
}

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
  onNavigate: (page: Page) => void;
  onGoToAdmin?: () => void;
  onLogout?: () => void;
}

const RANKS = [
  "Рядовой", "Ефрейтор", "Младший сержант", "Сержант", "Старший сержант",
  "Старшина", "Прапорщик", "Старший прапорщик",
  "Младший лейтенант", "Лейтенант", "Старший лейтенант", "Капитан",
  "Майор", "Подполковник", "Полковник",
  "Генерал-майор", "Генерал-лейтенант", "Генерал-полковник", "Генерал армии",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru", { day: "2-digit", month: "long", year: "numeric" });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
      <span className="font-mono text-[9px] flex-shrink-0" style={{ color, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

function Field({ label, value, icon, locked }: { label: string; value?: string | null; icon: string; locked?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
      <Icon name={icon} size={13} className="text-[#3a5570] mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-0.5">{label}</div>
        <div className="font-plex text-sm text-white truncate">{value || <span className="text-[#2a4060]">не указано</span>}</div>
      </div>
      {locked && <Icon name="Lock" size={11} className="text-[#2a4060] mt-1 flex-shrink-0" />}
    </div>
  );
}

export default function ProfilePage({ user, onUpdate, onNavigate, onGoToAdmin, onLogout }: ProfilePageProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [totalLectures, setTotalLectures] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [rightTab, setRightTab] = useState<"notes" | "tests">("notes");
  const [deletingNote, setDeletingNote] = useState<number | null>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [rank, setRank] = useState(user.rank || "");
  const [contacts, setContacts] = useState(user.contacts || "");
  const [gender, setGender] = useState(user.gender || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Статистика
    api.progress.leaderboard().then(res => {
      const me = (res.leaderboard || []).find((r: { id: number }) => r.id === user.id);
      if (me) setStats({ ...me, my_position: res.my_position ?? null });
    }).catch(() => {});

    // Заметки
    api.progress.myNotes().then(res => {
      if (res.notes) setNotes(res.notes);
    }).catch(() => {});

    // Результаты тестов
    api.quizzes.myResults().then(res => {
      if (res.results) setQuizResults(res.results);
    }).catch(() => {});

    // Общее кол-во лекций и видео для прогресс-бара
    api.files.list("document").then(res => setTotalLectures((res.files || []).length)).catch(() => {});
    api.files.list("video").then(res => setTotalVideos((res.files || []).length)).catch(() => {});
  }, [user.id]);

  useEffect(() => {
    if (!editing) {
      setName(user.name || "");
      setRank(user.rank || "");
      setContacts(user.contacts || "");
      setGender(user.gender || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Имя не может быть пустым"); return; }
    setSaving(true); setError("");
    const res = await api.updateProfile({ name: name.trim(), rank, contacts, gender });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    onUpdate(res.user as User);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(user.name || ""); setRank(user.rank || "");
    setContacts(user.contacts || ""); setGender(user.gender || "");
    setError(""); setEditing(false);
  };

  const handleChangePw = async () => {
    if (!currentPw || !newPw || !newPw2) { setPwError("Заполните все поля"); return; }
    if (newPw !== newPw2) { setPwError("Пароли не совпадают"); return; }
    if (newPw.length < 6) { setPwError("Минимум 6 символов"); return; }
    setPwSaving(true); setPwError("");
    const res = await api.changePassword(currentPw, newPw);
    setPwSaving(false);
    if (res.error) { setPwError(res.error); return; }
    setPwSuccess(true);
    setCurrentPw(""); setNewPw(""); setNewPw2("");
    setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 2000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarError(""); setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const res = await api.uploadAvatar(dataUrl, ext);
      setUploadingAvatar(false);
      if (res.error) { setAvatarError(res.error); return; }
      if (res.user) onUpdate(res.user as User);
    };
    reader.readAsDataURL(file);
  };

  const deleteNote = async (id: number) => {
    setDeletingNote(id);
    await api.progress.noteDelete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    setDeletingNote(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ЛИЧНЫЙ КАБИНЕТ</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-6 tracking-wider">ЛИЧНОЕ ДЕЛО</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── ЛЕВАЯ КОЛОНКА ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Аватар + данные */}
          <div className="card-drone p-5">
            <div className="flex items-start gap-4 mb-5">
              <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <Avatar callsign={user.callsign} avatarUrl={user.avatar_url} size={72} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.65)" }}>
                  {uploadingAvatar
                    ? <Icon name="Loader" size={18} className="text-[#00f5ff] animate-spin" />
                    : <Icon name="Camera" size={18} className="text-white" />}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-orbitron text-base font-bold text-white tracking-wider truncate">{user.callsign || "—"}</div>
                <div className="font-mono text-[10px] text-[#3a5570] mt-0.5 mb-1">ПОЗЫВНОЙ</div>
                <div className="flex flex-wrap gap-1">
                  {user.rank && (
                    <span className="font-mono text-[10px] text-[#00ff88]">{user.rank}</span>
                  )}
                  {user.role && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5"
                      style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>
                      {user.role.toUpperCase()}
                    </span>
                  )}
                  {user.is_admin && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5"
                      style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#ff6b00" }}>
                      ADMIN
                    </span>
                  )}
                </div>
                {avatarError && <div className="font-mono text-[10px] text-[#ff2244] mt-1">{avatarError}</div>}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                <span className="font-mono text-[10px] text-[#5a7a95]">ONLINE</span>
              </div>
            </div>

            {/* Fields / Edit */}
            {!editing ? (
              <div>
                <Field label="ИМЯ" value={user.name} icon="UserCheck" />
                <Field label="ПОЛ" value={user.gender === "male" ? "Мужской" : user.gender === "female" ? "Женский" : undefined} icon="User" />
                <Field label="ЗВАНИЕ" value={user.rank} icon="Award" />
                <Field label="КОНТАКТЫ" value={user.contacts} icon="Phone" />
                <Field label="EMAIL" value={user.email} icon="Mail" locked />
                {success && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#00ff88] mt-3">
                    <Icon name="CheckCircle" size={12} /> Профиль обновлён
                  </div>
                )}
                <button onClick={() => setEditing(true)} className="btn-neon flex items-center gap-2 mt-4 text-xs">
                  <Icon name="Pencil" size={12} /> РЕДАКТИРОВАТЬ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "ИМЯ", val: name, set: setName, type: "input" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="font-mono text-[10px] text-[#5a7a95] tracking-wider block mb-1">{f.label}</label>
                    <input className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                      style={{ borderColor: "rgba(0,245,255,0.25)" }}
                      value={f.val} onChange={e => f.set(e.target.value)} />
                  </div>
                ))}
                <div>
                  <label className="font-mono text-[10px] text-[#5a7a95] tracking-wider block mb-1">ПОЛ</label>
                  <select className="w-full bg-[#080d1a] border font-plex text-sm text-white px-3 py-2 outline-none"
                    style={{ borderColor: "rgba(0,245,255,0.25)" }}
                    value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">— не указано —</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[#5a7a95] tracking-wider block mb-1">ЗВАНИЕ</label>
                  <select className="w-full bg-[#080d1a] border font-plex text-sm text-white px-3 py-2 outline-none"
                    style={{ borderColor: "rgba(0,245,255,0.25)" }}
                    value={rank} onChange={e => setRank(e.target.value)}>
                    <option value="">— не указано —</option>
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[#5a7a95] tracking-wider block mb-1">КОНТАКТЫ</label>
                  <textarea className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none resize-none"
                    style={{ borderColor: "rgba(0,245,255,0.25)" }}
                    rows={2} value={contacts} onChange={e => setContacts(e.target.value)}
                    placeholder="Telegram, телефон..." />
                </div>
                {error && <div className="flex items-center gap-1.5 font-mono text-xs text-[#ff2244]"><Icon name="AlertCircle" size={12} />{error}</div>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving} className="btn-neon flex items-center gap-1.5 text-xs disabled:opacity-50">
                    {saving ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Save" size={11} />}
                    {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
                  </button>
                  <button onClick={handleCancel} className="font-mono text-xs px-3 py-2 text-[#3a5570] hover:text-white transition-colors" style={{ border: "1px solid #1a2a3a" }}>
                    ОТМЕНА
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Смена пароля */}
          <div className="p-4" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.02)" }}>
            <button onClick={() => { setShowChangePw(!showChangePw); setPwError(""); }}
              className="w-full flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <Icon name="KeyRound" size={13} className="text-[#3a5570]" />
                <span className="font-mono text-xs text-[#3a5570] tracking-wider group-hover:text-[#00f5ff] transition-colors">СМЕНИТЬ ПАРОЛЬ</span>
              </div>
              <Icon name={showChangePw ? "ChevronUp" : "ChevronDown"} size={13} className="text-[#3a5570]" />
            </button>
            {showChangePw && (
              <div className="mt-4 space-y-3">
                {[
                  { label: "ТЕКУЩИЙ ПАРОЛЬ", val: currentPw, set: setCurrentPw },
                  { label: "НОВЫЙ ПАРОЛЬ", val: newPw, set: setNewPw },
                  { label: "ПОВТОРИТЕ НОВЫЙ", val: newPw2, set: setNewPw2 },
                ].map(f => (
                  <div key={f.label}>
                    <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">{f.label}</label>
                    <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                      className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                      style={{ borderColor: "rgba(0,245,255,0.2)" }} />
                  </div>
                ))}
                {pwError && <div className="flex items-center gap-1.5 font-mono text-xs text-[#ff2244]"><Icon name="AlertCircle" size={12} />{pwError}</div>}
                {pwSuccess && <div className="flex items-center gap-1.5 font-mono text-xs text-[#00ff88]"><Icon name="CheckCircle" size={12} />Пароль изменён</div>}
                <button onClick={handleChangePw} disabled={pwSaving} className="btn-neon flex items-center gap-1.5 text-xs disabled:opacity-50">
                  {pwSaving ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Save" size={11} />}
                  {pwSaving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
                </button>
              </div>
            )}
          </div>

          {/* Быстрые действия */}
          <div className="space-y-2">
            {(user.is_admin || user.role?.startsWith("инструктор")) && (
              <button onClick={() => onNavigate("content-upload")}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all group"
                style={{ border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.03)" }}>
                <Icon name="Upload" size={15} className="text-[#00ff88] flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-mono text-xs text-[#00ff88] group-hover:text-white transition-colors">ЗАГРУЗИТЬ МАТЕРИАЛЫ</div>
                  <div className="font-mono text-[10px] text-[#3a5570]">Видео, документы, прошивки</div>
                </div>
                <Icon name="ChevronRight" size={13} className="text-[#3a5570] flex-shrink-0" />
              </button>
            )}
            {user.is_admin && onGoToAdmin && (
              <button onClick={onGoToAdmin}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all group"
                style={{ border: "1px solid rgba(255,107,0,0.25)", background: "rgba(255,107,0,0.03)" }}>
                <Icon name="LayoutDashboard" size={15} className="text-[#ff6b00] flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-mono text-xs text-[#ff6b00] group-hover:text-white transition-colors">ПАНЕЛЬ АДМИНИСТРАТОРА</div>
                  <div className="font-mono text-[10px] text-[#3a5570]">Управление составом и контентом</div>
                </div>
                <Icon name="ChevronRight" size={13} className="text-[#3a5570] flex-shrink-0" />
              </button>
            )}
            <button onClick={() => { api.logout(); onLogout?.(); }}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all group"
              style={{ border: "1px solid rgba(255,34,68,0.15)", background: "transparent" }}>
              <Icon name="LogOut" size={15} className="text-[#ff2244] flex-shrink-0" />
              <span className="font-mono text-xs text-[#3a5570] group-hover:text-[#ff2244] transition-colors">ВЫЙТИ ИЗ СИСТЕМЫ</span>
            </button>
          </div>

          {/* Учётные данные */}
          <div className="px-4 py-3 font-mono text-[10px] text-[#2a4060]"
            style={{ border: "1px solid rgba(0,245,255,0.06)" }}>
            <Icon name="Info" size={11} className="text-[#2a4060] inline mr-1.5" />
            Позывной и email изменить нельзя — обратитесь к администратору
          </div>
        </div>

        {/* ── ПРАВАЯ КОЛОНКА ── */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Статистика + прогресс */}
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
                <div key={i} className="h-20 animate-pulse" style={{ border: "1px solid rgba(0,245,255,0.06)", background: "rgba(0,245,255,0.03)" }} />
              ))}
            </div>

            {/* Прогресс-бары */}
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

          {/* Заметки и тесты — вкладки */}
          <div style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,7,14,0.8)" }}>
            <div className="flex border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
              {([
                { key: "notes" as const, label: "МОИ ЗАМЕТКИ", icon: "PenLine", count: notes.length },
                { key: "tests" as const, label: "МОИ ТЕСТЫ", icon: "ClipboardCheck", count: quizResults.length },
              ]).map(t => (
                <button key={t.key} onClick={() => setRightTab(t.key)}
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
                      style={{ background: rightTab === t.key ? "rgba(0,245,255,0.15)" : "rgba(0,245,255,0.06)", color: rightTab === t.key ? "#00f5ff" : "#3a5570" }}>
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
                    <button onClick={() => deleteNote(note.id)}
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
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${item.color}08`; (e.currentTarget as HTMLElement).style.borderColor = `${item.color}25`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.08)"; }}>
                <Icon name={item.icon as "Trophy"} size={13} style={{ color: item.color }} />
                <span className="font-mono text-[11px] text-[#5a7a95] group-hover:text-white transition-colors">{item.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

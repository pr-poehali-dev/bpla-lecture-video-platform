import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import { User, Page } from "@/App";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { Note, UserStats, RANKS } from "./profile/ProfileTypes";
import ProfileStats from "./profile/ProfileStats";
import ProfileActivity from "./profile/ProfileActivity";

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
  onNavigate: (page: Page) => void;
  onGoToAdmin?: () => void;
  onLogout?: () => void;
}

// Бейдж звания — цвет по уровню
function rankColor(rank?: string) {
  if (!rank) return "#3a5570";
  if (rank.includes("Генерал")) return "#ffbe32";
  if (rank.includes("Полковник") || rank.includes("Подполковник")) return "#ff6b00";
  if (rank.includes("Майор") || rank.includes("Капитан")) return "#00f5ff";
  if (rank.includes("Лейтенант") || rank.includes("Прапорщик")) return "#00ff88";
  return "#5a7a95";
}

export default function ProfilePage({ user, onUpdate, onNavigate, onGoToAdmin, onLogout }: ProfilePageProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Data
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [totalLectures] = useState(0);
  const [totalVideos] = useState(0);
  const [deletingNote, setDeletingNote] = useState<number | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [rank, setRank] = useState(user.rank || "");
  const [contacts, setContacts] = useState(user.contacts || "");
  const [gender, setGender] = useState(user.gender || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Notes tab
  const [rightTab, setRightTab] = useState<"notes" | "upload">("notes");

  useEffect(() => {
    api.progress.myNotes().then(res => { if (res.notes) setNotes(res.notes); }).catch(() => {});
    api.progress.myProgress().then(res => {
      const rows: { item_type: string }[] = res.progress || [];
      const lectures_done = rows.filter(r => r.item_type === "lecture").length;
      const videos_done   = rows.filter(r => r.item_type === "video").length;
      setStats({ lectures_done, videos_done, quizzes_passed: 0, score: lectures_done * 10 + videos_done * 5 });
    }).catch(() => {});

    api.quizzes.myResults().then(res => {
      const passed = (res.results || []).filter((r: { passed: boolean }) => r.passed).length;
      setStats(prev => prev ? { ...prev, quizzes_passed: passed, score: (prev.lectures_done * 10) + (prev.videos_done * 5) + (passed * 25) } : null);
    }).catch(() => {});
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

  const rColor = rankColor(user.rank);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* ── Баннер профиля ── */}
      <div className="relative mb-6 overflow-hidden"
        style={{ background: "rgba(4,10,22,0.95)", border: "1px solid rgba(0,245,255,0.15)" }}>

        {/* Фоновая сетка */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        {/* Свечение */}
        <div className="absolute right-0 top-0 bottom-0 w-72 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at right center, rgba(0,245,255,0.05) 0%, transparent 70%)" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 px-5 sm:px-8 py-6">

          {/* Аватар */}
          <div className="relative flex-shrink-0 group cursor-pointer self-start sm:self-auto"
            onClick={() => avatarInputRef.current?.click()}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden"
              style={{ border: `2px solid ${rColor}60`, boxShadow: `0 0 24px ${rColor}25` }}>
              <Avatar callsign={user.callsign} avatarUrl={user.avatar_url} size={96} />
            </div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.6)" }}>
              {uploadingAvatar
                ? <Icon name="Loader" size={20} className="text-white animate-spin" />
                : <Icon name="Camera" size={20} className="text-white" />}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            {avatarError && <div className="absolute top-full mt-1 font-mono text-[9px] text-[#ff2244] whitespace-nowrap">{avatarError}</div>}
          </div>

          {/* Инфо */}
          <div className="flex-1 min-w-0">
            {/* Позывной + статусы */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"
                  style={{ boxShadow: "0 0 6px #00ff88", animation: "pulse 2s infinite" }} />
                <span className="font-mono text-[10px] text-[#00ff88] tracking-[0.2em]">В СЕТИ</span>
              </div>
              <span className="font-mono text-[10px] text-[#3a5570]">·</span>
              <span className="font-mono text-[10px] text-[#3a5570] tracking-[0.2em]">// ЛИЧНОЕ ДЕЛО</span>
            </div>

            <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white tracking-wider truncate mb-1">
              {user.callsign || user.name}
            </h1>

            {/* Звание + роль */}
            <div className="flex items-center gap-2 flex-wrap">
              {user.rank && (
                <span className="font-mono text-xs px-2.5 py-1 font-bold"
                  style={{ background: `${rColor}12`, border: `1px solid ${rColor}40`, color: rColor }}>
                  {user.rank.toUpperCase()}
                </span>
              )}
              {user.role && (
                <span className="font-mono text-[10px] px-2 py-0.5"
                  style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>
                  {user.role.toUpperCase()}
                </span>
              )}
              {user.is_admin && (
                <span className="font-mono text-[10px] px-2 py-0.5"
                  style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#ff6b00" }}>
                  ADMIN
                </span>
              )}
              {user.name && user.callsign && (
                <span className="font-plex text-sm text-[#3a5570]">{user.name}</span>
              )}
            </div>
          </div>

          {/* Статистика в баннере */}
          {stats && (
            <div className="flex gap-4 sm:gap-6 flex-shrink-0 flex-wrap">
              {[
                { label: "Лекций", value: stats.lectures_done, color: "#00f5ff", icon: "BookOpen" },
                { label: "Видео",  value: stats.videos_done,   color: "#00f5ff", icon: "Play"     },
                { label: "Тестов", value: stats.quizzes_passed,color: "#00ff88", icon: "ClipboardCheck" },
                { label: "Очков",  value: stats.score,         color: "#ffbe32", icon: "Trophy"   },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center">
                  <div className="font-orbitron text-xl font-black" style={{ color: s.value > 0 ? s.color : "#2a4060" }}>{s.value}</div>
                  <div className="font-mono text-[9px] text-[#3a5570] mt-0.5">{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {onGoToAdmin && (
              <button onClick={onGoToAdmin}
                className="font-mono text-[10px] px-3 py-1.5 flex items-center gap-1.5 transition-all"
                style={{ border: "1px solid rgba(255,107,0,0.3)", color: "#ff6b00", background: "rgba(255,107,0,0.05)" }}>
                <Icon name="Shield" size={11} /> Панель админа
              </button>
            )}
            {onLogout && (
              <button onClick={onLogout}
                className="font-mono text-[10px] px-3 py-1.5 flex items-center gap-1.5 transition-all"
                style={{ border: "1px solid rgba(255,34,68,0.2)", color: "#ff2244", background: "transparent" }}>
                <Icon name="LogOut" size={11} /> Выйти
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Три секции ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Секция 1: Данные бойца ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4" style={{ background: "#00f5ff", boxShadow: "0 0 6px #00f5ff" }} />
            <div className="font-mono text-[10px] text-[#00f5ff] tracking-[0.3em]">ДАННЫЕ БОЙЦА</div>
          </div>

          <div className="p-5 flex flex-col gap-4"
            style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,7,14,0.8)" }}>

            {!editing ? (
              <>
                {/* Поля */}
                {[
                  { label: "ИМЯ", value: user.name, icon: "UserCheck" },
                  { label: "ПОЛ", value: user.gender === "male" ? "Мужской" : user.gender === "female" ? "Женский" : undefined, icon: "User" },
                  { label: "ЗВАНИЕ", value: user.rank, icon: "Award" },
                  { label: "№ ЖЕТОНА", value: user.dog_tag, icon: "Tag" },
                  { label: "ПОДРАЗДЕЛЕНИЕ", value: user.unit, icon: "Shield" },
                  { label: "КОНТАКТЫ", value: user.contacts, icon: "Phone" },
                  { label: "EMAIL", value: user.email, icon: "Mail" },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-3 py-2 border-b last:border-b-0"
                    style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                    <Icon name={f.icon as "Mail"} size={13} className="text-[#3a5570] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-0.5">{f.label}</div>
                      <div className="font-plex text-sm text-white truncate">
                        {f.value || <span className="text-[#2a4060]">не указано</span>}
                      </div>
                    </div>
                    {f.label === "EMAIL" && <Icon name="Lock" size={11} className="text-[#2a4060] mt-1 flex-shrink-0" />}
                  </div>
                ))}

                {success && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#00ff88]">
                    <Icon name="CheckCircle" size={12} /> Профиль обновлён
                  </div>
                )}

                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all mt-1"
                  style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
                  <Icon name="Pencil" size={12} /> РЕДАКТИРОВАТЬ
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-[10px] text-[#5a7a95] tracking-wider block mb-1">ИМЯ</label>
                  <input className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                    style={{ borderColor: "rgba(0,245,255,0.25)" }}
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
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
                    placeholder="Позывная радиостанции, личный номер..." />
                </div>
                {error && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#ff2244]">
                    <Icon name="AlertCircle" size={12} />{error}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 font-mono text-xs disabled:opacity-50 transition-all"
                    style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
                    {saving ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Save" size={11} />}
                    {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
                  </button>
                  <button onClick={handleCancel}
                    className="px-3 py-2 font-mono text-xs text-[#3a5570] hover:text-white transition-colors"
                    style={{ border: "1px solid #1a2a3a" }}>
                    ОТМЕНА
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Смена пароля */}
          <div style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(4,7,14,0.6)" }}>
            <button
              onClick={() => setShowChangePw(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 font-mono text-xs transition-all"
              style={{ color: showChangePw ? "#00f5ff" : "#3a5570" }}>
              <div className="flex items-center gap-2">
                <Icon name="KeyRound" size={13} />
                СМЕНИТЬ ПАРОЛЬ
              </div>
              <Icon name={showChangePw ? "ChevronUp" : "ChevronDown"} size={13} />
            </button>

            {showChangePw && (
              <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                {[
                  { label: "ТЕКУЩИЙ ПАРОЛЬ", val: currentPw, set: setCurrentPw },
                  { label: "НОВЫЙ ПАРОЛЬ",   val: newPw,     set: setNewPw     },
                  { label: "ПОВТОРИТЕ",       val: newPw2,    set: setNewPw2    },
                ].map(f => (
                  <div key={f.label} className="pt-3 first:pt-3">
                    <label className="font-mono text-[10px] text-[#5a7a95] tracking-wider block mb-1">{f.label}</label>
                    <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                      className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                      style={{ borderColor: "rgba(0,245,255,0.2)" }} />
                  </div>
                ))}
                {pwError && <div className="font-mono text-xs text-[#ff2244]">{pwError}</div>}
                {pwSuccess && <div className="font-mono text-xs text-[#00ff88]">Пароль изменён</div>}
                <button onClick={handleChangePw} disabled={pwSaving}
                  className="flex items-center gap-1.5 px-4 py-2 font-mono text-xs disabled:opacity-50 transition-all"
                  style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
                  {pwSaving ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Check" size={11} />}
                  {pwSaving ? "СОХРАНЕНИЕ..." : "ПРИМЕНИТЬ"}
                </button>
              </div>
            )}
          </div>

          {/* Правила */}
          <button onClick={() => onNavigate("rules")}
            className="flex items-center gap-2 px-4 py-2.5 font-mono text-xs transition-all"
            style={{ border: "1px solid rgba(0,245,255,0.08)", color: "#3a5570" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#00f5ff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#3a5570"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.08)"; }}>
            <Icon name="ScrollText" size={13} /> ПРАВИЛА ПЛАТФОРМЫ
          </button>
        </div>

        {/* ── Секция 2: Заметки ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4" style={{ background: "#a855f7", boxShadow: "0 0 6px #a855f7" }} />
            <div className="font-mono text-[10px] text-[#a855f7] tracking-[0.3em]">МОИ ЗАМЕТКИ</div>
          </div>

          <ProfileActivity
            user={user}
            notes={notes}
            rightTab={rightTab}
            deletingNote={deletingNote}
            onSetRightTab={setRightTab}
            onDeleteNote={deleteNote}
            onNavigate={onNavigate}
          />
        </div>

        {/* ── Секция 3: Прогресс ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4" style={{ background: "#ffbe32", boxShadow: "0 0 6px #ffbe32" }} />
            <div className="font-mono text-[10px] text-[#ffbe32] tracking-[0.3em]">ПРОГРЕСС ОБУЧЕНИЯ</div>
          </div>

          <ProfileStats stats={stats} totalLectures={totalLectures} totalVideos={totalVideos} />
        </div>
      </div>
    </div>
  );
}
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

export default function ProfilePage({ user, onUpdate, onNavigate, onGoToAdmin, onLogout }: ProfilePageProps) {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    api.progress.leaderboard().then(res => {
      const me = (res.leaderboard || []).find((r: { id: number }) => r.id === user.id);
      if (me) setStats({ ...me, my_position: res.my_position ?? null });
    }).catch(() => {});
  }, [user.id]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [rank, setRank] = useState(user.rank || "");
  const [contacts, setContacts] = useState(user.contacts || "");
  const [gender, setGender] = useState(user.gender || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!editing) {
      setName(user.name || "");
      setRank(user.rank || "");
      setContacts(user.contacts || "");
      setGender(user.gender || "");
    }
  }, [user]);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !newPassword2) { setPwError("Заполните все поля"); return; }
    if (newPassword !== newPassword2) { setPwError("Новые пароли не совпадают"); return; }
    if (newPassword.length < 6) { setPwError("Минимум 6 символов"); return; }
    setPwSaving(true);
    setPwError("");
    const res = await api.changePassword(currentPassword, newPassword);
    setPwSaving(false);
    if (res.error) { setPwError(res.error); return; }
    setPwSuccess(true);
    setCurrentPassword(""); setNewPassword(""); setNewPassword2("");
    setTimeout(() => { setPwSuccess(false); setShowChangePassword(false); }, 2000);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Имя не может быть пустым"); return; }
    setSaving(true);
    setError("");
    const res = await api.updateProfile({ name: name.trim(), rank, contacts, gender });
    setSaving(false);
    if (res.error) {
      if (res.error === "Сессия недействительна" || res.statusCode === 401) {
        setError("Сессия истекла. Перезайдите в систему.");
      } else {
        setError(res.error);
      }
      return;
    }
    onUpdate(res.user as User);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(user.name || "");
    setRank(user.rank || "");
    setContacts(user.contacts || "");
    setGender(user.gender || "");
    setError("");
    setEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarError("");
    setUploadingAvatar(true);
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ЛИЧНЫЙ КАБИНЕТ</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-6 sm:mb-8 tracking-wider">ЛИЧНОЕ ДЕЛО</h1>

      <div className="max-w-2xl">
        {/* Stats block */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "ЛЕКЦИЙ", value: stats.lectures_done, icon: "BookOpen", color: "#00f5ff" },
              { label: "ВИДЕО", value: stats.videos_done, icon: "Play", color: "#00f5ff" },
              { label: "ТЕСТОВ", value: stats.quizzes_passed, icon: "ClipboardCheck", color: "#00ff88" },
              { label: stats.my_position ? `#${stats.my_position} РЕЙТИНГ` : "ОЧКОВ", value: stats.my_position ?? stats.score, icon: "Trophy", color: "#ffbe32" },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center justify-center py-4 gap-1"
                style={{ border: `1px solid ${s.color}20`, background: `${s.color}06` }}>
                <Icon name={s.icon as "Trophy"} size={16} style={{ color: s.color }} />
                <div className="font-orbitron text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="font-mono text-[9px] text-[#3a5570] tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Avatar + callsign block */}
        <div className="card-drone p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-4 sm:gap-5 mb-5 sm:mb-6">
            <div className="relative flex-shrink-0 group">
              <Avatar callsign={user.callsign} avatarUrl={user.avatar_url} size={72} />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                style={{ background: "rgba(0,0,0,0.7)" }}
                title="Загрузить фото"
              >
                {uploadingAvatar
                  ? <Icon name="Loader" size={20} className="text-[#00f5ff] animate-spin" />
                  : <Icon name="Camera" size={20} className="text-white" />
                }
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="flex-1">
              <div className="font-orbitron text-lg font-bold text-white tracking-wider">{user.callsign || "—"}</div>
              <div className="font-mono text-xs text-[#3a5570] mt-0.5">ПОЗЫВНОЙ</div>
              {user.rank && <div className="font-mono text-xs text-[#00ff88] mt-1">{user.rank}</div>}
              {user.role && (
                <div className="font-mono text-[10px] mt-1 px-2 py-0.5 inline-block" style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>
                  {user.role.toUpperCase()}
                </div>
              )}
              {user.is_admin && (
                <div className="font-mono text-[10px] mt-1 ml-1 px-2 py-0.5 inline-block" style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#ff6b00" }}>
                  АДМИНИСТРАТОР
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="font-mono text-[10px] text-[#3a5570] hover:text-[#00f5ff] transition-colors mt-2 flex items-center gap-1 disabled:opacity-40"
              >
                <Icon name="Camera" size={10} />
                {uploadingAvatar ? "ЗАГРУЗКА..." : "СМЕНИТЬ ФОТО"}
              </button>
              {avatarError && <div className="font-mono text-[10px] text-[#ff2244] mt-1">{avatarError}</div>}
            </div>

            <div className="ml-auto flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                <span className="font-mono text-xs text-[#5a7a95] hidden sm:inline">ONLINE</span>
              </div>
            </div>
          </div>

          {/* Fields */}
          {!editing ? (
            <div className="space-y-4">
              <Field label="ИМЯ" value={user.name} icon="UserCheck" />
              <Field label="ПОЛ" value={user.gender === "male" ? "Мужской" : user.gender === "female" ? "Женский" : undefined} icon="User" />
              <Field label="ЗВАНИЕ" value={user.rank} icon="Award" />
              <Field label="КОНТАКТЫ" value={user.contacts} icon="Phone" />
              <Field label="EMAIL" value={user.email} icon="Mail" locked />
              {success && (
                <div className="flex items-center gap-2 font-mono text-xs text-[#00ff88] mt-2">
                  <Icon name="CheckCircle" size={13} />
                  Профиль обновлён
                </div>
              )}
              <button onClick={() => setEditing(true)} className="btn-neon flex items-center gap-2 mt-4">
                <Icon name="Pencil" size={13} />
                РЕДАКТИРОВАТЬ
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">ИМЯ</label>
                <input
                  className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                  style={{ borderColor: "rgba(0,245,255,0.25)" }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите имя"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">ПОЛ</label>
                <select
                  className="w-full bg-[#080d1a] border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                  style={{ borderColor: "rgba(0,245,255,0.25)" }}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">— не указано —</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">ЗВАНИЕ</label>
                <select
                  className="w-full bg-[#080d1a] border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                  style={{ borderColor: "rgba(0,245,255,0.25)" }}
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                >
                  <option value="">— не указано —</option>
                  {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">КОНТАКТЫ</label>
                <textarea
                  className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
                  style={{ borderColor: "rgba(0,245,255,0.25)" }}
                  rows={3}
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  placeholder="Telegram, телефон, другие способы связи"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 font-mono text-xs text-[#ff2244]">
                  <Icon name="AlertCircle" size={13} />
                  {error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-neon flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto">
                  {saving ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Save" size={13} />}
                  {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
                </button>
                <button onClick={handleCancel} className="font-mono text-xs px-4 py-2.5 sm:py-2 text-[#3a5570] hover:text-white transition-colors w-full sm:w-auto text-center" style={{ border: "1px solid #1a2a3a" }}>
                  ОТМЕНА
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Быстрые действия */}
        <div className="space-y-2 mb-6">
          {(user.is_admin || user.role?.startsWith("инструктор")) && (
            <button
              onClick={() => onNavigate("content-upload")}
              className="w-full flex items-center gap-3 px-5 py-4 transition-all group"
              style={{ border: "1px solid rgba(0,255,136,0.25)", background: "rgba(0,255,136,0.04)" }}
            >
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,255,136,0.3)", background: "rgba(0,255,136,0.08)" }}>
                <Icon name="Upload" size={16} className="text-[#00ff88]" />
              </div>
              <div className="text-left flex-1">
                <div className="font-orbitron text-sm font-bold text-[#00ff88] tracking-wider group-hover:text-white transition-colors">ЗАГРУЗИТЬ МАТЕРИАЛЫ</div>
                <div className="font-mono text-xs text-[#3a5570] mt-0.5">Видео, документы, прошивки</div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-[#3a5570] group-hover:text-[#00ff88] transition-colors" />
            </button>
          )}
          {user.is_admin && onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="w-full flex items-center gap-3 px-5 py-4 transition-all group"
              style={{ border: "1px solid rgba(255,107,0,0.35)", background: "rgba(255,107,0,0.04)" }}
            >
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(255,107,0,0.4)", background: "rgba(255,107,0,0.08)" }}>
                <Icon name="LayoutDashboard" size={16} className="text-[#ff6b00]" />
              </div>
              <div className="text-left flex-1">
                <div className="font-orbitron text-sm font-bold text-[#ff6b00] tracking-wider group-hover:text-white transition-colors">ПАНЕЛЬ АДМИНИСТРАТОРА</div>
                <div className="font-mono text-xs text-[#3a5570] mt-0.5">Управление составом, контентом, правами</div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-[#3a5570] group-hover:text-[#ff6b00] transition-colors" />
            </button>
          )}
        </div>

        {/* Change password */}
        <div className="p-4" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.02)" }}>
          <button
            onClick={() => { setShowChangePassword(!showChangePassword); setPwError(""); }}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Icon name="KeyRound" size={13} className="text-[#3a5570]" />
              <span className="font-mono text-xs text-[#3a5570] tracking-wider group-hover:text-[#00f5ff] transition-colors">СМЕНИТЬ ПАРОЛЬ</span>
            </div>
            <Icon name={showChangePassword ? "ChevronUp" : "ChevronDown"} size={13} className="text-[#3a5570]" />
          </button>

          {showChangePassword && (
            <div className="mt-4 space-y-3">
              {(["Текущий пароль", "Новый пароль", "Повторите новый"] as const).map((label, i) => {
                const vals = [currentPassword, newPassword, newPassword2];
                const setters = [setCurrentPassword, setNewPassword, setNewPassword2];
                return (
                  <div key={label}>
                    <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">{label.toUpperCase()}</label>
                    <input
                      type="password"
                      value={vals[i]}
                      onChange={(e) => setters[i](e.target.value)}
                      className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                      style={{ borderColor: "rgba(0,245,255,0.2)" }}
                    />
                  </div>
                );
              })}
              {pwError && (
                <div className="flex items-center gap-2 font-mono text-xs text-[#ff2244]">
                  <Icon name="AlertCircle" size={12} />{pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 font-mono text-xs text-[#00ff88]">
                  <Icon name="CheckCircle" size={12} />Пароль изменён
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={pwSaving}
                className="btn-neon flex items-center gap-2 disabled:opacity-50"
              >
                {pwSaving ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Save" size={12} />}
                {pwSaving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.02)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Info" size={12} className="text-[#3a5570]" />
            <span className="font-mono text-xs text-[#3a5570] tracking-wider">УЧЁТНЫЕ ДАННЫЕ</span>
          </div>
          <div className="font-mono text-xs text-[#2a4060]">
            Позывной и email изменить нельзя — обратитесь к администратору
          </div>
        </div>
      </div>


    </div>
  );
}

function Field({ label, value, icon, locked }: { label: string; value?: string | null; icon: string; locked?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
      <Icon name={icon} size={14} className="text-[#3a5570] mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-0.5">{label}</div>
        <div className="font-plex text-sm text-white">{value || <span className="text-[#2a4060]">не указано</span>}</div>
      </div>
      {locked && <Icon name="Lock" size={12} className="text-[#2a4060] mt-1" />}
    </div>
  );
}
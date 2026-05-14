import { useState, useEffect } from "react";
import { api } from "@/api";
import { User, Page } from "@/App";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import ProfileCard from "./profile/ProfileCard";
import InstructorFilesManager from "./instructor/InstructorFilesManager";
import InstructorScheduleTab from "./instructor/InstructorScheduleTab";
import InstructorSheetsTab from "./instructor/InstructorSheetsTab";
import InstructorNotesTab from "./instructor/InstructorNotesTab";
import InstructorDashboard from "./instructor/InstructorDashboard";

type Tab = "dashboard" | "files" | "notes" | "schedule" | "sheets" | "profile";

const TABS: { id: Tab; label: string; icon: string; color: string; activeColor: string }[] = [
  { id: "dashboard", label: "Обзор",      icon: "LayoutDashboard", color: "rgba(0,245,255,0.12)",   activeColor: "#00f5ff" },
  { id: "files",     label: "Материалы",  icon: "FolderOpen",      color: "rgba(0,255,136,0.12)",   activeColor: "#00ff88" },
  { id: "notes",     label: "Конспекты",  icon: "BookOpen",        color: "rgba(255,107,0,0.12)",   activeColor: "#ff6b00" },
  { id: "schedule",  label: "Расписание", icon: "CalendarDays",    color: "rgba(0,245,255,0.12)",   activeColor: "#00f5ff" },
  { id: "sheets",    label: "Ведомости",  icon: "ClipboardList",   color: "rgba(168,85,247,0.12)",  activeColor: "#a855f7" },
  { id: "profile",   label: "Личное дело",icon: "UserCircle",      color: "rgba(255,190,50,0.12)",  activeColor: "#ffbe32" },
];

interface Props {
  user: User;
  onUpdate: (user: User) => void;
  onNavigate: (page: Page) => void;
  onGoToAdmin?: () => void;
  onLogout?: () => void;
}

export default function InstructorPage({ user, onUpdate, onNavigate, onGoToAdmin, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("dashboard");

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

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* ── Баннер инструктора ── */}
      <div className="relative mb-6 overflow-hidden"
        style={{ background: "rgba(4,10,22,0.95)", border: "1px solid rgba(0,255,136,0.15)" }}>

        {/* Декоративная сетка фона */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        {/* Свечение справа */}
        <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at right center, rgba(0,255,136,0.06) 0%, transparent 70%)" }} />

        <div className="relative flex items-center gap-5 px-5 sm:px-8 py-5 sm:py-6">
          {/* Аватар */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden"
              style={{ border: "2px solid rgba(0,255,136,0.4)", boxShadow: "0 0 20px rgba(0,255,136,0.2)" }}>
              <Avatar callsign={user.callsign} avatarUrl={user.avatar_url} size={64} />
            </div>
          </div>

          {/* Инфо */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-mono text-[10px] text-[#00ff88] tracking-[0.3em]">// ИНСТРУКТОР</span>
              <span className="font-mono text-[9px] px-2 py-0.5 tracking-wider"
                style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88" }}>
                {user.role?.toUpperCase() || "ИНСТРУКТОР"}
              </span>
            </div>
            <h1 className="font-orbitron text-xl sm:text-2xl font-black text-white tracking-wider truncate">
              {user.callsign || user.name}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {user.rank && (
                <span className="font-plex text-sm text-[#5a7a95]">{user.rank}</span>
              )}
              {user.name && user.callsign && (
                <span className="font-plex text-xs text-[#3a5570]">{user.name}</span>
              )}
            </div>
          </div>

          {/* Статус онлайн */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]"
                style={{ boxShadow: "0 0 6px #00ff88", animation: "pulse 2s infinite" }} />
              <span className="font-mono text-[10px] text-[#00ff88]">В СЕТИ</span>
            </div>
            {onGoToAdmin && (
              <button onClick={onGoToAdmin}
                className="font-mono text-[10px] px-3 py-1.5 transition-all flex items-center gap-1.5"
                style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
                <Icon name="Shield" size={11} /> Панель админа
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Вкладки ── */}
      <div className="flex overflow-x-auto mb-6 gap-1 pb-px"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {TABS.map(t => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 font-mono text-xs tracking-wider transition-all flex-shrink-0 whitespace-nowrap"
              style={{
                background: isActive ? t.color : "transparent",
                border: `1px solid ${isActive ? t.activeColor + "50" : "rgba(0,245,255,0.08)"}`,
                color: isActive ? t.activeColor : "#3a5570",
                boxShadow: isActive ? `0 0 12px ${t.activeColor}20` : "none",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = t.activeColor; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#3a5570"; }}
            >
              <Icon name={t.icon as "FolderOpen"} size={13} />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(" ")[0].slice(0, 4)}</span>
            </button>
          );
        })}
      </div>

      {/* ── Контент ── */}
      <div>
        {tab === "dashboard" && <InstructorDashboard user={user} onTabChange={t => setTab(t as Tab)} />}
        {tab === "files"     && <InstructorFilesManager user={user} />}
        {tab === "notes"     && <InstructorNotesTab user={user} />}
        {tab === "schedule"  && <InstructorScheduleTab user={user} onOpenSheets={() => setTab("sheets")} />}
        {tab === "sheets"    && <InstructorSheetsTab user={user} />}
        {tab === "profile"   && (
          <div className="max-w-sm">
            <ProfileCard
              user={user}
              editing={editing}
              name={name}
              rank={rank}
              contacts={contacts}
              gender={gender}
              saving={saving}
              error={error}
              success={success}
              showChangePw={showChangePw}
              currentPw={currentPw}
              newPw={newPw}
              newPw2={newPw2}
              pwSaving={pwSaving}
              pwError={pwError}
              pwSuccess={pwSuccess}
              uploadingAvatar={uploadingAvatar}
              avatarError={avatarError}
              onSetEditing={setEditing}
              onSetName={setName}
              onSetRank={setRank}
              onSetContacts={setContacts}
              onSetGender={setGender}
              onSave={handleSave}
              onCancel={handleCancel}
              onSetShowChangePw={(v) => { setShowChangePw(v); setPwError(""); }}
              onSetCurrentPw={setCurrentPw}
              onSetNewPw={setNewPw}
              onSetNewPw2={setNewPw2}
              onChangePw={handleChangePw}
              onAvatarChange={handleAvatarChange}
              onNavigate={onNavigate}
              onGoToAdmin={onGoToAdmin}
              onLogout={onLogout}
            />
          </div>
        )}
      </div>

      {/* Скрытый индикатор активной секции */}
      <div className="fixed bottom-0 left-0 right-0 h-0.5 pointer-events-none z-50"
        style={{ background: `linear-gradient(90deg, transparent, ${activeTab.activeColor}60, transparent)` }} />
    </div>
  );
}

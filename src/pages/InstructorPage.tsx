import { useState, useEffect } from "react";
import { api } from "@/api";
import { User, Page } from "@/App";
import Icon from "@/components/ui/icon";
import ProfileCard from "./profile/ProfileCard";
import InstructorFilesManager from "./instructor/InstructorFilesManager";
import InstructorScheduleTab from "./instructor/InstructorScheduleTab";
import InstructorSheetsTab from "./instructor/InstructorSheetsTab";

type Tab = "files" | "schedule" | "sheets";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "files",    label: "Материалы",  icon: "FolderOpen" },
  { id: "schedule", label: "Расписание", icon: "CalendarDays" },
  { id: "sheets",   label: "Ведомости",  icon: "ClipboardList" },
];

interface Props {
  user: User;
  onUpdate: (user: User) => void;
  onNavigate: (page: Page) => void;
  onGoToAdmin?: () => void;
  onLogout?: () => void;
}

export default function InstructorPage({ user, onUpdate, onNavigate, onGoToAdmin, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("files");

  // Profile edit state — зеркало ProfilePage
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00ff88]" />
        <span className="font-mono text-xs text-[#00ff88] tracking-[0.3em]">// ИНСТРУКТОР</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-6 tracking-wider">КАБИНЕТ ИНСТРУКТОРА</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Левая колонка — карточка профиля */}
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

        {/* Правая колонка — инструкторский контент */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Вкладки */}
          <div className="flex gap-0" style={{ borderBottom: "1px solid rgba(0,255,136,0.12)" }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 sm:px-5 py-3 font-mono text-xs tracking-wider transition-all"
                style={{
                  borderBottom: tab === t.id ? "2px solid #00ff88" : "2px solid transparent",
                  color: tab === t.id ? "#00ff88" : "#3a5570",
                  background: tab === t.id ? "rgba(0,255,136,0.04)" : "transparent",
                  marginBottom: "-1px",
                }}
              >
                <Icon name={t.icon as "FolderOpen"} size={13} />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.slice(0, 3)}</span>
              </button>
            ))}
          </div>

          {/* Контент вкладки */}
          {tab === "files"    && <InstructorFilesManager user={user} />}
          {tab === "schedule" && <InstructorScheduleTab  user={user} />}
          {tab === "sheets"   && <InstructorSheetsTab    user={user} />}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { api } from "@/api";
import { User, Page } from "@/App";
import { UserStats, Note, QuizResult } from "./profile/ProfileTypes";
import ProfileCard from "./profile/ProfileCard";
import ProfileStats from "./profile/ProfileStats";
import ProfileActivity from "./profile/ProfileActivity";

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
  onNavigate: (page: Page) => void;
  onGoToAdmin?: () => void;
  onLogout?: () => void;
}

export default function ProfilePage({ user, onUpdate, onNavigate, onGoToAdmin, onLogout }: ProfilePageProps) {
  // Remote data
  const [stats, setStats] = useState<UserStats | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [totalLectures, setTotalLectures] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [rightTab, setRightTab] = useState<"notes" | "tests" | "upload">("notes");
  const [deletingNote, setDeletingNote] = useState<number | null>(null);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [rank, setRank] = useState(user.rank || "");
  const [contacts, setContacts] = useState(user.contacts || "");
  const [gender, setGender] = useState(user.gender || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password change state
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    api.progress.leaderboard().then(res => {
      const me = (res.leaderboard || []).find((r: { id: number }) => r.id === user.id);
      if (me) setStats({ ...me, my_position: res.my_position ?? null });
    }).catch(() => {});

    api.progress.myNotes().then(res => {
      if (res.notes) setNotes(res.notes);
    }).catch(() => {});

    api.quizzes.myResults().then(res => {
      if (res.results) setQuizResults(res.results);
    }).catch(() => {});

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

        <div className="lg:col-span-3 flex flex-col gap-4">
          <ProfileStats
            stats={stats}
            totalLectures={totalLectures}
            totalVideos={totalVideos}
          />
          <ProfileActivity
            user={user}
            notes={notes}
            quizResults={quizResults}
            rightTab={rightTab}
            deletingNote={deletingNote}
            onSetRightTab={setRightTab}
            onDeleteNote={deleteNote}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}
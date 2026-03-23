import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { api } from "@/api";
import { User, Page } from "@/App";
import AdminUsersTab, { User as AdminUser } from "@/components/admin/AdminUsersTab";
import AdminFilesTab from "@/components/admin/AdminFilesTab";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import AdminRemovalTab from "@/components/admin/AdminRemovalTab";

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
  onNavigate: (page: Page) => void;
  onLogout?: () => void;
}

const RANKS = [
  "Рядовой", "Ефрейтор", "Младший сержант", "Сержант", "Старший сержант",
  "Старшина", "Прапорщик", "Старший прапорщик",
  "Младший лейтенант", "Лейтенант", "Старший лейтенант", "Капитан",
  "Майор", "Подполковник", "Полковник",
  "Генерал-майор", "Генерал-лейтенант", "Генерал-полковник", "Генерал армии",
];

type AdminTab = "users" | "roles" | "files" | "removals";

function AdminPanel({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [msg, setMsg] = useState("");
  const [removalPending, setRemovalPending] = useState(0);

  const loadUsers = async () => {
    setLoading(true);
    const res = await api.admin.users();
    if (res.users) setUsers(res.users);
    setLoading(false);
  };

  useState(() => { loadUsers(); });

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3500);
  };

  const approve = async (id: number) => {
    const res = await api.admin.approve(id);
    if (res.message) { showMsg(res.message); loadUsers(); }
  };
  const reject = async (id: number) => {
    const res = await api.admin.reject(id);
    if (res.message) { showMsg(res.message); loadUsers(); }
  };
  const makeAdmin = async (id: number) => {
    const res = await api.admin.makeAdmin(id);
    if (res.message) { showMsg(res.message); loadUsers(); }
  };
  const removeAdmin = async (id: number) => {
    const res = await api.admin.removeAdmin(id);
    if (res.message) { showMsg(res.message); loadUsers(); }
  };
  const setRole = async (id: number, role: string) => {
    const res = await api.admin.setRole(id, role);
    if (res.message) { showMsg(res.message); loadUsers(); }
  };

  const pendingCount = users.filter((u) => u.status === "pending").length;

  const tabs: { key: AdminTab; label: string; icon: string; badge?: number }[] = [
    { key: "users", label: "ЛИЧНЫЙ СОСТАВ", icon: "Users", badge: pendingCount },
    { key: "roles", label: "ДОСТУПЫ", icon: "Shield" },
    { key: "files", label: "ФАЙЛЫ", icon: "Upload" },
    { key: "removals", label: "ЗАЯВКИ", icon: "Trash2", badge: removalPending },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-8 h-px bg-[#ff6b00]" />
        <span className="font-mono text-xs text-[#ff6b00] tracking-[0.3em]">// ПАНЕЛЬ АДМИНИСТРАТОРА</span>
      </div>

      {msg && (
        <div className="mb-4 p-3 font-mono text-sm text-[#00ff88]" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
          ✓ {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 font-mono text-xs px-3 py-2 tracking-wider transition-all whitespace-nowrap flex-shrink-0"
            style={{
              border: `1px solid ${activeTab === tab.key ? "#00f5ff" : "#1a2a3a"}`,
              color: activeTab === tab.key ? "#050810" : "#3a5570",
              background: activeTab === tab.key ? "#00f5ff" : "transparent",
            }}
          >
            <Icon name={tab.icon as "Users"} size={12} />
            {tab.label}
            {tab.badge && tab.badge > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#ff6b00", color: "#fff" }}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <AdminUsersTab
          users={users}
          loading={loading}
          filter={filter}
          setFilter={setFilter}
          msg=""
          onApprove={approve}
          onReject={reject}
          onMakeAdmin={makeAdmin}
          onRemoveAdmin={removeAdmin}
          onSetRole={setRole}
        />
      )}
      {activeTab === "roles" && <AdminRolesTab />}
      {activeTab === "files" && <AdminFilesTab isAdmin={true} />}
      {activeTab === "removals" && <AdminRemovalTab onPendingCount={setRemovalPending} />}
    </div>
  );
}

export default function ProfilePage({ user, onUpdate, onNavigate, onLogout }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [rank, setRank] = useState(user.rank || "");
  const [contacts, setContacts] = useState(user.contacts || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError("Имя не может быть пустым"); return; }
    setSaving(true);
    setError("");
    const res = await api.updateProfile({ name: name.trim(), rank, contacts });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    onUpdate(res.user as User);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(user.name || "");
    setRank(user.rank || "");
    setContacts(user.contacts || "");
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
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ЛИЧНЫЙ КАБИНЕТ</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-8 tracking-wider">ЛИЧНОЕ ДЕЛО</h1>

      <div className="max-w-2xl">
        {/* Avatar + callsign block */}
        <div className="card-drone p-6 mb-6">
          <div className="flex items-center gap-5 mb-6">
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

            <div className="ml-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                <span className="font-mono text-xs text-[#5a7a95]">ONLINE</span>
              </div>
            </div>
          </div>

          {/* Fields */}
          {!editing ? (
            <div className="space-y-4">
              <Field label="ИМЯ" value={user.name} icon="UserCheck" />
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
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-neon flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Save" size={13} />}
                  {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
                </button>
                <button onClick={handleCancel} className="font-mono text-xs px-4 py-2 text-[#3a5570] hover:text-white transition-colors" style={{ border: "1px solid #1a2a3a" }}>
                  ОТМЕНА
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Быстрые действия */}
        <div className="space-y-2 mb-6">
          {(user.is_admin || user.role === "инструктор") && (
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

      {/* Панель администратора — только для is_admin */}
      {user.is_admin && <AdminPanel user={user} />}
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
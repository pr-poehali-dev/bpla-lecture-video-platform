import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { User } from "@/App";

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
}

const RANKS = [
  "Рядовой", "Ефрейтор", "Младший сержант", "Сержант", "Старший сержант",
  "Старшина", "Прапорщик", "Старший прапорщик",
  "Младший лейтенант", "Лейтенант", "Старший лейтенант", "Капитан",
  "Майор", "Подполковник", "Полковник",
  "Генерал-майор", "Генерал-лейтенант", "Генерал-полковник", "Генерал армии",
];

export default function ProfilePage({ user, onUpdate }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [rank, setRank] = useState(user.rank || "");
  const [contacts, setContacts] = useState(user.contacts || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ЛИЧНЫЙ КАБИНЕТ</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-8 tracking-wider">ПРОФИЛЬ</h1>

      {/* Avatar + callsign block */}
      <div className="card-drone p-6 mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.4)", background: "rgba(0,245,255,0.06)", boxShadow: "0 0 20px rgba(0,245,255,0.1)" }}>
            <Icon name="User" size={28} className="text-[#00f5ff]" />
          </div>
          <div>
            <div className="font-orbitron text-lg font-bold text-white tracking-wider">{user.callsign || "—"}</div>
            <div className="font-mono text-xs text-[#3a5570] mt-0.5">ПОЗЫВНОЙ</div>
            {user.rank && (
              <div className="font-mono text-xs text-[#00ff88] mt-1">{user.rank}</div>
            )}
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

            <button
              onClick={() => setEditing(true)}
              className="btn-neon flex items-center gap-2 mt-4"
            >
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
                {RANKS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
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

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-neon flex items-center gap-2"
              >
                <Icon name={saving ? "Loader" : "Save"} size={13} className={saving ? "animate-spin" : ""} />
                {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
              </button>
              <button
                onClick={handleCancel}
                className="font-mono text-xs text-[#5a7a95] hover:text-white transition-colors px-3 py-2"
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info block */}
      <div className="p-4" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.02)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Info" size={12} className="text-[#3a5570]" />
          <span className="font-mono text-xs text-[#3a5570] tracking-wider">УЧЁТНЫЕ ДАННЫЕ</span>
        </div>
        <div className="font-mono text-xs text-[#2a4060] space-y-1">
          <div>Позывной и email изменить нельзя — обратитесь к администратору</div>
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

import { useRef } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { api } from "@/api";
import { User, Page } from "@/App";
import { Field, RANKS } from "./ProfileTypes";

interface Props {
  user: User;
  editing: boolean;
  name: string;
  rank: string;
  contacts: string;
  gender: string;
  saving: boolean;
  error: string;
  success: boolean;
  showChangePw: boolean;
  currentPw: string;
  newPw: string;
  newPw2: string;
  pwSaving: boolean;
  pwError: string;
  pwSuccess: boolean;
  uploadingAvatar: boolean;
  avatarError: string;
  onSetEditing: (v: boolean) => void;
  onSetName: (v: string) => void;
  onSetRank: (v: string) => void;
  onSetContacts: (v: string) => void;
  onSetGender: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onSetShowChangePw: (v: boolean) => void;
  onSetCurrentPw: (v: string) => void;
  onSetNewPw: (v: string) => void;
  onSetNewPw2: (v: string) => void;
  onChangePw: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigate: (page: Page) => void;
  onGoToAdmin?: () => void;
  onLogout?: () => void;
}

export default function ProfileCard({
  user, editing, name, rank, contacts, gender, saving, error, success,
  showChangePw, currentPw, newPw, newPw2, pwSaving, pwError, pwSuccess,
  uploadingAvatar, avatarError,
  onSetEditing, onSetName, onSetRank, onSetContacts, onSetGender,
  onSave, onCancel,
  onSetShowChangePw, onSetCurrentPw, onSetNewPw, onSetNewPw2, onChangePw,
  onAvatarChange, onNavigate, onGoToAdmin, onLogout,
}: Props) {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
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
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-orbitron text-base font-bold text-white tracking-wider truncate">{user.callsign || "—"}</div>
            <div className="font-mono text-[10px] text-[#3a5570] mt-0.5 mb-1">ПОЗЫВНОЙ</div>
            <div className="flex flex-wrap gap-1">
              {user.rank && <span className="font-mono text-[10px] text-[#00ff88]">{user.rank}</span>}
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
            <button onClick={() => onSetEditing(true)} className="btn-neon flex items-center gap-2 mt-4 text-xs">
              <Icon name="Pencil" size={12} /> РЕДАКТИРОВАТЬ
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[{ label: "ИМЯ", val: name, set: onSetName }].map(f => (
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
                value={gender} onChange={e => onSetGender(e.target.value)}>
                <option value="">— не указано —</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#5a7a95] tracking-wider block mb-1">ЗВАНИЕ</label>
              <select className="w-full bg-[#080d1a] border font-plex text-sm text-white px-3 py-2 outline-none"
                style={{ borderColor: "rgba(0,245,255,0.25)" }}
                value={rank} onChange={e => onSetRank(e.target.value)}>
                <option value="">— не указано —</option>
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#5a7a95] tracking-wider block mb-1">КОНТАКТЫ</label>
              <textarea className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none resize-none"
                style={{ borderColor: "rgba(0,245,255,0.25)" }}
                rows={2} value={contacts} onChange={e => onSetContacts(e.target.value)}
                placeholder="Telegram, телефон..." />
            </div>
            {error && <div className="flex items-center gap-1.5 font-mono text-xs text-[#ff2244]"><Icon name="AlertCircle" size={12} />{error}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={onSave} disabled={saving} className="btn-neon flex items-center gap-1.5 text-xs disabled:opacity-50">
                {saving ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Save" size={11} />}
                {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
              </button>
              <button onClick={onCancel} className="font-mono text-xs px-3 py-2 text-[#3a5570] hover:text-white transition-colors" style={{ border: "1px solid #1a2a3a" }}>
                ОТМЕНА
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Смена пароля */}
      <div className="p-4" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.02)" }}>
        <button onClick={() => { onSetShowChangePw(!showChangePw); }}
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
              { label: "ТЕКУЩИЙ ПАРОЛЬ", val: currentPw, set: onSetCurrentPw },
              { label: "НОВЫЙ ПАРОЛЬ", val: newPw, set: onSetNewPw },
              { label: "ПОВТОРИТЕ НОВЫЙ", val: newPw2, set: onSetNewPw2 },
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
            <button onClick={onChangePw} disabled={pwSaving} className="btn-neon flex items-center gap-1.5 text-xs disabled:opacity-50">
              {pwSaving ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Save" size={11} />}
              {pwSaving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
            </button>
          </div>
        )}
      </div>

      {/* Быстрые действия */}
      <div className="space-y-2">
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
  );
}
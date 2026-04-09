import Icon from "@/components/ui/icon";

export interface User {
  id: number;
  name: string;
  callsign?: string;
  email: string;
  status: string;
  is_admin: boolean;
  role: string;
  created_at: string;
  approved_at: string | null;
}

const statusColor: Record<string, string> = {
  pending: "#ff6b00",
  approved: "#00ff88",
  rejected: "#ff2244",
};

const statusLabel: Record<string, string> = {
  pending: "ОЖИДАЕТ",
  approved: "ОДОБРЕН",
  rejected: "ОТКЛОНЁН",
};

const roleColor: Record<string, string> = {
  "курсант": "#00f5ff",
  "инструктор кт": "#00ff88",
  "инструктор fpv": "#a78bfa",
  "инструктор оператор-сапер": "#fbbf24",
  "администратор": "#ff6b00",
};

const ROLES = ["курсант", "инструктор кт", "инструктор fpv", "инструктор оператор-сапер", "администратор"];

interface Props {
  users: User[];
  loading: boolean;
  filter: string;
  setFilter: (f: string) => void;
  msg: string;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onMakeAdmin: (id: number) => void;
  onRemoveAdmin: (id: number) => void;
  onSetRole: (id: number, role: string) => void;
  onDeleteUser?: (id: number) => void;
}

export default function AdminUsersTab({ users, loading, filter, setFilter, msg, onApprove, onReject, onMakeAdmin, onRemoveAdmin, onSetRole, onDeleteUser }: Props) {
  const filtered = users.filter((u) => filter === "all" || u.status === filter);
  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Всего", value: users.length, color: "#00f5ff" },
          { label: "Ожидают", value: pendingCount, color: "#ff6b00" },
          { label: "Одобрено", value: users.filter((u) => u.status === "approved").length, color: "#00ff88" },
        ].map((s) => (
          <div key={s.label} className="card-drone p-4 text-center">
            <div className="font-orbitron text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="font-mono text-xs text-[#3a5570] tracking-wider">{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Msg */}
      {msg && (
        <div className="mb-4 p-3 font-plex text-sm text-[#00ff88] animate-fade-in" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
          ✓ {msg}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "pending", label: "ОЖИДАЮТ" },
          { key: "approved", label: "ОДОБРЕНЫ" },
          { key: "rejected", label: "ОТКЛОНЕНЫ" },
          { key: "all", label: "ВСЕ" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-mono text-xs px-4 py-2 tracking-wider transition-all ${
              filter === f.key ? "text-[#050810] font-bold" : "text-[#5a7a95] border border-[rgba(0,245,255,0.15)] hover:text-[#00f5ff]"
            }`}
            style={filter === f.key ? { background: "#00f5ff", boxShadow: "0 0 15px rgba(0,245,255,0.3)" } : {}}
          >
            {f.label}
            {f.key === "pending" && pendingCount > 0 && (
              <span className="ml-2 px-1.5 rounded-full text-[10px]" style={{ background: "#ff6b00", color: "#fff" }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Users list */}
      {loading ? (
        <div className="text-center py-16 text-[#3a5570] font-mono text-sm">ЗАГРУЗКА...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#3a5570] font-mono text-sm">НЕТ ПОЛЬЗОВАТЕЛЕЙ</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user, i) => (
            <div
              key={user.id}
              className="card-drone p-4 flex flex-col md:flex-row md:items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 font-orbitron text-sm font-bold" style={{ background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.15)", color: "#00f5ff" }}>
                {(user.callsign || user.name)[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-plex text-sm text-white">{user.callsign || user.name}</span>
                  {user.callsign && <span className="font-mono text-xs text-[#3a5570]">{user.name}</span>}
                  {user.is_admin && <span className="tag-badge text-[9px]">ADMIN</span>}
                  {user.role && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ background: "rgba(0,245,255,0.06)", border: `1px solid ${roleColor[user.role] || "#3a5570"}44`, color: roleColor[user.role] || "#5a7a95" }}>
                      {user.role.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-[#5a7a95]">{user.email}</div>
                <div className="font-mono text-[10px] text-[#2a4060] mt-0.5">
                  Заявка: {new Date(user.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>

              {/* Role selector — только для одобренных */}
              {user.status === "approved" && (
                <div className="flex-shrink-0">
                  <select
                    value={user.role || "курсант"}
                    onChange={(e) => onSetRole(user.id, e.target.value)}
                    className="font-mono text-xs px-2 py-1.5 bg-transparent outline-none cursor-pointer"
                    style={{ border: "1px solid rgba(0,245,255,0.2)", color: roleColor[user.role] || "#00f5ff" }}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r} style={{ background: "#050810", color: "#fff" }}>{r}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status */}
              <div className="flex-shrink-0">
                <span className="font-mono text-xs font-bold" style={{ color: statusColor[user.status] || "#5a7a95" }}>
                  {statusLabel[user.status] || user.status.toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              {user.is_admin && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onRemoveAdmin(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
                    style={{ border: "1px solid rgba(255,34,68,0.3)", color: "#ff2244", background: "rgba(255,34,68,0.04)" }}
                  >
                    <Icon name="ShieldOff" size={11} />
                    СНЯТЬ ADMIN
                  </button>
                </div>
              )}
              {!user.is_admin && (
                <div className="flex gap-2 flex-shrink-0">
                  {user.status !== "approved" && (
                    <button
                      onClick={() => onApprove(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
                      style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}
                    >
                      <Icon name="Check" size={11} />
                      ОДОБРИТЬ
                    </button>
                  )}
                  {user.status !== "rejected" && (
                    <button
                      onClick={() => onReject(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
                      style={{ border: "1px solid rgba(255,34,68,0.4)", color: "#ff2244", background: "rgba(255,34,68,0.05)" }}
                    >
                      <Icon name="X" size={11} />
                      ОТКЛОНИТЬ
                    </button>
                  )}
                  {user.status === "approved" && !user.is_admin && (
                    <button
                      onClick={() => onMakeAdmin(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
                      style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#ff6b00", background: "rgba(255,107,0,0.05)" }}
                    >
                      <Icon name="Shield" size={11} />
                      ADMIN
                    </button>
                  )}
                  {onDeleteUser && (
                    <button
                      onClick={() => { if (confirm(`Удалить пользователя ${user.callsign || user.name}?`)) onDeleteUser(user.id); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 font-mono text-xs transition-all"
                      style={{ border: "1px solid rgba(255,34,68,0.2)", color: "#ff2244", background: "transparent" }}
                    >
                      <Icon name="Trash2" size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
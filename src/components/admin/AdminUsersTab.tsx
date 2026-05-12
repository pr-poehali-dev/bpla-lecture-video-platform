import { useState } from "react";
import Icon from "@/components/ui/icon";
import ConfirmModal from "./ConfirmModal";

export interface User {
  id: number;
  name: string;
  callsign?: string;
  email: string;
  status: string;
  is_admin: boolean;
  is_blocked?: boolean;
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
  onBlockUser?: (id: number, reason: string) => void;
  onUnblockUser?: (id: number) => void;
  onResetPassword?: (id: number) => void;
  onBulkApprove?: (ids: number[]) => void;
  onBulkReject?: (ids: number[]) => void;
}

type ConfirmAction = { type: "delete" | "block" | "unblock" | "reset" | "bulk-approve" | "bulk-reject"; userId?: number; userName?: string } | null;

export default function AdminUsersTab({
  users, loading, filter, setFilter, msg,
  onApprove, onReject, onMakeAdmin, onRemoveAdmin, onSetRole,
  onDeleteUser, onBlockUser, onUnblockUser, onResetPassword,
  onBulkApprove, onBulkReject,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [blockReason, setBlockReason] = useState("");
  const [resetResult, setResetResult] = useState<{ password: string; email: string } | null>(null);

  const filtered = users.filter((u) => {
    const matchFilter = filter === "all" || u.status === filter;
    const matchSearch = !search || [u.name, u.callsign, u.email, u.role].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;

  const toggleSelect = (id: number) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(u => u.id)));
  };

  const exportCSV = () => {
    const rows = [["ID", "Позывной", "Имя", "Email", "Статус", "Роль", "Дата регистрации"]];
    filtered.forEach(u => rows.push([
      String(u.id), u.callsign || "", u.name, u.email,
      statusLabel[u.status] || u.status, u.role || "",
      new Date(u.created_at).toLocaleDateString("ru-RU"),
    ]));
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === "delete" && confirmAction.userId) {
      onDeleteUser?.(confirmAction.userId);
    } else if (confirmAction.type === "block" && confirmAction.userId) {
      onBlockUser?.(confirmAction.userId, blockReason);
      setBlockReason("");
    } else if (confirmAction.type === "unblock" && confirmAction.userId) {
      onUnblockUser?.(confirmAction.userId);
    } else if (confirmAction.type === "reset" && confirmAction.userId) {
      const res = await (onResetPassword as unknown as (id: number) => Promise<{ new_password?: string; email?: string }>)?.(confirmAction.userId);
      if (res?.new_password) setResetResult({ password: res.new_password, email: res.email || "" });
    } else if (confirmAction.type === "bulk-approve") {
      onBulkApprove?.(Array.from(selected));
      setSelected(new Set());
    } else if (confirmAction.type === "bulk-reject") {
      onBulkReject?.(Array.from(selected));
      setSelected(new Set());
    }
    setConfirmAction(null);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Всего", value: users.length, color: "#00f5ff" },
          { label: "Ожидают", value: pendingCount, color: "#ff6b00" },
          { label: "Одобрено", value: users.filter(u => u.status === "approved").length, color: "#00ff88" },
          { label: "Заблокировано", value: users.filter(u => u.is_blocked).length, color: "#ff2244" },
        ].map((s) => (
          <div key={s.label} className="p-4 text-center" style={{ background: "rgba(13,27,46,0.8)", border: "1px solid rgba(0,245,255,0.08)" }}>
            <div className="font-orbitron text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="font-mono text-[10px] text-[#3a5570] tracking-wider">{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className="mb-4 p-3 font-plex text-sm text-[#00ff88] animate-fade-in" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
          ✓ {msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени, email, роли..."
            className="w-full bg-transparent pl-8 pr-3 py-2 font-mono text-xs text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)", color: "#fff" }} />
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-[#00ff88] hover:text-white transition-colors"
          style={{ border: "1px solid rgba(0,255,136,0.2)" }}>
          <Icon name="Download" size={13} /> CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "pending", label: "ОЖИДАЮТ" },
          { key: "approved", label: "ОДОБРЕНЫ" },
          { key: "rejected", label: "ОТКЛОНЕНЫ" },
          { key: "all", label: "ВСЕ" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`font-mono text-xs px-4 py-2 tracking-wider transition-all ${filter === f.key ? "text-[#050810] font-bold" : "text-[#5a7a95] border border-[rgba(0,245,255,0.15)] hover:text-[#00f5ff]"}`}
            style={filter === f.key ? { background: "#00f5ff" } : {}}>
            {f.label}
            {f.key === "pending" && pendingCount > 0 && (
              <span className="ml-2 px-1.5 rounded-full text-[10px]" style={{ background: "#ff6b00", color: "#fff" }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5" style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.15)" }}>
          <span className="font-mono text-xs text-[#00f5ff]">Выбрано: {selected.size}</span>
          <button onClick={() => setConfirmAction({ type: "bulk-approve" })}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs text-[#00ff88] hover:text-white transition-colors"
            style={{ border: "1px solid rgba(0,255,136,0.3)" }}>
            <Icon name="CheckCheck" size={11} /> Одобрить всех
          </button>
          <button onClick={() => setConfirmAction({ type: "bulk-reject" })}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs text-[#ff2244] hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,34,68,0.3)" }}>
            <Icon name="XCircle" size={11} /> Отклонить всех
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto font-mono text-[10px] text-[#3a5570] hover:text-white">
            <Icon name="X" size={13} />
          </button>
        </div>
      )}

      {/* List header */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 mb-1" style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}>
          <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleAll} className="w-3.5 h-3.5 cursor-pointer accent-[#00f5ff]" />
          <span className="font-mono text-[9px] text-[#2a4060] tracking-widest">ПОЛЬЗОВАТЕЛЬ</span>
          <span className="font-mono text-[9px] text-[#2a4060] tracking-widest ml-auto">ДЕЙСТВИЯ</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#3a5570] font-mono text-sm">ЗАГРУЗКА...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#3a5570] font-mono text-sm">НЕТ ПОЛЬЗОВАТЕЛЕЙ</div>
      ) : (
        <div className="space-y-1">
          {filtered.map((user, i) => (
            <div key={user.id}
              className="flex flex-col md:flex-row md:items-center gap-3 p-3 transition-all animate-fade-in"
              style={{
                animationDelay: `${i * 0.03}s`,
                background: selected.has(user.id) ? "rgba(0,245,255,0.04)" : "rgba(13,27,46,0.4)",
                border: `1px solid ${selected.has(user.id) ? "rgba(0,245,255,0.2)" : "rgba(0,245,255,0.06)"}`,
                opacity: user.is_blocked ? 0.6 : 1,
              }}>
              <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleSelect(user.id)}
                className="w-3.5 h-3.5 cursor-pointer accent-[#00f5ff] flex-shrink-0" />

              {/* Avatar */}
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 font-orbitron text-xs font-bold relative"
                style={{ background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.15)", color: "#00f5ff" }}>
                {(user.callsign || user.name)[0].toUpperCase()}
                {user.is_blocked && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full"
                    style={{ background: "#ff2244", border: "1px solid #0d1b2e" }}>
                    <Icon name="Lock" size={8} className="text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-plex text-sm text-white">{user.callsign || user.name}</span>
                  {user.callsign && <span className="font-mono text-xs text-[#3a5570]">{user.name}</span>}
                  {user.is_admin && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 font-bold" style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#ff6b00" }}>ADMIN</span>
                  )}
                  {user.is_blocked && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 font-bold" style={{ background: "rgba(255,34,68,0.1)", border: "1px solid rgba(255,34,68,0.3)", color: "#ff2244" }}>БЛОК</span>
                  )}
                  {user.role && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5"
                      style={{ background: "rgba(0,245,255,0.06)", border: `1px solid ${roleColor[user.role] || "#3a5570"}44`, color: roleColor[user.role] || "#5a7a95" }}>
                      {user.role.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-[#5a7a95]">{user.email}</div>
                <div className="font-mono text-[10px] text-[#2a4060]">
                  {new Date(user.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <span className="font-mono text-xs font-bold" style={{ color: statusColor[user.status] || "#5a7a95" }}>
                  {statusLabel[user.status] || user.status.toUpperCase()}
                </span>
              </div>

              {/* Role selector */}
              {user.status === "approved" && (
                <select value={user.role || "курсант"} onChange={(e) => onSetRole(user.id, e.target.value)}
                  className="font-mono text-xs px-2 py-1.5 bg-transparent outline-none cursor-pointer flex-shrink-0"
                  style={{ border: "1px solid rgba(0,245,255,0.2)", color: roleColor[user.role] || "#00f5ff" }}>
                  {ROLES.map(r => (
                    <option key={r} value={r} style={{ background: "#050810", color: "#fff" }}>{r}</option>
                  ))}
                </select>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                {user.status === "pending" && !user.is_admin && (
                  <>
                    <button onClick={() => onApprove(user.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] transition-all"
                      style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}>
                      <Icon name="Check" size={10} /> ОДОБРИТЬ
                    </button>
                    <button onClick={() => onReject(user.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] transition-all"
                      style={{ border: "1px solid rgba(255,34,68,0.4)", color: "#ff2244", background: "rgba(255,34,68,0.05)" }}>
                      <Icon name="X" size={10} /> ОТКЛ.
                    </button>
                  </>
                )}
                {user.status === "approved" && !user.is_admin && (
                  <button onClick={() => onMakeAdmin(user.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] transition-all"
                    style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#ff6b00", background: "rgba(255,107,0,0.05)" }}>
                    <Icon name="Shield" size={10} /> ADMIN
                  </button>
                )}
                {user.is_admin && (
                  <button onClick={() => onRemoveAdmin(user.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] transition-all"
                    style={{ border: "1px solid rgba(255,34,68,0.3)", color: "#ff2244", background: "rgba(255,34,68,0.04)" }}>
                    <Icon name="ShieldOff" size={10} /> СНЯТЬ
                  </button>
                )}
                {onResetPassword && user.status === "approved" && (
                  <button onClick={() => setConfirmAction({ type: "reset", userId: user.id, userName: user.callsign || user.name })}
                    className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] transition-all text-[#5a7a95] hover:text-[#00f5ff]"
                    style={{ border: "1px solid rgba(0,245,255,0.12)" }}>
                    <Icon name="KeyRound" size={10} />
                  </button>
                )}
                {onBlockUser && !user.is_blocked && user.status === "approved" && (
                  <button onClick={() => setConfirmAction({ type: "block", userId: user.id, userName: user.callsign || user.name })}
                    className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] transition-all text-[#ff6b00] hover:text-white"
                    style={{ border: "1px solid rgba(255,107,0,0.2)" }}>
                    <Icon name="Ban" size={10} />
                  </button>
                )}
                {onUnblockUser && user.is_blocked && (
                  <button onClick={() => setConfirmAction({ type: "unblock", userId: user.id, userName: user.callsign || user.name })}
                    className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] transition-all text-[#00ff88] hover:text-white"
                    style={{ border: "1px solid rgba(0,255,136,0.2)" }}>
                    <Icon name="Unlock" size={10} />
                  </button>
                )}
                {onDeleteUser && (
                  <button onClick={() => setConfirmAction({ type: "delete", userId: user.id, userName: user.callsign || user.name })}
                    className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] transition-all text-[#ff2244] hover:text-white"
                    style={{ border: "1px solid rgba(255,34,68,0.2)" }}>
                    <Icon name="Trash2" size={10} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm modals */}
      <ConfirmModal
        open={confirmAction?.type === "delete"}
        title="Удалить пользователя"
        message={`Вы уверены, что хотите удалить «${confirmAction?.userName}»? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction?.type === "block"}
        title="Заблокировать пользователя"
        message={`Пользователь «${confirmAction?.userName}» потеряет доступ к сайту.`}
        confirmLabel="Заблокировать"
        danger
        onConfirm={handleConfirm}
        onCancel={() => { setConfirmAction(null); setBlockReason(""); }}>
        <input value={blockReason} onChange={e => setBlockReason(e.target.value)}
          placeholder="Причина блокировки (необязательно)"
          className="w-full bg-transparent px-3 py-2 font-mono text-xs text-white outline-none"
          style={{ border: "1px solid rgba(255,34,68,0.2)" }} />
      </ConfirmModal>

      <ConfirmModal
        open={confirmAction?.type === "unblock"}
        title="Разблокировать пользователя"
        message={`Пользователь «${confirmAction?.userName}» снова получит доступ к сайту.`}
        confirmLabel="Разблокировать"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction?.type === "reset"}
        title="Сброс пароля"
        message={`Сгенерировать новый пароль для «${confirmAction?.userName}»? Текущий пароль будет сброшен.`}
        confirmLabel="Сбросить пароль"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction?.type === "bulk-approve"}
        title="Массовое одобрение"
        message={`Одобрить ${selected.size} пользователей?`}
        confirmLabel="Одобрить всех"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction?.type === "bulk-reject"}
        title="Массовое отклонение"
        message={`Отклонить ${selected.size} пользователей?`}
        confirmLabel="Отклонить всех"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Reset password result */}
      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm p-6" style={{ background: "#0d1b2e", border: "1px solid rgba(0,255,136,0.3)" }}>
            <div className="font-orbitron text-sm font-bold text-[#00ff88] mb-4">Пароль сброшен</div>
            <div className="space-y-2 mb-4">
              <div className="font-mono text-xs text-[#5a7a95]">Email: <span className="text-white">{resetResult.email}</span></div>
              <div className="font-mono text-xs text-[#5a7a95]">Новый пароль:</div>
              <div className="font-mono text-sm text-[#00ff88] p-3 select-all" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
                {resetResult.password}
              </div>
              <div className="font-mono text-[10px] text-[#ff6b00]">Сохраните и передайте пользователю. Показывается только один раз.</div>
            </div>
            <button onClick={() => setResetResult(null)}
              className="w-full py-2 font-mono text-xs text-[#00ff88]"
              style={{ border: "1px solid rgba(0,255,136,0.3)" }}>
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

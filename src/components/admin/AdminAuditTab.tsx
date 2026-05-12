import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";

interface LogEntry {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  target_type: string | null;
  target_id: number | null;
  target_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  approve_user: { label: "Одобрил пользователя", icon: "UserCheck", color: "#00ff88" },
  reject_user: { label: "Отклонил пользователя", icon: "UserX", color: "#ff2244" },
  delete_user: { label: "Удалил пользователя", icon: "Trash2", color: "#ff2244" },
  block_user: { label: "Заблокировал", icon: "Ban", color: "#ff6b00" },
  unblock_user: { label: "Разблокировал", icon: "Unlock", color: "#00ff88" },
  make_admin: { label: "Назначил админом", icon: "Shield", color: "#a855f7" },
  set_role: { label: "Сменил роль", icon: "Tag", color: "#00f5ff" },
  reset_password: { label: "Сбросил пароль", icon: "KeyRound", color: "#ff6b00" },
};

const ACTION_FILTER_OPTIONS = [
  { value: "", label: "Все действия" },
  { value: "approve_user", label: "Одобрения" },
  { value: "reject_user", label: "Отклонения" },
  { value: "block_user", label: "Блокировки" },
  { value: "unblock_user", label: "Разблокировки" },
  { value: "delete_user", label: "Удаления" },
  { value: "set_role", label: "Смена роли" },
  { value: "make_admin", label: "Назначение админа" },
  { value: "reset_password", label: "Сброс пароля" },
];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAuditTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("");
  const LIMIT = 50;

  const load = (p = 0, fa = filterAction, fadm = filterAdmin) => {
    setLoading(true);
    api.admin.auditLog({ limit: LIMIT, offset: p * LIMIT, filter_action: fa, filter_admin: fadm })
      .then(res => { setLogs(res.logs || []); setTotal(res.total || 0); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleFilter = () => { setPage(0); load(0, filterAction, filterAdmin); };

  const exportCSV = () => {
    const rows = [["ID", "Администратор", "Действие", "Цель", "Детали", "Дата"]];
    logs.forEach(l => rows.push([
      String(l.id), l.admin_name,
      ACTION_LABELS[l.action]?.label || l.action,
      l.target_name || "",
      JSON.stringify(l.details || {}),
      formatDate(l.created_at),
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_log.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-orbitron text-base font-bold text-white">Журнал действий</div>
          <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">Все действия администраторов. Всего: {total}</div>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 font-mono text-xs text-[#00ff88] hover:text-white transition-colors"
          style={{ border: "1px solid rgba(0,255,136,0.2)" }}>
          <Icon name="Download" size={13} /> Экспорт CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4" style={{ background: "rgba(13,27,46,0.6)", border: "1px solid rgba(0,245,255,0.08)" }}>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="font-mono text-xs px-3 py-2 bg-transparent outline-none"
          style={{ border: "1px solid rgba(0,245,255,0.15)", color: "#fff", minWidth: 160 }}>
          {ACTION_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: "#050810" }}>{o.label}</option>)}
        </select>
        <input value={filterAdmin} onChange={e => setFilterAdmin(e.target.value)}
          placeholder="Фильтр по администратору..."
          className="flex-1 min-w-[160px] bg-transparent px-3 py-2 font-mono text-xs text-white outline-none"
          style={{ border: "1px solid rgba(0,245,255,0.15)" }}
          onKeyDown={e => e.key === "Enter" && handleFilter()} />
        <button onClick={handleFilter}
          className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold text-[#00f5ff]"
          style={{ border: "1px solid rgba(0,245,255,0.25)", background: "rgba(0,245,255,0.06)" }}>
          <Icon name="Filter" size={13} /> Применить
        </button>
        {(filterAction || filterAdmin) && (
          <button onClick={() => { setFilterAction(""); setFilterAdmin(""); setPage(0); load(0, "", ""); }}
            className="font-mono text-[10px] text-[#3a5570] hover:text-white transition-colors flex items-center gap-1">
            <Icon name="X" size={11} /> Сбросить
          </button>
        )}
      </div>

      {/* Log list */}
      <div style={{ border: "1px solid rgba(0,245,255,0.08)", background: "rgba(4,7,14,0.6)" }}>
        {loading ? (
          <div className="text-center py-16 font-mono text-xs text-[#3a5570]">ЗАГРУЗКА...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="ClipboardList" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
            <div className="font-mono text-xs text-[#3a5570]">Нет записей</div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(0,245,255,0.04)" }}>
            {logs.map((log, i) => {
              const meta = ACTION_LABELS[log.action] || { label: log.action, icon: "Activity", color: "#5a7a95" };
              return (
                <div key={log.id} className="flex items-start gap-4 px-4 py-3 hover:bg-[rgba(0,245,255,0.02)] transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 0.02}s` }}>
                  {/* Icon */}
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}25` }}>
                    <Icon name={meta.icon as "Activity"} size={13} style={{ color: meta.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-white">{log.admin_name}</span>
                      <span className="font-mono text-xs" style={{ color: meta.color }}>{meta.label}</span>
                      {log.target_name && (
                        <span className="font-mono text-xs text-[#5a7a95]">→ <span className="text-white">{log.target_name}</span></span>
                      )}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">
                        {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-right">
                    <div className="font-mono text-[10px] text-[#5a7a95]">{timeAgo(log.created_at)}</div>
                    <div className="font-mono text-[9px] text-[#2a4060] mt-0.5">{formatDate(log.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <button disabled={page === 0} onClick={() => { const p = page - 1; setPage(p); load(p); }}
            className="flex items-center gap-1.5 px-4 py-2 font-mono text-xs text-[#5a7a95] hover:text-[#00f5ff] disabled:opacity-30 transition-colors"
            style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
            <Icon name="ChevronLeft" size={13} /> Назад
          </button>
          <span className="font-mono text-xs text-[#3a5570]">
            {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} из {total}
          </span>
          <button disabled={(page + 1) * LIMIT >= total} onClick={() => { const p = page + 1; setPage(p); load(p); }}
            className="flex items-center gap-1.5 px-4 py-2 font-mono text-xs text-[#5a7a95] hover:text-[#00f5ff] disabled:opacity-30 transition-colors"
            style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
            Вперёд <Icon name="ChevronRight" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

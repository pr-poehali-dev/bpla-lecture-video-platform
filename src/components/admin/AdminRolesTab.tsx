import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";

const PAGE_LABELS: Record<string, string> = {
  "home": "Главная",
  "lectures": "Лекции",
  "videos": "Видео",
  "drone-types": "Типы БпЛА",
  "materials": "Материалы",
  "firmware": "Прошивки FPV КТ",
  "discussions": "Обсуждения",
  "downloads": "Загрузки",
};

const PAGE_ICONS: Record<string, string> = {
  "home": "Crosshair",
  "lectures": "BookOpen",
  "videos": "Play",
  "drone-types": "Plane",
  "materials": "FileText",
  "firmware": "Cpu",
  "discussions": "MessageSquare",
  "downloads": "Download",
};

const ROLE_COLORS: Record<string, string> = {
  "курсант": "#00f5ff",
  "инструктор кт": "#00ff88",
  "инструктор fpv": "#a78bfa",
  "инструктор оператор-сапер": "#fbbf24",
};

type Permissions = Record<string, Record<string, boolean>>;

export default function AdminRolesTab() {
  const [permissions, setPermissions] = useState<Permissions>({});
  const [pages, setPages] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.admin.getPermissions();
      if (res.permissions) {
        setPermissions(res.permissions);
        setPages(res.pages || []);
        setRoles(res.roles || []);
      } else {
        setError(res.error || "Не удалось загрузить права доступа");
      }
    } catch (e) {
      setError(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(false);
  };

  const toggle = (role: string, page: string) => {
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [page]: !prev[role]?.[page] },
    }));
  };

  const toggleAllForRole = (role: string) => {
    const allTrue = pages.every(p => permissions[role]?.[p]);
    setPermissions(prev => ({
      ...prev,
      [role]: Object.fromEntries(pages.map(p => [p, !allTrue])),
    }));
  };

  const toggleAllForPage = (page: string) => {
    const allTrue = roles.every(r => permissions[r]?.[page]);
    setPermissions(prev => {
      const next = { ...prev };
      roles.forEach(r => { next[r] = { ...next[r], [page]: !allTrue }; });
      return next;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(roles.map(role => api.admin.setPermissions(role, permissions[role] || {})));
    setSaving(false);
    setSaved(true);
    setMsg("Права доступа сохранены");
    setTimeout(() => { setSaved(false); setMsg(""); }, 3000);
  };

  if (loading) return <div className="text-center py-20 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>;

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="font-mono text-sm text-[#ff2244] mb-3">{error}</div>
        <button onClick={load} className="font-mono text-xs px-4 py-2" style={{ border: "1px solid #1a2a3a", color: "#3a5570" }}>ПОВТОРИТЬ</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-orbitron text-lg font-bold text-white tracking-wider mb-1">МАТРИЦА ДОСТУПА</h2>
          <p className="font-mono text-xs text-[#3a5570]">Настройте какие разделы доступны каждой роли. Администраторы имеют полный доступ.</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 font-mono text-xs tracking-wider transition-all disabled:opacity-50 flex-shrink-0"
          style={{
            background: saved ? "rgba(0,255,136,0.12)" : "rgba(0,245,255,0.06)",
            border: `1px solid ${saved ? "#00ff88" : "rgba(0,245,255,0.4)"}`,
            color: saved ? "#00ff88" : "#00f5ff",
            boxShadow: saved ? "0 0 16px rgba(0,255,136,0.2)" : "none",
          }}
        >
          {saving
            ? <><Icon name="Loader" size={13} className="animate-spin" />СОХРАНЕНИЕ...</>
            : saved
            ? <><Icon name="Check" size={13} />СОХРАНЕНО</>
            : <><Icon name="Save" size={13} />СОХРАНИТЬ ВСЁ</>}
        </button>
      </div>

      {msg && (
        <div className="mb-4 p-3 font-plex text-sm text-[#00ff88]" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
          ✓ {msg}
        </div>
      )}

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {/* Empty corner */}
              <th className="w-48 pb-3 pr-4 text-left">
                <span className="font-mono text-[10px] text-[#3a5570] tracking-widest">РАЗДЕЛ / РОЛЬ</span>
              </th>
              {roles.map(role => {
                const color = ROLE_COLORS[role] || "#00f5ff";
                const count = pages.filter(p => permissions[role]?.[p]).length;
                const allOn = pages.every(p => permissions[role]?.[p]);
                return (
                  <th key={role} className="pb-3 px-3 text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="font-orbitron text-[10px] font-bold tracking-wider uppercase" style={{ color }}>{role}</span>
                      <span className="font-mono text-[9px] text-[#3a5570]">{count}/{pages.length}</span>
                      <button
                        onClick={() => toggleAllForRole(role)}
                        className="font-mono text-[9px] px-2 py-0.5 transition-all"
                        style={{ border: `1px solid ${color}44`, color: allOn ? color : "#3a5570" }}
                      >
                        {allOn ? "СНЯТЬ ВСЕ" : "ВСЕ"}
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pages.map((page, pi) => {
              const allOn = roles.every(r => permissions[r]?.[page]);
              return (
                <tr
                  key={page}
                  style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}
                  className="group hover:bg-[rgba(0,245,255,0.02)] transition-colors"
                >
                  {/* Page label */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleAllForPage(page)}
                        title="Включить/выключить для всех ролей"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon
                          name={allOn ? "CheckSquare" : "Square"}
                          size={13}
                          className={allOn ? "text-[#00f5ff]" : "text-[#2a4060]"}
                        />
                      </button>
                      <Icon name={PAGE_ICONS[page] || "File"} size={13} className="text-[#3a5570] flex-shrink-0" />
                      <span className="font-mono text-xs text-[#c0d8e8]">{PAGE_LABELS[page] || page}</span>
                    </div>
                  </td>

                  {/* Checkboxes per role */}
                  {roles.map(role => {
                    const color = ROLE_COLORS[role] || "#00f5ff";
                    const allowed = permissions[role]?.[page] ?? true;
                    return (
                      <td key={role} className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggle(role, page)}
                          className="w-8 h-8 flex items-center justify-center mx-auto transition-all rounded-sm"
                          style={{
                            background: allowed ? `${color}15` : "transparent",
                            border: `1px solid ${allowed ? color + "60" : "rgba(0,245,255,0.08)"}`,
                          }}
                        >
                          {allowed
                            ? <Icon name="Check" size={14} style={{ color }} />
                            : <Icon name="Minus" size={14} className="text-[#2a4060]" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 p-3 font-mono text-[10px] text-[#3a5570] flex items-center gap-2" style={{ background: "rgba(0,245,255,0.02)", border: "1px solid rgba(0,245,255,0.06)" }}>
        <Icon name="Info" size={11} className="flex-shrink-0" />
        Изменения применяются после нажатия «Сохранить всё». Пользователи увидят новые права при следующем входе.
      </div>
    </div>
  );
}

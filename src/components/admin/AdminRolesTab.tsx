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
  "инструктор": "#00ff88",
};

type Permissions = Record<string, Record<string, boolean>>;

export default function AdminRolesTab() {
  const [permissions, setPermissions] = useState<Permissions>({});
  const [pages, setPages] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

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
    } catch {
      setError("Ошибка соединения с сервером");
    }
    setLoading(false);
  };

  const toggle = (role: string, page: string) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [page]: !prev[role]?.[page],
      }
    }));
  };

  const save = async (role: string) => {
    setSaving(role);
    const res = await api.admin.setPermissions(role, permissions[role] || {});
    setSaving(null);
    if (res.message) {
      setMsg(res.message);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="font-mono text-sm text-[#ff2244] mb-3">{error}</div>
        <button onClick={load} className="font-mono text-xs px-4 py-2" style={{ border: "1px solid #1a2a3a", color: "#3a5570" }}>
          ПОВТОРИТЬ
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-orbitron text-lg font-bold text-white tracking-wider mb-1">МАТРИЦА ДОСТУПА</h2>
        <p className="font-mono text-xs text-[#3a5570]">Настройте какие разделы доступны каждой категории пользователей. Администраторы имеют полный доступ.</p>
      </div>

      {msg && (
        <div className="mb-5 p-3 font-plex text-sm text-[#00ff88]" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
          ✓ {msg}
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${roles.length}, 1fr)` }}>
        {roles.map(role => (
          <div key={role} className="card-drone p-5">
            {/* Role header */}
            <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: `1px solid ${ROLE_COLORS[role]}22` }}>
              <div>
                <div className="font-orbitron text-sm font-bold tracking-wider" style={{ color: ROLE_COLORS[role] }}>
                  {role.toUpperCase()}
                </div>
                <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">
                  {Object.values(permissions[role] || {}).filter(Boolean).length} из {pages.length} разделов
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allTrue = pages.every(p => permissions[role]?.[p]);
                    setPermissions(prev => ({
                      ...prev,
                      [role]: Object.fromEntries(pages.map(p => [p, !allTrue]))
                    }));
                  }}
                  className="font-mono text-[10px] px-2 py-1 transition-all"
                  style={{ border: `1px solid ${ROLE_COLORS[role]}44`, color: ROLE_COLORS[role] }}
                >
                  {pages.every(p => permissions[role]?.[p]) ? "СНЯТЬ ВСЕ" : "ВЫБРАТЬ ВСЕ"}
                </button>
              </div>
            </div>

            {/* Pages list */}
            <div className="space-y-1 mb-5">
              {pages.map(page => {
                const allowed = permissions[role]?.[page] ?? true;
                return (
                  <button
                    key={page}
                    onClick={() => toggle(role, page)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left"
                    style={{
                      background: allowed ? `${ROLE_COLORS[role]}08` : "transparent",
                      border: `1px solid ${allowed ? ROLE_COLORS[role] + "30" : "rgba(0,245,255,0.06)"}`,
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="w-4 h-4 flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        background: allowed ? ROLE_COLORS[role] : "transparent",
                        border: `1px solid ${allowed ? ROLE_COLORS[role] : "#2a4060"}`,
                      }}
                    >
                      {allowed && <Icon name="Check" size={10} className="text-[#050810]" />}
                    </div>
                    {/* Icon + label */}
                    <Icon name={PAGE_ICONS[page] || "File"} size={13} style={{ color: allowed ? ROLE_COLORS[role] : "#2a4060" }} />
                    <span className="font-mono text-xs" style={{ color: allowed ? "#c0d8e8" : "#2a4060" }}>
                      {PAGE_LABELS[page] || page}
                    </span>
                    {!allowed && (
                      <span className="ml-auto font-mono text-[9px] text-[#ff2244]">ЗАКРЫТ</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Save button */}
            <button
              onClick={() => save(role)}
              disabled={saving === role}
              className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-xs tracking-wider transition-all disabled:opacity-50"
              style={{
                background: `${ROLE_COLORS[role]}15`,
                border: `1px solid ${ROLE_COLORS[role]}`,
                color: ROLE_COLORS[role],
                boxShadow: saving !== role ? `0 0 12px ${ROLE_COLORS[role]}20` : "none",
              }}
            >
              {saving === role
                ? <><Icon name="Loader" size={13} className="animate-spin" />СОХРАНЕНИЕ...</>
                : <><Icon name="Save" size={13} />СОХРАНИТЬ</>
              }
            </button>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 font-mono text-xs text-[#3a5570]" style={{ background: "rgba(0,245,255,0.02)", border: "1px solid rgba(0,245,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Info" size={12} className="text-[#3a5570]" />
          <span>Изменения применяются сразу после сохранения. Пользователи увидят новые права при следующем входе или перезагрузке страницы.</span>
        </div>
      </div>
    </div>
  );
}
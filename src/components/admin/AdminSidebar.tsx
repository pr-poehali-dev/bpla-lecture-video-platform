import Icon from "@/components/ui/icon";

type Tab = "dashboard" | "users" | "roles" | "content" | "removals" | "discussions" | "lectures" | "videos" | "files" | "settings" | "pages" | "support" | "quizzes" | "audit" | "drones";

const sidebarGroups = [
  {
    label: "ОСНОВНОЕ",
    items: [{ key: "dashboard" as Tab, label: "Dashboard", icon: "LayoutDashboard" }],
  },
  {
    label: "УПРАВЛЕНИЕ",
    items: [
      { key: "users" as Tab, label: "Личный состав", icon: "Users" },
      { key: "roles" as Tab, label: "Доступы", icon: "Shield" },
      { key: "removals" as Tab, label: "Заявки", icon: "Trash2" },
      { key: "audit" as Tab, label: "Журнал", icon: "ClipboardList" },
    ],
  },
  {
    label: "КОНТЕНТ",
    items: [
      { key: "content" as Tab, label: "Все материалы", icon: "Layers" },
      { key: "lectures" as Tab, label: "Лекции", icon: "FileText" },
      { key: "videos" as Tab, label: "Видео", icon: "Play" },
      { key: "drones" as Tab, label: "Типы БпЛА", icon: "Plane" },
      { key: "discussions" as Tab, label: "Обсуждения", icon: "MessageSquare" },
      { key: "quizzes" as Tab, label: "Тесты", icon: "ClipboardCheck" },
    ],
  },
  {
    label: "СИСТЕМА",
    items: [
      { key: "pages" as Tab, label: "Страницы", icon: "Layout" },
      { key: "settings" as Tab, label: "Настройки", icon: "Settings" },
    ],
  },
  {
    label: "СВЯЗЬ",
    items: [
      { key: "support" as Tab, label: "Поддержка", icon: "Headphones" },
    ],
  },
];

interface Props {
  activeTab: Tab;
  collapsed: boolean;
  pendingCount: number;
  removalPendingCount: number;
  supportPendingCount: number;
  onNavigate: (tab: Tab) => void;
  onToggleCollapse: () => void;
  onGoToSite: () => void;
}

export default function AdminSidebar({
  activeTab, collapsed, pendingCount, removalPendingCount, supportPendingCount,
  onNavigate, onToggleCollapse, onGoToSite,
}: Props) {
  return (
    <>
      <aside
        className={`flex-shrink-0 flex-col transition-all duration-300 ${collapsed ? "hidden md:flex" : "flex fixed md:relative inset-y-0 left-0 z-40"}`}
        style={{ width: collapsed ? 56 : 220, background: "linear-gradient(180deg, #0d1b2e 0%, #081424 100%)", borderRight: "1px solid rgba(0,245,255,0.08)", minHeight: "100vh" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
          {!collapsed && (
            <div className="flex items-center gap-2 cursor-pointer" onClick={onGoToSite}>
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 8px rgba(0,245,255,0.3)" }}>
                <Icon name="Crosshair" size={13} className="text-[#00f5ff]" />
              </div>
              <div>
                <div className="font-orbitron text-[10px] font-bold leading-none tracking-[0.15em] text-[#00f5ff]">БпС</div>
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors ml-auto flex-shrink-0"
          >
            <Icon name={collapsed ? "ChevronRight" : "ChevronLeft"} size={15} />
          </button>
        </div>

        {/* Groups */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <div className="px-4 py-1.5 font-mono text-[9px] tracking-[0.3em]" style={{ color: "#2a4060" }}>{group.label}</div>
              )}
              {group.items.map((item) => {
                const isActive = activeTab === item.key;
                const badge =
                  item.key === "users" ? pendingCount
                  : item.key === "removals" ? removalPendingCount
                  : item.key === "support" ? supportPendingCount
                  : 0;
                return (
                  <button
                    key={item.key}
                    onClick={() => { onNavigate(item.key); if (window.innerWidth < 768) onToggleCollapse(); }}
                    title={collapsed ? item.label : undefined}
                    className="flex items-center gap-3 w-full transition-all"
                    style={{
                      padding: collapsed ? "10px 0" : "9px 16px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      color: isActive ? "#00f5ff" : "#5a7a95",
                      background: isActive ? "rgba(0,245,255,0.08)" : "transparent",
                      borderLeft: isActive ? "2px solid #00f5ff" : "2px solid transparent",
                    }}
                  >
                    <Icon name={item.icon as "Users"} size={15} />
                    {!collapsed && (
                      <>
                        <span className="font-plex text-sm flex-1 text-left">{item.label}</span>
                        {badge > 0 && (
                          <span
                            className="font-mono text-[9px] px-1.5 py-0.5 font-bold rounded-full flex-shrink-0"
                            style={{ background: item.key === "removals" ? "#ff2244" : "#ff6b00", color: "#fff" }}
                          >
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}>
            <button onClick={onGoToSite} className="flex items-center gap-2 w-full font-plex text-xs text-[#5a7a95] hover:text-[#00f5ff] transition-colors">
              <Icon name="Globe" size={13} />На сайт
            </button>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onToggleCollapse} />
      )}
    </>
  );
}

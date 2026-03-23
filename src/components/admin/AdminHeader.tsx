import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string; callsign?: string };
  onLogout: () => void;
  onGoToSite: () => void;
  onNavigate: (tab: string) => void;
}

const menuItems = [
  {
    label: "Пользователи",
    icon: "Users",
    items: [
      { label: "Личный состав", tab: "users", icon: "Users" },
      { label: "Доступы и роли", tab: "roles", icon: "Shield" },
      { label: "Заявки на удаление", tab: "removals", icon: "Trash2" },
    ],
  },
  {
    label: "Материалы",
    icon: "FileText",
    items: [
      { label: "Файлы и загрузки", tab: "files", icon: "Upload" },
    ],
  },
];

export default function AdminHeader({ currentUser, onLogout, onGoToSite, onNavigate }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="flex-shrink-0" style={{ background: "rgba(5,8,16,0.98)", borderBottom: "1px solid rgba(0,245,255,0.15)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between h-12 px-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoToSite}>
          <div className="w-7 h-7 flex items-center justify-center" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 10px rgba(0,245,255,0.3)" }}>
            <Icon name="Crosshair" size={14} className="text-[#00f5ff]" />
          </div>
          <div>
            <div className="font-orbitron text-[10px] font-bold leading-none tracking-[0.2em] text-[#00f5ff]">DRONE</div>
            <div className="font-orbitron text-[10px] font-bold leading-none tracking-[0.2em] text-white">ACADEMY</div>
          </div>
          <span className="font-mono text-[10px] text-[#3a5570] tracking-widest">/ ADMIN</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" style={{ boxShadow: "0 0 4px #00ff88" }} />
            <span className="font-mono text-xs text-[#5a7a95]">{currentUser.callsign || currentUser.name}</span>
          </div>
          <button
            onClick={onGoToSite}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs tracking-wider transition-all"
            style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}
          >
            <Icon name="Globe" size={12} />
            НА САЙТ
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs tracking-wider transition-all"
            style={{ border: "1px solid rgba(255,34,68,0.3)", color: "#ff2244", background: "rgba(255,34,68,0.04)" }}
          >
            <Icon name="LogOut" size={12} />
            ВЫХОД
          </button>
        </div>
      </div>

      {/* Nav menu bar */}
      <div className="flex items-center h-10 px-2" style={{ background: "rgba(0,245,255,0.02)" }}>
        {menuItems.map((menu) => (
          <div
            key={menu.label}
            className="relative"
            onMouseEnter={() => setOpenMenu(menu.label)}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              className="flex items-center gap-1.5 px-4 h-10 font-mono text-xs tracking-wider transition-all"
              style={{
                color: openMenu === menu.label ? "#00f5ff" : "#7a9bb5",
                background: openMenu === menu.label ? "rgba(0,245,255,0.06)" : "transparent",
                borderBottom: openMenu === menu.label ? "2px solid #00f5ff" : "2px solid transparent",
              }}
            >
              <Icon name={menu.icon as "Users"} size={12} />
              {menu.label}
              <Icon name="ChevronDown" size={10} />
            </button>

            {openMenu === menu.label && (
              <div
                className="absolute left-0 top-full z-50 w-52 py-1"
                style={{ background: "rgba(5,8,16,0.98)", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
              >
                {menu.items.map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => { onNavigate(item.tab); setOpenMenu(null); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 font-mono text-xs text-left transition-all text-[#7a9bb5] hover:text-[#00f5ff] hover:bg-[rgba(0,245,255,0.05)]"
                  >
                    <Icon name={item.icon as "Users"} size={12} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </header>
  );
}

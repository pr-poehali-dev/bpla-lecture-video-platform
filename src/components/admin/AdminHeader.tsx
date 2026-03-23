import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string; callsign?: string };
  onLogout: () => void;
  onGoToSite: () => void;
  onNavigate: (tab: string) => void;
  pendingCount?: number;
}

export default function AdminHeader({ currentUser, onLogout, onGoToSite, pendingCount = 0 }: Props) {
  const [search, setSearch] = useState("");

  return (
    <header
      className="flex items-center justify-between h-14 px-6 flex-shrink-0 z-30"
      style={{ background: "linear-gradient(90deg, #0d1b2e, #0a1628)", borderBottom: "1px solid rgba(0,245,255,0.1)" }}
    >
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-9 pr-3 py-1.5 font-plex text-xs text-white placeholder:text-[#3a5570] outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,255,0.12)", borderRadius: 4 }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="relative">
              <button className="w-8 h-8 flex items-center justify-center text-[#7a9bb5] hover:text-[#00f5ff] transition-colors">
                <Icon name="Bell" size={18} />
              </button>
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full font-mono text-[9px] font-bold" style={{ background: "#ff6b00", color: "#fff" }}>
                {pendingCount}
              </span>
            </div>
          )}
          <button
            onClick={onGoToSite}
            className="w-8 h-8 flex items-center justify-center text-[#7a9bb5] hover:text-[#00ff88] transition-colors"
            title="На сайт"
          >
            <Icon name="Globe" size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: "rgba(0,245,255,0.1)" }} />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center font-orbitron text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #00f5ff22, #00ff8822)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
            {(currentUser.callsign || currentUser.name)[0].toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="font-mono text-xs text-white leading-none">{currentUser.callsign || currentUser.name}</div>
            <div className="font-mono text-[10px] text-[#3a5570] leading-none mt-0.5">Администратор</div>
          </div>
          <button onClick={onLogout} className="ml-1 text-[#3a5570] hover:text-[#ff2244] transition-colors" title="Выход">
            <Icon name="LogOut" size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

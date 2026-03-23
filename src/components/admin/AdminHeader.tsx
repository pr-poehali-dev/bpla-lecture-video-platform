import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string; callsign?: string };
  onLogout: () => void;
  onGoToSite: () => void;
}

export default function AdminHeader({ currentUser, onLogout, onGoToSite }: Props) {
  return (
    <header className="flex items-center justify-between h-14 px-6 flex-shrink-0" style={{ background: "rgba(5,8,16,0.98)", borderBottom: "1px solid rgba(0,245,255,0.15)" }}>
      <div className="flex items-center gap-3 cursor-pointer" onClick={onGoToSite}>
        <div className="w-7 h-7 flex items-center justify-center" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 10px rgba(0,245,255,0.3)" }}>
          <Icon name="Crosshair" size={14} className="text-[#00f5ff]" />
        </div>
        <div>
          <div className="font-orbitron text-xs font-bold leading-none tracking-[0.2em] text-[#00f5ff]">DRONE</div>
          <div className="font-orbitron text-xs font-bold leading-none tracking-[0.2em] text-white">ACADEMY</div>
        </div>
        <span className="font-mono text-[10px] text-[#3a5570] ml-1 tracking-widest">/ ADMIN</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" style={{ boxShadow: "0 0 4px #00ff88" }} />
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
    </header>
  );
}
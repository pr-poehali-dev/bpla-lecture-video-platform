import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string };
  onLogout: () => void;
  onGoToSite: () => void;
}

export default function AdminHeader({ currentUser, onLogout, onGoToSite }: Props) {
  return (
    <header className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "rgba(0,245,255,0.15)", background: "rgba(5,8,16,0.98)" }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center" style={{ border: "1px solid #ff6b00", boxShadow: "0 0 12px rgba(255,107,0,0.3)" }}>
          <Icon name="Shield" size={16} className="text-[#ff6b00]" />
        </div>
        <div>
          <div className="font-orbitron text-sm font-bold text-white tracking-wider">АДМИН-ПАНЕЛЬ</div>
          <div className="font-mono text-[10px] text-[#3a5570]">DRONE ACADEMY</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-[#5a7a95]">@{currentUser.name}</span>
        <button onClick={onGoToSite} className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 transition-all" style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.05)" }}>
          <Icon name="Globe" size={13} />
          НА САЙТ
        </button>
        <button onClick={onLogout} className="flex items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#ff2244] transition-colors">
          <Icon name="LogOut" size={13} />
          ВЫХОД
        </button>
      </div>
    </header>
  );
}

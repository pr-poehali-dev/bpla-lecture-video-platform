import { useState } from "react";
import { type Page } from "@/App";
import Icon from "@/components/ui/icon";

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Crosshair" },
  { id: "lectures", label: "Лекции", icon: "BookOpen" },
  { id: "videos", label: "Видео", icon: "Play" },
  { id: "drone-types", label: "Типы БпЛА", icon: "Plane" },
  { id: "materials", label: "Материалы", icon: "FileText" },
  { id: "discussions", label: "Обсуждения", icon: "MessageSquare" },
  { id: "downloads", label: "Загрузки", icon: "Download" },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
  user?: { name: string; email: string };
  onLogout?: () => void;
  onBackToAdmin?: () => void;
}

export default function Layout({ currentPage, onNavigate, children, user, onLogout, onBackToAdmin }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen grid-bg" style={{ background: "#050810" }}>
      {/* Scan line effect */}
      <div
        className="fixed top-0 left-0 right-0 h-px z-50 pointer-events-none opacity-20"
        style={{
          background: "linear-gradient(90deg, transparent, #00f5ff, transparent)",
          animation: "scan-line 8s linear infinite",
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b" style={{ borderColor: "rgba(0,245,255,0.15)", background: "rgba(5,8,16,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="w-8 h-8 relative flex items-center justify-center" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 12px rgba(0,245,255,0.4)" }}>
              <Icon name="Crosshair" size={18} className="text-[#00f5ff]" />
            </div>
            <div>
              <div className="font-orbitron font-bold text-sm tracking-[0.2em] text-[#00f5ff] leading-none">DRONE</div>
              <div className="font-orbitron font-bold text-sm tracking-[0.2em] text-white leading-none">ACADEMY</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-sm font-plex text-xs tracking-wider uppercase transition-all duration-200 ${
                  currentPage === item.id
                    ? "text-[#00f5ff] bg-[rgba(0,245,255,0.08)]"
                    : "text-[#7a9bb5] hover:text-[#00f5ff] hover:bg-[rgba(0,245,255,0.05)]"
                }`}
                style={currentPage === item.id ? { borderBottom: "1px solid #00f5ff" } : {}}
              >
                <Icon name={item.icon} size={13} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* User + status */}
          <div className="hidden lg:flex items-center gap-3">
            {user && (
              <>
                {onBackToAdmin && (
                  <button onClick={onBackToAdmin} className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 transition-all" style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#ff6b00", background: "rgba(255,107,0,0.05)" }}>
                    <Icon name="Shield" size={12} />
                    ПАНЕЛЬ
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                  <span className="font-mono text-xs text-[#5a7a95]">{user.name}</span>
                </div>
                {onLogout && (
                  <button onClick={onLogout} className="flex items-center gap-1 font-mono text-xs text-[#3a5570] hover:text-[#ff2244] transition-colors">
                    <Icon name="LogOut" size={12} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-[#00f5ff] p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Icon name={mobileOpen ? "X" : "Menu"} size={20} />
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(5,8,16,0.98)" }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                className={`flex items-center gap-3 w-full px-6 py-3 font-plex text-sm tracking-wider uppercase transition-colors ${
                  currentPage === item.id ? "text-[#00f5ff] bg-[rgba(0,245,255,0.06)]" : "text-[#7a9bb5]"
                }`}
              >
                <Icon name={item.icon} size={15} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t py-8" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(5,8,16,0.8)" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-orbitron text-xs tracking-[0.3em] text-[#3a5570]">DRONE ACADEMY © 2026</div>
          <div className="font-mono text-xs text-[#3a5570]">БЕСПЛАТНЫЙ ДОСТУП К ЗНАНИЯМ</div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f5ff]" style={{ boxShadow: "0 0 6px #00f5ff" }} />
            <span className="font-mono text-xs text-[#3a5570]">SYS.ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
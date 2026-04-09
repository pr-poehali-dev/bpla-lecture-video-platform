import { useState, useEffect } from "react";
import { type Page, type User } from "@/App";
import Icon from "@/components/ui/icon";
import ChatWidget from "@/components/ChatWidget";
import { api } from "@/api";

function useServerStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      fetch("https://functions.poehali.dev/549cd8d9-b876-4355-9483-609144c1e199/?action=me", {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      })
        .then(() => setOnline(true))
        .catch(() => setOnline(false));
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  return online;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "lectures", label: "Лекции", icon: "BookOpen" },
  { id: "videos", label: "Видео", icon: "Play" },
  { id: "drone-types", label: "Типы БпЛА", icon: "Plane" },
  { id: "materials", label: "Материалы", icon: "FileText" },
  { id: "firmware", label: "Загрузки и прошивки", icon: "Cpu" },
  { id: "discussions", label: "Обсуждения", icon: "MessageSquare" },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
  user?: User;
  onLogout?: () => void;
  onGoToAdmin?: () => void;
}

function useUnreadCount(user?: User, currentPage?: Page) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = () => {
      api.msg.chatsList().then((res) => {
        const total = (res.chats || []).reduce((acc: number, c: { unread_count?: number }) => acc + (c.unread_count || 0), 0);
        setUnread(total);
      }).catch(() => {});
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (currentPage === "messages") setUnread(0);
  }, [currentPage]);

  return unread;
}

export default function Layout({ currentPage, onNavigate, children, user, onLogout, onGoToAdmin }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const serverOnline = useServerStatus();
  const unreadMessages = useUnreadCount(user, currentPage);

  const visibleNavItems = navItems.filter(item => {
    if (!user?.permissions) return true;
    return user.permissions[item.id] !== false;
  });

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
              <div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#050810]"
                title={serverOnline === null ? "Проверка..." : serverOnline ? "Сервер работает" : "Сервер недоступен"}
                style={{
                  background: serverOnline === null ? "#3a5570" : serverOnline ? "#00ff88" : "#ff2244",
                  boxShadow: serverOnline === null ? "none" : serverOnline ? "0 0 6px #00ff88" : "0 0 6px #ff2244",
                  animation: serverOnline === true ? "pulse 2s infinite" : "none",
                }}
              />
            </div>
            <div>
              <div className="font-orbitron font-bold text-sm tracking-[0.2em] text-[#00f5ff] leading-none">БПС</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => (
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
                {(["инструктор кт", "инструктор fpv", "инструктор оператор-сапер"].includes(user.role || "") || user.is_admin) && (
                  <button
                    onClick={() => onNavigate("content-upload")}
                    className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 transition-all"
                    style={{
                      border: `1px solid ${currentPage === "content-upload" ? "rgba(0,255,136,0.6)" : "rgba(0,255,136,0.25)"}`,
                      color: "#00ff88",
                      background: currentPage === "content-upload" ? "rgba(0,255,136,0.12)" : "rgba(0,255,136,0.04)",
                    }}
                  >
                    <Icon name="Upload" size={12} />
                    ЗАГРУЗИТЬ
                  </button>
                )}
                <button
                  onClick={() => onNavigate("messages")}
                  className={`flex items-center justify-center w-7 h-7 transition-all ${currentPage === "messages" ? "text-[#00f5ff]" : "text-[#5a7a95] hover:text-[#00f5ff]"}`}
                  style={{ border: `1px solid ${currentPage === "messages" ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,0.1)"}` }}
                >
                  <Icon name="MessageSquare" size={13} />
                </button>
                <a
                  href="/?mobile=1"
                  title="Мобильное приложение"
                  className="flex items-center justify-center w-7 h-7 transition-all text-[#5a7a95] hover:text-[#00ff88]"
                  style={{ border: "1px solid rgba(0,255,136,0.15)" }}
                >
                  <Icon name="Smartphone" size={13} />
                </a>
                <div
                  className="relative"
                  onMouseEnter={() => setProfileOpen(true)}
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <button className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                    <span className="font-mono text-xs text-[#5a7a95]">{user.callsign || user.name}</span>
                    <Icon name="ChevronDown" size={11} className="text-[#3a5570]" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full pt-2 w-72 max-w-[calc(100vw-1rem)] z-50">
                    <div
                      style={{ background: "rgba(5,8,16,0.98)", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 0 30px rgba(0,245,255,0.1)" }}
                    >
                      {/* Header дропдауна */}
                      <div className="p-4 border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.05)" }}>
                            {user.avatar_url
                              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <Icon name="User" size={16} className="text-[#00f5ff]" />
                            }
                          </div>
                          <div>
                            <div className="font-orbitron text-xs font-bold text-white leading-tight">{user.callsign || user.name}</div>
                            {user.callsign && <div className="font-plex text-[10px] text-[#5a7a95] mt-0.5">{user.name}</div>}
                          </div>
                        </div>
                      </div>

                      {/* Инфо */}
                      <div className="p-4 space-y-2.5">
                        {user.rank && (
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-[#3a5570] tracking-wider uppercase">Звание</span>
                            <span className="font-mono text-[10px] text-[#00f5ff]">{user.rank}</span>
                          </div>
                        )}
                        {user.role && (
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-[#3a5570] tracking-wider uppercase">Роль</span>
                            <span className="font-mono text-[10px] text-[#00ff88]">{user.role}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-[#3a5570] tracking-wider uppercase">Статус</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" style={{ boxShadow: "0 0 4px #00ff88" }} />
                            <span className="font-mono text-[10px] text-[#00ff88]">ONLINE</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-[#3a5570] tracking-wider uppercase">Email</span>
                          <span className="font-mono text-[10px] text-[#5a7a95] truncate max-w-[130px]">{user.email}</span>
                        </div>
                      </div>

                      {/* Кнопки */}
                      <div className="border-t" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                        <button
                          onClick={() => { onNavigate("profile"); setProfileOpen(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 font-mono text-xs text-[#7a9bb5] hover:text-[#00f5ff] hover:bg-[rgba(0,245,255,0.05)] transition-all"
                        >
                          <Icon name="User" size={12} />
                          ЛИЧНОЕ ДЕЛО
                        </button>
                        {user.is_admin && onGoToAdmin && (
                          <button
                            onClick={() => { onGoToAdmin(); setProfileOpen(false); }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 font-mono text-xs hover:bg-[rgba(255,107,0,0.05)] transition-all"
                            style={{ color: "#ff6b00" }}
                          >
                            <Icon name="LayoutDashboard" size={12} />
                            ПАНЕЛЬ АДМИНИСТРАТОРА
                          </button>
                        )}
                        {onLogout && (
                          <button
                            onClick={onLogout}
                            className="flex items-center gap-2 w-full px-4 py-2.5 font-mono text-xs text-[#3a5570] hover:text-[#ff2244] hover:bg-[rgba(255,34,68,0.05)] transition-all"
                          >
                            <Icon name="LogOut" size={12} />
                            ВЫЙТИ
                          </button>
                        )}
                      </div>
                    </div>
                    </div>
                  )}
                </div>
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
            {visibleNavItems.map((item) => (
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
            {user && (
              <button
                onClick={() => { onNavigate("profile"); setMobileOpen(false); }}
                className={`flex items-center gap-3 w-full px-6 py-3 font-plex text-sm tracking-wider uppercase transition-colors ${
                  currentPage === "profile" ? "text-[#00f5ff] bg-[rgba(0,245,255,0.06)]" : "text-[#7a9bb5]"
                }`}
              >
                <Icon name="User" size={15} />
                Личное Дело
              </button>
            )}
            {user && (user.role?.startsWith("инструктор") || user.is_admin) && (
              <button
                onClick={() => { onNavigate("content-upload"); setMobileOpen(false); }}
                className={`flex items-center gap-3 w-full px-6 py-3 font-plex text-sm tracking-wider uppercase transition-colors ${
                  currentPage === "content-upload" ? "text-[#00ff88] bg-[rgba(0,255,136,0.06)]" : "text-[#7a9bb5]"
                }`}
              >
                <Icon name="Upload" size={15} />
                Загрузить материал
              </button>
            )}
            {user?.is_admin && onGoToAdmin && (
              <button
                onClick={() => { onGoToAdmin(); setMobileOpen(false); }}
                className="flex items-center gap-3 w-full px-6 py-3 font-plex text-sm tracking-wider uppercase transition-colors"
                style={{ color: "#ff6b00" }}
              >
                <Icon name="LayoutDashboard" size={15} />
                Панель администратора
              </button>
            )}
            {user && (
              <a
                href="/?mobile=1"
                className="flex items-center gap-3 w-full px-6 py-3 font-plex text-sm tracking-wider uppercase border-t"
                style={{ borderColor: "rgba(0,245,255,0.1)", color: "#00ff88" }}
              >
                <Icon name="Smartphone" size={15} />
                Мобильное приложение
              </a>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="pt-16 pb-16 sm:pb-0">
        {children}
      </main>

      {/* Chat widget */}
      {user && currentPage !== "messages" && <ChatWidget user={user} />}

      {/* Bottom navigation — mobile only */}
      {user && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex sm:hidden"
          style={{ background: "rgba(5,8,16,0.97)", borderTop: "1px solid rgba(0,245,255,0.15)", backdropFilter: "blur(12px)" }}
        >
          {[
            { id: "home" as Page, icon: "Home", label: "Главная" },
            { id: "lectures" as Page, icon: "BookOpen", label: "Лекции" },
            { id: "videos" as Page, icon: "Play", label: "Видео" },
            { id: "discussions" as Page, icon: "MessageSquare", label: "Форум" },
            { id: "messages" as Page, icon: "MessageCircle", label: "Чат" },
            { id: "profile" as Page, icon: "User", label: "Профиль" },
          ].map((item) => {
            const isActive = currentPage === item.id;
            const badge = item.id === "messages" && unreadMessages > 0 ? unreadMessages : 0;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex-1 relative flex flex-col items-center justify-center gap-0.5 py-2 transition-all"
                style={{ color: isActive ? "#00f5ff" : "#3a5570" }}
              >
                <div className="relative">
                  <Icon name={item.icon} size={isActive ? 20 : 18} />
                  {badge > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center font-mono text-[9px] font-bold rounded-full px-1"
                      style={{ background: "#ff2244", color: "#fff", boxShadow: "0 0 6px rgba(255,34,68,0.6)" }}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[9px] tracking-wider">{item.label.toUpperCase()}</span>
                {isActive && (
                  <div className="absolute bottom-0 w-6 h-0.5" style={{ background: "#00f5ff", boxShadow: "0 0 6px #00f5ff" }} />
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* Footer */}
      <footer className="mt-12 sm:mt-20 border-t py-6 sm:py-8" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(5,8,16,0.8)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="font-orbitron text-[10px] sm:text-xs tracking-[0.3em] text-[#3a5570]">DRONE ACADEMY © 2026</div>
          <div className="font-mono text-[10px] sm:text-xs text-[#3a5570]">БЕСПЛАТНЫЙ ДОСТУП К ЗНАНИЯМ</div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f5ff]" style={{ boxShadow: "0 0 6px #00f5ff" }} />
            <span className="font-mono text-[10px] sm:text-xs text-[#3a5570]">SYS.ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
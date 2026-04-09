import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Icon from "@/components/ui/icon";
import HomePage from "@/pages/HomePage";
import LecturesPage from "@/pages/LecturesPage";
import VideosPage from "@/pages/VideosPage";
import MaterialsPage from "@/pages/MaterialsPage";
import DroneTypesPage from "@/pages/DroneTypesPage";
import DiscussionsPage from "@/pages/DiscussionsPage";
import FirmwarePage from "@/pages/FirmwarePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import MessagesPage from "@/pages/MessagesPage";
import ContentUploadPage from "@/pages/ContentUploadPage";
import Layout from "@/components/Layout";
import Intro from "@/components/Intro";
import AdminPage from "@/pages/AdminPage";
import { api } from "@/api";

export type Page = "home" | "lectures" | "videos" | "materials" | "drone-types" | "discussions" | "firmware" | "profile" | "messages" | "content-upload";
type AuthPage = "login" | "register";

export interface User {
  id: number;
  name: string;
  email: string;
  callsign?: string;
  rank?: string;
  contacts?: string;
  avatar_url?: string | null;
  is_admin: boolean;
  status: string;
  role?: string;
  permissions?: Record<string, boolean>;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [siteEnabled, setSiteEnabled] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState("Сайт временно недоступен. Ведутся технические работы.");

  const [introDone, setIntroDone] = useState(() => !!sessionStorage.getItem("intro_done"));

  useEffect(() => {
    api.admin.getSettings().then((res) => {
      if (res.settings) {
        if (res.settings.site_enabled === "false") setSiteEnabled(false);
        if (res.settings.maintenance_message) setMaintenanceMessage(res.settings.maintenance_message);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("drone_token");
    if (!token) { setChecking(false); return; }
    api.me().then((res) => {
      if (res.user) setUser(res.user as User);
      else localStorage.removeItem("drone_token");
      setChecking(false);
    }).catch(() => setChecking(false));

    const ping = setInterval(() => {
      if (localStorage.getItem("drone_token")) api.me().catch(() => {});
    }, 60000);
    return () => clearInterval(ping);
  }, []);

  const handleLogin = (u: object) => {
    setUser(u as User);
  };

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem("drone_token");
    setUser(null);
    setAuthPage("login");
  };

  if (!introDone) {
    return (
      <Intro onDone={() => {
        sessionStorage.setItem("intro_done", "1");
        setIntroDone(true);
      }} />
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg" style={{ background: "#050810" }}>
        <div className="text-center">
          <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 20px rgba(0,245,255,0.3)" }}>
            <Icon name="Crosshair" size={24} className="text-[#00f5ff]" />
          </div>
          <div className="font-mono text-xs text-[#3a5570] tracking-[0.3em]">ИНИЦИАЛИЗАЦИЯ...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (!siteEnabled) {
      return (
        <TooltipProvider>
          <div className="min-h-screen flex items-center justify-center grid-bg" style={{ background: "#050810" }}>
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ border: "1px solid rgba(255,107,0,0.5)", boxShadow: "0 0 30px rgba(255,107,0,0.2)" }}>
                <Icon name="Wrench" size={28} className="text-[#ff6b00]" />
              </div>
              <div className="font-mono text-xs text-[#ff6b00] tracking-[0.4em] mb-4">// ТЕХНИЧЕСКИЕ РАБОТЫ</div>
              <div className="font-orbitron text-2xl font-black text-white mb-4 tracking-wider">САЙТ НЕДОСТУПЕН</div>
              <p className="font-plex text-sm text-[#5a7a95] leading-relaxed mb-8">{maintenanceMessage}</p>
              <button
                onClick={() => setAuthPage("login")}
                className="font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors underline"
              >
                Войти как администратор
              </button>
            </div>
          </div>
        </TooltipProvider>
      );
    }
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {authPage === "register"
          ? <RegisterPage onBack={() => setAuthPage("login")} />
          : <LoginPage onLogin={handleLogin} onRegister={() => setAuthPage("register")} />
        }
      </TooltipProvider>
    );
  }

  if (!siteEnabled && !user.is_admin) {
    return (
      <TooltipProvider>
        <div className="min-h-screen flex items-center justify-center grid-bg" style={{ background: "#050810" }}>
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ border: "1px solid rgba(255,107,0,0.5)", boxShadow: "0 0 30px rgba(255,107,0,0.2)" }}>
              <Icon name="Wrench" size={28} className="text-[#ff6b00]" />
            </div>
            <div className="font-mono text-xs text-[#ff6b00] tracking-[0.4em] mb-4">// ТЕХНИЧЕСКИЕ РАБОТЫ</div>
            <div className="font-orbitron text-2xl font-black text-white mb-4 tracking-wider">САЙТ НЕДОСТУПЕН</div>
            <p className="font-plex text-sm text-[#5a7a95] leading-relaxed mb-8">{maintenanceMessage}</p>
            <button
              onClick={handleLogout}
              className="font-mono text-xs text-[#3a5570] hover:text-[#ff2244] transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  const canAccess = (page: Page): boolean => {
    if (!user?.permissions) return true;
    if (user.is_admin) return true;
    return user.permissions[page] !== false;
  };

  const navigate = (page: Page) => {
    if (canAccess(page)) setCurrentPage(page);
    else setCurrentPage("home");
  };

  const renderPage = () => {
    if (!canAccess(currentPage)) return <HomePage onNavigate={navigate} />;
    switch (currentPage) {
      case "home": return <HomePage onNavigate={navigate} />;
      case "lectures": return <LecturesPage />;
      case "videos": return <VideosPage />;
      case "materials": return <MaterialsPage user={user} />;
      case "drone-types": return <DroneTypesPage />;
      case "discussions": return <DiscussionsPage user={user} />;
      case "content-upload": return <ContentUploadPage user={user} />;
      case "firmware": return <FirmwarePage user={user} />;
      case "profile": return <ProfilePage user={user} onUpdate={(u) => setUser(u)} onNavigate={navigate} onGoToAdmin={user.is_admin ? () => setShowAdmin(true) : undefined} />;
      case "messages": return <MessagesPage user={user} />;
      default: return <HomePage onNavigate={navigate} />;
    }
  };

  if (showAdmin && user?.is_admin) {
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AdminPage
          currentUser={user}
          onLogout={() => { handleLogout(); setShowAdmin(false); }}
          onGoToSite={() => setShowAdmin(false)}
        />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Layout currentPage={currentPage} onNavigate={navigate} user={user} onLogout={handleLogout} onGoToAdmin={user?.is_admin ? () => setShowAdmin(true) : undefined}>
        {renderPage()}
      </Layout>
    </TooltipProvider>
  );
}
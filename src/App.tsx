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
import DownloadsPage from "@/pages/DownloadsPage";
import DiscussionsPage from "@/pages/DiscussionsPage";
import FirmwarePage from "@/pages/FirmwarePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminPage from "@/pages/AdminPage";
import ProfilePage from "@/pages/ProfilePage";
import MessagesPage from "@/pages/MessagesPage";
import Layout from "@/components/Layout";
import Intro from "@/components/Intro";
import { api } from "@/api";

export type Page = "home" | "lectures" | "videos" | "materials" | "drone-types" | "downloads" | "discussions" | "firmware" | "profile" | "messages";
type AuthPage = "login" | "register";

export interface User {
  id: number;
  name: string;
  email: string;
  callsign?: string;
  rank?: string;
  contacts?: string;
  is_admin: boolean;
  status: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [adminViewSite, setAdminViewSite] = useState(false);
  const [introDone, setIntroDone] = useState(() => !!sessionStorage.getItem("intro_done"));

  useEffect(() => {
    const token = localStorage.getItem("drone_token");
    if (!token) { setChecking(false); return; }
    api.me().then((res) => {
      if (res.user) setUser(res.user as User);
      else localStorage.removeItem("drone_token");
      setChecking(false);
    }).catch(() => setChecking(false));
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

  if (user.is_admin && !adminViewSite) {
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AdminPage currentUser={user} onLogout={handleLogout} onGoToSite={() => setAdminViewSite(true)} />
      </TooltipProvider>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home": return <HomePage onNavigate={setCurrentPage} />;
      case "lectures": return <LecturesPage />;
      case "videos": return <VideosPage />;
      case "materials": return <MaterialsPage />;
      case "drone-types": return <DroneTypesPage />;
      case "downloads": return <DownloadsPage />;
      case "discussions": return <DiscussionsPage />;
      case "firmware": return <FirmwarePage />;
      case "profile": return <ProfilePage user={user} onUpdate={(u) => setUser(u)} />;
      case "messages": return <MessagesPage user={user} />;
      default: return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Layout currentPage={currentPage} onNavigate={setCurrentPage} user={user} onLogout={handleLogout} onBackToAdmin={user?.is_admin ? () => setAdminViewSite(false) : undefined}>
        {renderPage()}
      </Layout>
    </TooltipProvider>
  );
}
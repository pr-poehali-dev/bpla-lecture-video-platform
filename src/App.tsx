import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Icon from "@/components/ui/icon";
import Layout from "@/components/Layout";
import Intro from "@/components/Intro";
import { api } from "@/api";

const HomePage = lazy(() => import("@/pages/HomePage"));
const LecturesPage = lazy(() => import("@/pages/LecturesPage"));
const VideosPage = lazy(() => import("@/pages/VideosPage"));
const MaterialsPage = lazy(() => import("@/pages/MaterialsPage"));
const DroneTypesPage = lazy(() => import("@/pages/DroneTypesPage"));
const DiscussionsPage = lazy(() => import("@/pages/DiscussionsPage"));
const FirmwarePage = lazy(() => import("@/pages/FirmwarePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const ContentUploadPage = lazy(() => import("@/pages/ContentUploadPage"));

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

  const [introDone, setIntroDone] = useState(() => !!sessionStorage.getItem("intro_done"));

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
    }, 30000);
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
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={null}>
          {authPage === "register"
            ? <RegisterPage onBack={() => setAuthPage("login")} />
            : <LoginPage onLogin={handleLogin} onRegister={() => setAuthPage("register")} />
          }
        </Suspense>
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
      case "firmware": return <FirmwarePage />;
      case "profile": return <ProfilePage user={user} onUpdate={(u) => setUser(u)} onNavigate={navigate} />;
      case "messages": return <MessagesPage user={user} />;
      default: return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Layout currentPage={currentPage} onNavigate={navigate} user={user} onLogout={handleLogout}>
        <Suspense fallback={null}>{renderPage()}</Suspense>
      </Layout>
    </TooltipProvider>
  );
}
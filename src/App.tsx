import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/HomePage";
import LecturesPage from "@/pages/LecturesPage";
import VideosPage from "@/pages/VideosPage";
import MaterialsPage from "@/pages/MaterialsPage";
import DroneTypesPage from "@/pages/DroneTypesPage";
import DownloadsPage from "@/pages/DownloadsPage";
import DiscussionsPage from "@/pages/DiscussionsPage";
import Layout from "@/components/Layout";

export type Page = "home" | "lectures" | "videos" | "materials" | "drone-types" | "downloads" | "discussions";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const renderPage = () => {
    switch (currentPage) {
      case "home": return <HomePage onNavigate={setCurrentPage} />;
      case "lectures": return <LecturesPage />;
      case "videos": return <VideosPage />;
      case "materials": return <MaterialsPage />;
      case "drone-types": return <DroneTypesPage />;
      case "downloads": return <DownloadsPage />;
      case "discussions": return <DiscussionsPage />;
      default: return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    </TooltipProvider>
  );
}

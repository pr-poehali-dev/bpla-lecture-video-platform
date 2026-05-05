import { useState, useEffect } from "react";
import { api, FileItem } from "@/api";
import { type User } from "@/App";
import { usePageData } from "@/hooks/usePageData";
import TacmedDocViewer from "./tacmed/TacmedDocViewer";
import TacmedFileList from "./tacmed/TacmedFileList";
import TacmedEquipment from "./tacmed/TacmedEquipment";
import Icon from "@/components/ui/icon";

const TACMED_CATEGORIES = ["Все", "Первая помощь", "Турникеты и жгуты", "Эвакуация", "Протоколы", "Аптечка"];

type MainTab = "tourniquets" | "kits" | "docs";

interface Props {
  user: User | null;
}

export default function TacmedPage({ user }: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [viewing, setViewing] = useState<FileItem | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("tourniquets");

  const canDownload = !user || user.is_admin || user.role !== "курсант";

  useEffect(() => {
    api.files.list("document", undefined, "tacmed").then((res) => {
      setFiles(res.files || []);
      setLoading(false);
    }).catch(() => {
      api.files.list("document").then((res) => {
        const all: FileItem[] = res.files || [];
        setFiles(all.filter((f) => f.section === "tacmed" || f.category === "tacmed"));
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const { header } = usePageData("tacmed");
  const categories = header?.categories ?? TACMED_CATEGORIES;

  const TABS = [
    { key: "tourniquets", label: "ЖГУТЫ",     icon: "Activity", color: "#00f5ff" },
    { key: "kits",        label: "АПТЕЧКИ",   icon: "Cross",    color: "#00ff88" },
    { key: "docs",        label: "ДОКУМЕНТЫ", icon: "FileText", color: "#ff6b00" },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {viewing && (
        <TacmedDocViewer file={viewing} onClose={() => setViewing(null)} canDownload={canDownload} />
      )}

      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">{header?.subtitle ?? "// ТАКТИЧЕСКАЯ МЕДИЦИНА"}</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-6 tracking-wider">{header?.title ?? "ТАК МЕД"}</h1>

      {/* ── Главные вкладки ── */}
      <div className="flex items-center gap-0 mb-8" style={{ borderBottom: "1px solid rgba(0,245,255,0.12)" }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className="flex items-center gap-2 px-5 py-3 font-mono text-xs tracking-wider transition-all"
            style={{
              color: mainTab === tab.key ? tab.color : "#3a5570",
              borderBottom: mainTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent",
              background: mainTab === tab.key ? `${tab.color}08` : "transparent",
              marginBottom: -1,
            }}
          >
            <Icon name={tab.icon} size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Жгуты и аптечки через TacmedEquipment — показываем нужную вкладку */}
      {(mainTab === "tourniquets" || mainTab === "kits") && (
        <TacmedEquipment equipTab={mainTab} />
      )}

      {/* Документы */}
      {mainTab === "docs" && (
        <TacmedFileList
          files={files}
          loading={loading}
          activeCategory={activeCategory}
          categories={categories}
          canDownload={canDownload}
          onCategoryChange={setActiveCategory}
          onView={setViewing}
        />
      )}
    </div>
  );
}
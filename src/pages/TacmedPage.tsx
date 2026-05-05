import { useState, useEffect } from "react";
import { api, FileItem } from "@/api";
import { type User } from "@/App";
import { usePageData } from "@/hooks/usePageData";
import TacmedDocViewer from "./tacmed/TacmedDocViewer";
import TacmedFileList from "./tacmed/TacmedFileList";

const TACMED_CATEGORIES = ["Все", "Первая помощь", "Турникеты и жгуты", "Эвакуация", "Протоколы", "Аптечка"];

interface Props {
  user: User | null;
}

export default function TacmedPage({ user }: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [viewing, setViewing] = useState<FileItem | null>(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {viewing && (
        <TacmedDocViewer file={viewing} onClose={() => setViewing(null)} canDownload={canDownload} />
      )}

      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">{header?.subtitle ?? "// ТАКТИЧЕСКАЯ МЕДИЦИНА"}</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-5 sm:mb-6 tracking-wider">{header?.title ?? "ТАК МЕД"}</h1>

      <TacmedFileList
        files={files}
        loading={loading}
        activeCategory={activeCategory}
        categories={categories}
        canDownload={canDownload}
        onCategoryChange={setActiveCategory}
        onView={setViewing}
      />
    </div>
  );
}

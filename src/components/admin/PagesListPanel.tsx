import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";

interface Page { id: number; slug: string; title: string; is_system: boolean; is_visible: boolean; sort_order: number; }

interface Props {
  pages: Page[];
  selectedPage: Page | null;
  onSelectPage: (page: Page) => void;
  onPagesChanged: () => void;
  msg: { text: string; ok: boolean } | null;
  flash: (text: string, ok?: boolean) => void;
}

export default function PagesListPanel({ pages, selectedPage, onSelectPage, onPagesChanged, msg, flash }: Props) {
  const [showNewPage, setShowNewPage] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const createPage = async () => {
    if (!newSlug || !newTitle) return;
    setCreating(true);
    const res = await api.admin.createPage(newSlug, newTitle);
    setCreating(false);
    if (res.id) {
      flash("Страница создана");
      setShowNewPage(false);
      setNewSlug("");
      setNewTitle("");
      onPagesChanged();
    } else {
      flash(res.error || "Ошибка", false);
    }
  };

  const toggleVisible = async (page: Page) => {
    await api.admin.updatePage(page.id, { is_visible: !page.is_visible });
    onPagesChanged();
  };

  const deletePage = async (page: Page) => {
    if (!confirm(`Удалить страницу «${page.title}»?`)) return;
    const res = await api.admin.deletePage(page.id);
    if (res.message) {
      flash("Страница удалена");
      onPagesChanged();
    } else {
      flash(res.error || "Ошибка", false);
    }
  };

  return (
    <div className="w-64 flex-shrink-0 space-y-2">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs text-[#00f5ff] tracking-widest">СТРАНИЦЫ</span>
        <button onClick={() => setShowNewPage(!showNewPage)}
          className="font-mono text-[10px] px-2 py-1 transition-all flex items-center gap-1"
          style={{ border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88" }}>
          <Icon name="Plus" size={10} /> НОВАЯ
        </button>
      </div>

      {showNewPage && (
        <div className="p-3 space-y-2 mb-3" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "#0a1520" }}>
          <input placeholder="slug (напр. about)" value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-[#00f5ff]" />
          <input placeholder="Название" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-transparent border border-[#1a2a3a] px-2 py-1.5 font-plex text-sm text-white outline-none focus:border-[#00f5ff]" />
          <button onClick={createPage} disabled={creating || !newSlug || !newTitle}
            className="w-full font-mono text-xs py-1.5 disabled:opacity-40 transition-all"
            style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
            {creating ? "Создание..." : "Создать"}
          </button>
        </div>
      )}

      {pages.map(page => (
        <div key={page.id}
          className="group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all"
          style={{
            border: selectedPage?.id === page.id ? "1px solid rgba(0,245,255,0.4)" : "1px solid rgba(0,245,255,0.08)",
            background: selectedPage?.id === page.id ? "rgba(0,245,255,0.06)" : "transparent",
          }}
          onClick={() => onSelectPage(page)}
        >
          <div className="min-w-0">
            <div className="font-plex text-sm text-white truncate">{page.title}</div>
            <div className="font-mono text-[10px] text-[#3a5570]">/{page.slug}</div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button title={page.is_visible ? "Скрыть" : "Показать"} onClick={() => toggleVisible(page)}
              className={page.is_visible ? "text-[#00ff88]" : "text-[#3a5570]"}>
              <Icon name={page.is_visible ? "Eye" : "EyeOff"} size={12} />
            </button>
            {!page.is_system && (
              <button title="Удалить" onClick={() => deletePage(page)} className="text-[#3a5570] hover:text-[#ff2244]">
                <Icon name="Trash2" size={12} />
              </button>
            )}
          </div>
        </div>
      ))}

      {msg && (
        <div className="mt-3 p-2 font-mono text-[10px]" style={{
          border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`,
          color: msg.ok ? "#00ff88" : "#ff2244",
        }}>{msg.ok ? "✓" : "✗"} {msg.text}</div>
      )}
    </div>
  );
}

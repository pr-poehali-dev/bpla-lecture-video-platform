import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import BlockEditor from "@/components/admin/BlockEditor";
import PagesListPanel from "@/components/admin/PagesListPanel";

interface Page { id: number; slug: string; title: string; is_system: boolean; is_visible: boolean; sort_order: number; }
interface Block { id: number; type: string; sort_order: number; data: unknown; }

const BLOCK_TYPES = [
  { type: "hero", label: "Герой (главный баннер)" },
  { type: "stats", label: "Статистика (цифры)" },
  { type: "features", label: "Карточки разделов" },
  { type: "cta", label: "Призыв к действию" },
  { type: "text", label: "Текстовый блок" },
  { type: "intro-video", label: "Интро-видео" },
];

export default function AdminPagesTab() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const loadPages = async () => {
    const res = await api.admin.getPages();
    if (res.pages) setPages(res.pages.filter((p: Page) => !p.slug.includes("_deleted_")));
    setLoading(false);
  };

  const loadBlocks = async (page: Page) => {
    setBlocksLoading(true);
    const res = await api.admin.getPageBlocks(page.id);
    if (res.blocks) setBlocks(res.blocks.filter((b: Block) => b.sort_order >= 0));
    setBlocksLoading(false);
  };

  useEffect(() => { loadPages(); }, []);

  const selectPage = (page: Page) => {
    setSelectedPage(page);
    loadBlocks(page);
  };

  const handlePagesChanged = () => {
    loadPages();
  };

  const saveBlock = async (block_id: number, data: unknown) => {
    await api.admin.updateBlock(block_id, data);
  };

  const deleteBlock = async (block_id: number) => {
    if (!confirm("Удалить блок?")) return;
    const res = await api.admin.deleteBlock(block_id);
    if (res.message && selectedPage) loadBlocks(selectedPage);
    else flash(res.error || "Ошибка", false);
  };

  const addBlock = async (type: string) => {
    if (!selectedPage) return;
    setAddingBlock(true);
    const res = await api.admin.addBlock(selectedPage.id, type);
    setAddingBlock(false);
    if (res.block_id) loadBlocks(selectedPage);
    else flash(res.error || "Ошибка", false);
  };

  if (loading) return <div className="text-center py-16 font-mono text-sm text-[#3a5570] tracking-widest">ЗАГРУЗКА...</div>;

  return (
    <div className="flex gap-6 min-h-[500px]">
      <PagesListPanel
        pages={pages}
        selectedPage={selectedPage}
        onSelectPage={selectPage}
        onPagesChanged={handlePagesChanged}
        msg={msg}
        flash={flash}
      />

      {/* Right: block editor */}
      <div className="flex-1 min-w-0">
        {!selectedPage ? (
          <div className="flex items-center justify-center h-full text-center py-20">
            <div>
              <Icon name="Layout" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
              <div className="font-mono text-xs text-[#3a5570]">Выбери страницу слева</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-[#00f5ff] tracking-widest">{selectedPage.title.toUpperCase()}</div>
                <div className="font-mono text-[10px] text-[#3a5570]">/{selectedPage.slug} · {blocks.length} блоков</div>
              </div>
              <div className="flex items-center gap-2">
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type} onClick={() => addBlock(bt.type)} disabled={addingBlock}
                    title={bt.label}
                    className="font-mono text-[10px] px-2 py-1 transition-all disabled:opacity-40"
                    style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#5a7a95" }}>
                    + {bt.type}
                  </button>
                ))}
              </div>
            </div>

            {blocksLoading ? (
              <div className="text-center py-10 font-mono text-xs text-[#3a5570]">ЗАГРУЗКА БЛОКОВ...</div>
            ) : blocks.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="Layers" size={28} className="text-[#1a2a3a] mx-auto mb-2" />
                <div className="font-mono text-xs text-[#3a5570]">Нет блоков. Добавь первый.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map(block => (
                  <BlockEditor key={block.id} block={block} onSave={saveBlock} onDelete={deleteBlock} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

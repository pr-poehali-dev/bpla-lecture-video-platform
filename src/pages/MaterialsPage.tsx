import Icon from "@/components/ui/icon";

const materials = [
  { id: 1, title: "Боевой регламент применения FPV дронов", type: "PDF", size: "2.4 МБ", category: "Регламенты", date: "15 мар 2026", pages: 48 },
  { id: 2, title: "Тактические карты зон применения", type: "ZIP", size: "18.7 МБ", category: "Карты", date: "12 мар 2026", pages: null },
  { id: 3, title: "Техническое руководство: Betaflight 4.5", type: "PDF", size: "5.1 МБ", category: "Технические", date: "08 мар 2026", pages: 124 },
  { id: 4, title: "Протокол связи между операторами", type: "PDF", size: "0.8 МБ", category: "Регламенты", date: "05 мар 2026", pages: 16 },
  { id: 5, title: "Схемы сборки ударных дронов", type: "ZIP", size: "34.2 МБ", category: "Схемы", date: "01 мар 2026", pages: null },
  { id: 6, title: "Руководство по РЭБ и защите канала", type: "PDF", size: "3.6 МБ", category: "Технические", date: "26 фев 2026", pages: 72 },
  { id: 7, title: "Методика подготовки FPV оператора", type: "PDF", size: "1.9 МБ", category: "Учебные", date: "20 фев 2026", pages: 36 },
  { id: 8, title: "Полевое руководство: ТО дрона в условиях боя", type: "PDF", size: "4.3 МБ", category: "Технические", date: "14 фев 2026", pages: 88 },
];

const typeColor: Record<string, string> = {
  PDF: "#ff6b00",
  ZIP: "#a855f7",
};

const categories = ["Все", "Регламенты", "Технические", "Учебные", "Схемы", "Карты"];

export default function MaterialsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// БАЗА ДАННЫХ</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-8 tracking-wider">МАТЕРИАЛЫ</h1>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button key={cat} className="tag-badge hover:bg-[rgba(0,245,255,0.15)] transition-colors cursor-pointer">
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 mb-2" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
            <div className="col-span-1 font-mono text-[10px] text-[#3a5570] tracking-widest">#</div>
            <div className="col-span-5 font-mono text-[10px] text-[#3a5570] tracking-widest">НАЗВАНИЕ</div>
            <div className="col-span-2 font-mono text-[10px] text-[#3a5570] tracking-widest">КАТЕГОРИЯ</div>
            <div className="col-span-1 font-mono text-[10px] text-[#3a5570] tracking-widest">ТИП</div>
            <div className="col-span-1 font-mono text-[10px] text-[#3a5570] tracking-widest">РАЗМЕР</div>
            <div className="col-span-1 font-mono text-[10px] text-[#3a5570] tracking-widest">ДАТА</div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          {materials.map((m, i) => (
            <div
              key={m.id}
              className="card-drone grid grid-cols-12 gap-2 items-center px-4 py-3 mb-2 animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="col-span-1 font-mono text-xs text-[#2a4060]">{String(m.id).padStart(2, "0")}</div>
              <div className="col-span-5">
                <div className="font-plex text-sm text-white">{m.title}</div>
                {m.pages && <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">{m.pages} стр.</div>}
              </div>
              <div className="col-span-2">
                <span className="tag-badge text-[10px]">{m.category}</span>
              </div>
              <div className="col-span-1">
                <span className="font-mono text-xs font-bold" style={{ color: typeColor[m.type] || "#00f5ff" }}>{m.type}</span>
              </div>
              <div className="col-span-1 font-mono text-xs text-[#5a7a95]">{m.size}</div>
              <div className="col-span-1 font-mono text-[10px] text-[#3a5570]">{m.date}</div>
              <div className="col-span-1 flex justify-end">
                <button className="w-7 h-7 flex items-center justify-center text-[#00f5ff] hover:bg-[rgba(0,245,255,0.1)] transition-colors">
                  <Icon name="Download" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

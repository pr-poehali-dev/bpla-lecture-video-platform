import { useState } from "react";
import Icon from "@/components/ui/icon";

const categories = ["Все", "Тактика", "Технические", "Боевое применение", "Разведка", "FPV"];

const lectures = [
  { id: 1, title: "Основы тактического применения FPV дронов", category: "FPV", duration: "2ч 15мин", level: "Базовый", views: 1240, new: true },
  { id: 2, title: "Навигация и ориентирование в условиях РЭБ", category: "Тактика", duration: "1ч 45мин", level: "Продвинутый", views: 890, new: false },
  { id: 3, title: "Технические характеристики ударных дронов", category: "Технические", duration: "3ч 10мин", level: "Базовый", views: 2100, new: false },
  { id: 4, title: "Разведывательные операции с БпЛА", category: "Разведка", duration: "2ч 30мин", level: "Средний", views: 760, new: true },
  { id: 5, title: "Противодронная защита и контрмеры", category: "Тактика", duration: "1ч 55мин", level: "Продвинутый", views: 1450, new: false },
  { id: 6, title: "Поражение бронетехники с БпЛА", category: "Боевое применение", duration: "2ч 40мин", level: "Продвинутый", views: 980, new: false },
  { id: 7, title: "Программирование полётных контроллеров", category: "Технические", duration: "4ч 00мин", level: "Продвинутый", views: 540, new: true },
  { id: 8, title: "Групповые атаки роем дронов", category: "Боевое применение", duration: "2ч 20мин", level: "Средний", views: 1720, new: false },
  { id: 9, title: "Ночные операции с тепловизорами", category: "Разведка", duration: "1ч 35мин", level: "Средний", views: 830, new: false },
];

const levelColor: Record<string, string> = {
  "Базовый": "#00ff88",
  "Средний": "#00f5ff",
  "Продвинутый": "#ff6b00",
};

export default function LecturesPage() {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");

  const filtered = lectures.filter((l) => {
    const matchCat = activeCategory === "Все" || l.category === activeCategory;
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// УЧЕБНЫЙ ЦЕНТР</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-8 tracking-wider">ЛЕКЦИИ</h1>

      {/* Search + filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input
            type="text"
            placeholder="ПОИСК ЛЕКЦИЙ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a1020] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-mono text-sm pl-9 pr-4 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060] tracking-widest"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`font-mono text-xs px-4 py-2 tracking-wider transition-all duration-200 ${
              activeCategory === cat
                ? "text-[#050810] font-bold"
                : "text-[#5a7a95] border border-[rgba(0,245,255,0.15)] hover:border-[rgba(0,245,255,0.4)] hover:text-[#00f5ff]"
            }`}
            style={activeCategory === cat ? { background: "#00f5ff", boxShadow: "0 0 15px rgba(0,245,255,0.4)" } : {}}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="font-mono text-xs text-[#3a5570] mb-6">НАЙДЕНО: {filtered.length} ЛЕКЦИЙ</div>

      {/* Lectures list */}
      <div className="space-y-3">
        {filtered.map((lecture, i) => (
          <div
            key={lecture.id}
            className="card-drone flex items-center gap-4 p-4 cursor-pointer animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Number */}
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 font-orbitron text-xs font-bold text-[#3a5570]" style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
              {String(lecture.id).padStart(2, "0")}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {lecture.new && <span className="tag-badge-green text-[10px]">NEW</span>}
                <span className="tag-badge text-[10px]">{lecture.category}</span>
              </div>
              <h3 className="font-plex text-sm text-white truncate group-hover:text-[#00f5ff]">{lecture.title}</h3>
            </div>

            {/* Meta */}
            <div className="hidden md:flex items-center gap-6 flex-shrink-0">
              <div className="text-right">
                <div className="font-mono text-xs" style={{ color: levelColor[lecture.level] || "#00f5ff" }}>{lecture.level.toUpperCase()}</div>
              </div>
              <div className="flex items-center gap-1.5 text-[#3a5570]">
                <Icon name="Clock" size={12} />
                <span className="font-mono text-xs">{lecture.duration}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#3a5570]">
                <Icon name="Eye" size={12} />
                <span className="font-mono text-xs">{lecture.views.toLocaleString()}</span>
              </div>
            </div>

            {/* Action */}
            <button className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#00f5ff] hover:bg-[rgba(0,245,255,0.1)] transition-colors">
              <Icon name="PlayCircle" size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import Icon from "@/components/ui/icon";

const categories = ["Все", "Боевые", "Учебные", "Технические", "Разбор миссий"];

const videos = [
  { id: 1, title: "FPV атака на бронеколонну — тактический разбор", category: "Боевые", duration: "18:42", views: 5400, thumb: "🎯" },
  { id: 2, title: "Сборка FPV дрона с нуля — полный курс", category: "Технические", duration: "1:24:15", views: 3200, thumb: "🔧" },
  { id: 3, title: "Разбор провальной миссии: ошибки оператора", category: "Разбор миссий", duration: "32:10", views: 7800, thumb: "📋" },
  { id: 4, title: "Ночная разведка — методы и оборудование", category: "Учебные", duration: "44:55", views: 2900, thumb: "🌙" },
  { id: 5, title: "Групповой вылет: координация 4 операторов", category: "Боевые", duration: "25:30", views: 6100, thumb: "🚁" },
  { id: 6, title: "Настройка Betaflight для боевых задач", category: "Технические", duration: "55:20", views: 1800, thumb: "⚙️" },
];

export default function VideosPage() {
  const [activeCategory, setActiveCategory] = useState("Все");

  const filtered = videos.filter((v) => activeCategory === "Все" || v.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// МЕДИАТЕКА</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-8 tracking-wider">ВИДЕОМАТЕРИАЛЫ</h1>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`font-mono text-xs px-4 py-2 tracking-wider transition-all duration-200 ${
              activeCategory === cat ? "text-[#050810] font-bold" : "text-[#5a7a95] border border-[rgba(0,245,255,0.15)] hover:text-[#00f5ff] hover:border-[rgba(0,245,255,0.4)]"
            }`}
            style={activeCategory === cat ? { background: "#00f5ff", boxShadow: "0 0 15px rgba(0,245,255,0.4)" } : {}}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((video, i) => (
          <div
            key={video.id}
            className="card-drone cursor-pointer group animate-fade-in"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {/* Thumbnail */}
            <div className="relative h-44 flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1525, #050d1a)" }}>
              <div className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity">{video.thumb}</div>
              {/* Grid overlay */}
              <div className="absolute inset-0 grid-bg opacity-30" />
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-14 h-14 flex items-center justify-center rounded-full border border-[rgba(0,245,255,0.4)] bg-[rgba(0,245,255,0.05)] group-hover:bg-[rgba(0,245,255,0.15)] transition-all duration-300"
                  style={{ boxShadow: "0 0 20px rgba(0,245,255,0.15)" }}
                >
                  <Icon name="Play" size={22} className="text-[#00f5ff] ml-1" />
                </div>
              </div>
              {/* Duration */}
              <div className="absolute bottom-3 right-3 font-mono text-xs text-white bg-[rgba(0,0,0,0.7)] px-2 py-0.5">
                {video.duration}
              </div>
              {/* Category tag */}
              <div className="absolute top-3 left-3">
                <span className="tag-badge text-[10px]">{video.category}</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-plex text-sm text-white leading-snug mb-3 group-hover:text-[#00f5ff] transition-colors">{video.title}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#3a5570]">
                  <Icon name="Eye" size={12} />
                  <span className="font-mono text-xs">{video.views.toLocaleString()}</span>
                </div>
                <button className="flex items-center gap-1.5 font-mono text-xs text-[#00f5ff] hover:text-white transition-colors">
                  <Icon name="Download" size={12} />
                  СКАЧАТЬ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

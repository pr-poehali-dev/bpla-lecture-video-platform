import Icon from "@/components/ui/icon";

const sections = [
  {
    title: "Прошивки и ПО",
    icon: "Cpu",
    color: "#00f5ff",
    items: [
      { name: "Betaflight 4.5.1 — стабильный релиз", size: "12.4 МБ", version: "v4.5.1", date: "10 мар 2026" },
      { name: "ArduPilot 4.6.0 — боевая конфигурация", size: "28.1 МБ", version: "v4.6.0", date: "05 мар 2026" },
      { name: "ExpressLRS 3.5.2 — прошивка TX/RX", size: "3.7 МБ", version: "v3.5.2", date: "01 мар 2026" },
      { name: "OpenTX 2.3.15 — апдейт аппаратуры", size: "8.9 МБ", version: "v2.3.15", date: "20 фев 2026" },
    ],
  },
  {
    title: "Конфигурационные файлы",
    icon: "Settings",
    color: "#00ff88",
    items: [
      { name: "Betaflight пресет — боевой FPV", size: "0.02 МБ", version: "BF-WAR", date: "12 мар 2026" },
      { name: "Конфигурация PID для ударных задач", size: "0.01 МБ", version: "PID-1.0", date: "08 мар 2026" },
      { name: "OSD профиль — боевой режим", size: "0.03 МБ", version: "OSD-WAR", date: "02 мар 2026" },
    ],
  },
  {
    title: "Документация",
    icon: "BookOpen",
    color: "#ff6b00",
    items: [
      { name: "Полный справочник FPV пилота", size: "14.5 МБ", version: "2026", date: "15 мар 2026" },
      { name: "Руководство по ремонту в полевых условиях", size: "6.2 МБ", version: "v2.1", date: "10 мар 2026" },
      { name: "Нормативная база применения БпЛА", size: "2.8 МБ", version: "2026", date: "01 мар 2026" },
    ],
  },
];

export default function DownloadsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ХРАНИЛИЩЕ ФАЙЛОВ</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-2 tracking-wider">ЗАГРУЗКИ</h1>
      <p className="font-plex text-sm text-[#5a7a95] mb-10">Прошивки, конфиги, документация — всё для работы</p>

      {/* Upload button */}
      <div className="mb-10 p-5 flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: "rgba(0,245,255,0.03)", border: "1px dashed rgba(0,245,255,0.2)" }}>
        <div>
          <div className="font-orbitron text-sm text-white mb-1">ЗАГРУЗИТЬ ФАЙЛ</div>
          <div className="font-plex text-xs text-[#5a7a95]">Поделитесь материалом с сообществом — прошивки, конфиги, документы</div>
        </div>
        <button className="btn-neon flex items-center gap-2 flex-shrink-0">
          <Icon name="Upload" size={14} />
          Загрузить
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 flex items-center justify-center" style={{ border: `1px solid ${section.color}40`, background: `${section.color}08` }}>
                <Icon name={section.icon} size={14} style={{ color: section.color }} />
              </div>
              <h2 className="font-orbitron text-sm font-bold tracking-wider" style={{ color: section.color }}>{section.title.toUpperCase()}</h2>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${section.color}30, transparent)` }} />
            </div>

            {/* Files */}
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <div
                  key={item.name}
                  className="card-drone flex items-center gap-4 p-4 animate-fade-in"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${section.color}10`, border: `1px solid ${section.color}25` }}>
                    <Icon name="File" size={16} style={{ color: section.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-plex text-sm text-white">{item.name}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-[10px] text-[#3a5570]">{item.size}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: `${section.color}10`, color: section.color, border: `1px solid ${section.color}25` }}>{item.version}</span>
                      <span className="font-mono text-[10px] text-[#2a4060]">{item.date}</span>
                    </div>
                  </div>

                  <button
                    className="flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-wider transition-all duration-200 flex-shrink-0"
                    style={{ border: `1px solid ${section.color}40`, color: section.color, background: `${section.color}05` }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${section.color}15`; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${section.color}05`; }}
                  >
                    <Icon name="Download" size={12} />
                    СКАЧАТЬ
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import Icon from "@/components/ui/icon";
import { usePageData } from "@/hooks/usePageData";

const droneTypes = [
  {
    id: 1,
    code: "TYPE-01",
    name: "FPV Камикадзе",
    category: "Ударный",
    range: "5-10 км",
    payload: "0.3-1.5 кг",
    speed: "120-200 км/ч",
    endurance: "8-20 мин",
    emoji: "💥",
    color: "#ff2244",
    description: "Высокоскоростные одноразовые дроны для точечных ударов. Оснащаются боевой частью с осколочным или кумулятивным действием. Эффективны против живой силы, техники, укреплений.",
    tags: ["Ударный", "Одноразовый", "FPV", "Высокая скорость"],
  },
  {
    id: 2,
    code: "TYPE-02",
    name: "Квадрокоптер разведчик",
    category: "Разведка",
    range: "3-15 км",
    payload: "до 0.5 кг",
    speed: "60-100 км/ч",
    endurance: "25-40 мин",
    emoji: "🔍",
    color: "#00f5ff",
    description: "Многороторные платформы для воздушной разведки, корректировки огня и наблюдения. Оснащаются оптическими и тепловизионными камерами.",
    tags: ["Разведка", "Корректировка", "Многоразовый", "Сенсоры"],
  },
  {
    id: 3,
    code: "TYPE-03",
    name: "Гексакоптер носитель",
    category: "Транспортный",
    range: "2-8 км",
    payload: "3-10 кг",
    speed: "40-80 км/ч",
    endurance: "15-30 мин",
    emoji: "📦",
    color: "#00ff88",
    description: "Тяжёлые мультироторные платформы для доставки боеприпасов, снаряжения, сброса взрывных устройств на позиции противника.",
    tags: ["Транспорт", "Сброс", "Тяжёлый", "Многороторный"],
  },
  {
    id: 4,
    code: "TYPE-04",
    name: "БпЛА самолётного типа",
    category: "Разведка / Ударный",
    range: "50-300 км",
    payload: "1-5 кг",
    speed: "100-180 км/ч",
    endurance: "2-8 ч",
    emoji: "✈️",
    color: "#ff6b00",
    description: "Самолётные БПЛА с большой дальностью и продолжительностью полёта. Применяются для глубокой разведки и стратегических ударов по тыловым объектам.",
    tags: ["Дальний", "Самолётный", "Стратегический", "Долгий полёт"],
  },
  {
    id: 5,
    code: "TYPE-05",
    name: "Мини FPV разведчик",
    category: "Тактический",
    range: "1-3 км",
    payload: "—",
    speed: "80-150 км/ч",
    endurance: "5-12 мин",
    emoji: "👁️",
    color: "#a855f7",
    description: "Сверхмалые FPV дроны для разведки в городских условиях, в зданиях, траншеях. Малозаметны, легко переносятся одним бойцом.",
    tags: ["Малый", "Городской бой", "Разведка", "Мобильный"],
  },
  {
    id: 6,
    code: "TYPE-06",
    name: "Дрон-ретранслятор",
    category: "Связь",
    range: "10-40 км",
    payload: "до 2 кг",
    speed: "40-70 км/ч",
    endurance: "30-90 мин",
    emoji: "📡",
    color: "#f59e0b",
    description: "Специальные платформы для организации связи, ретрансляции сигналов управления, создания защищённых каналов передачи данных на поле боя.",
    tags: ["Связь", "Ретранслятор", "Командный", "Радиосвязь"],
  },
];

export default function DroneTypesPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const { header, getBlock } = usePageData("drone-types");
  const dbDrones = getBlock("drone-list")?.data as typeof droneTypes | undefined;
  const drones = dbDrones ?? droneTypes;

  const selectedDrone = drones.find((d) => d.id === selected);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">{header?.subtitle ?? "// КЛАССИФИКАЦИЯ"}</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-2 tracking-wider">{header?.title ?? "ТИПЫ БпЛА"}</h1>
      <p className="font-plex text-sm text-[#5a7a95] mb-6 sm:mb-10">Выберите тип для подробной информации</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: list */}
        <div className={`lg:col-span-1 space-y-2 ${selectedDrone ? "hidden lg:block" : "block"}`}>
          {drones.map((drone) => (
            <button
              key={drone.id}
              onClick={() => setSelected(drone.id === selected ? null : drone.id)}
              className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left transition-all duration-200 ${
                selected === drone.id ? "border" : "card-drone"
              }`}
              style={
                selected === drone.id
                  ? { background: `${drone.color}15`, border: `1px solid ${drone.color}50`, boxShadow: `0 0 20px ${drone.color}20` }
                  : {}
              }
            >
              <div className="text-2xl">{drone.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs mb-0.5" style={{ color: drone.color }}>{drone.code}</div>
                <div className="font-plex text-sm font-medium text-white truncate">{drone.name}</div>
                <div className="font-mono text-xs text-[#3a5570]">{drone.category}</div>
              </div>
              <Icon name={selected === drone.id ? "ChevronDown" : "ChevronRight"} size={14} className="text-[#3a5570] flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Right: detail */}
        <div className={`lg:col-span-2 ${selectedDrone ? "block" : "hidden lg:block"}`}>
          {selectedDrone ? (
            <div className="card-drone p-5 sm:p-8 h-full animate-fade-in" style={{ border: `1px solid ${selectedDrone.color}30` }}>
              <button
                className="flex lg:hidden items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] mb-4 transition-colors"
                onClick={() => setSelected(null)}
              >
                <Icon name="ChevronLeft" size={14} />
                Все типы
              </button>
              <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div className="text-3xl sm:text-5xl">{selectedDrone.emoji}</div>
                <div>
                  <div className="font-mono text-sm mb-1" style={{ color: selectedDrone.color }}>{selectedDrone.code}</div>
                  <h2 className="font-orbitron text-xl sm:text-2xl font-black text-white mb-1">{selectedDrone.name}</h2>
                  <div className="font-plex text-sm text-[#5a7a95]">{selectedDrone.category}</div>
                </div>
              </div>

              <p className="font-plex text-sm text-[#8ab0cc] leading-relaxed mb-8">{selectedDrone.description}</p>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "ДАЛЬНОСТЬ", value: selectedDrone.range, icon: "Navigation" },
                  { label: "НАГРУЗКА", value: selectedDrone.payload, icon: "Package" },
                  { label: "СКОРОСТЬ", value: selectedDrone.speed, icon: "Zap" },
                  { label: "ВРЕМЯ В ВОЗДУХЕ", value: selectedDrone.endurance, icon: "Clock" },
                ].map((spec) => (
                  <div key={spec.label} className="p-3" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={spec.icon} size={11} className="text-[#3a5570]" />
                      <span className="font-mono text-[10px] text-[#3a5570] tracking-wider">{spec.label}</span>
                    </div>
                    <div className="font-orbitron text-sm font-bold" style={{ color: selectedDrone.color }}>{spec.value}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedDrone.tags.map((tag) => (
                  <span key={tag} className="font-mono text-xs px-3 py-1" style={{ border: `1px solid ${selectedDrone.color}30`, color: selectedDrone.color, background: `${selectedDrone.color}08` }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-drone h-64 flex flex-col items-center justify-center text-center p-8">
              <Icon name="Crosshair" size={40} className="text-[#1a3050] mb-4" />
              <div className="font-orbitron text-sm text-[#2a4060] tracking-wider">ВЫБЕРИТЕ ТИП БпЛА</div>
              <div className="font-mono text-xs text-[#1a2840] mt-2">для просмотра характеристик</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
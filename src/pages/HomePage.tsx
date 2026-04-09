import { type Page } from "@/App";
import Icon from "@/components/ui/icon";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/8f80af7c-9a3d-4495-af57-c7231397ef98.jpg";

const stats = [
  { value: "120+", label: "Лекций", icon: "BookOpen" },
  { value: "85+", label: "Видеоматериалов", icon: "Play" },
  { value: "12", label: "Типов БпЛА", icon: "Plane" },
  { value: "3.4K", label: "Участников", icon: "Users" },
];

const features = [
  { icon: "BookOpen", title: "Лекции", desc: "Структурированные учебные материалы по тактике и применению БпЛА", page: "lectures" as Page },
  { icon: "Play", title: "Видео", desc: "Практические видеоразборы, полётные миссии, технические обзоры", page: "videos" as Page },
  { icon: "Plane", title: "Типы БпЛА", desc: "Каталог беспилотников: FPV, мультироторы, самолётного типа", page: "drone-types" as Page },
  { icon: "Download", title: "Загрузки и прошивки", desc: "Руководства, схемы, прошивки FPV-КТ и обновления для скачивания", page: "firmware" as Page },
  { icon: "FileText", title: "Материалы", desc: "Тактические карты, регламенты, технические спецификации", page: "materials" as Page },
  { icon: "MessageSquare", title: "Обсуждения", desc: "Форум для обмена опытом и разбора боевых ситуаций", page: "discussions" as Page },
];

interface Props {
  onNavigate: (page: Page) => void;
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Drone" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #050810 0%, rgba(5,8,16,0.6) 50%, #050810 100%)" }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-50" />

        {/* Neon line decorations */}
        <div className="absolute top-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, #00f5ff40, transparent)" }} />
        <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: "linear-gradient(180deg, transparent, #00f5ff30, transparent)" }} />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          {/* System label */}
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#00f5ff]" style={{ boxShadow: "0 0 6px #00f5ff" }} />
              <div className="w-2 h-2 bg-[#00ff88]" style={{ boxShadow: "0 0 6px #00ff88" }} />
            </div>
            <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em] uppercase">SYS.INIT — БПС v2.6</span>
          </div>

          {/* Main title */}
          <h1 className="font-orbitron text-5xl md:text-7xl font-black leading-none mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="block text-white">БЕСПИЛОТНЫЕ</span>
            <span className="block" style={{ color: "#00f5ff", textShadow: "0 0 40px rgba(0,245,255,0.5)" }}>ПИЛОТИРУЕМЫЕ</span>
            <span className="block text-white">СИСТЕМЫ</span>
          </h1>

          <p className="font-plex text-lg text-[#7a9bb5] max-w-xl mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Профессиональная образовательная платформа для изучения тактики, управления и боевого применения беспилотных пилотируемых систем.
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <button className="btn-neon-filled" onClick={() => onNavigate("lectures")}>
              Начать обучение
            </button>
            <button className="btn-neon" onClick={() => onNavigate("videos")}>
              Смотреть видео
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {stats.map((s) => (
              <div key={s.label} className="corner-brackets p-4" style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.1)" }}>
                <div className="font-orbitron text-3xl font-black" style={{ color: "#00f5ff" }}>{s.value}</div>
                <div className="font-plex text-xs text-[#5a7a95] mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Corner decoration */}
        <div className="absolute bottom-8 right-8 hidden md:flex flex-col items-end gap-1 opacity-30">
          <div className="font-mono text-xs text-[#00f5ff] tracking-widest">COORD: 55.7522° N</div>
          <div className="font-mono text-xs text-[#00f5ff] tracking-widest">37.6156° E</div>
          <div className="font-mono text-xs text-[#00ff88] tracking-widest animate-pulse">◉ ONLINE</div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-8 h-px bg-[#00f5ff]" />
          <h2 className="section-title text-xl text-white">Разделы платформы</h2>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.3), transparent)" }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <button
              key={f.title}
              onClick={() => onNavigate(f.page)}
              className="card-drone p-6 text-left group animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.05)" }}>
                  <Icon name={f.icon} size={18} className="text-[#00f5ff]" />
                </div>
                <div>
                  <h3 className="font-orbitron text-sm font-bold text-white mb-2 tracking-wider group-hover:text-[#00f5ff] transition-colors">{f.title}</h3>
                  <p className="font-plex text-xs text-[#5a7a95] leading-relaxed">{f.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[#00f5ff] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-mono text-xs">ОТКРЫТЬ</span>
                <Icon name="ArrowRight" size={12} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.03), rgba(0,255,136,0.02))" }}>
        <div className="absolute inset-0" style={{ border: "1px solid rgba(0,245,255,0.08)" }} />
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="font-mono text-xs text-[#00f5ff] tracking-[0.4em] mb-4">// ПРИСОЕДИНЯЙСЯ К ПЛАТФОРМЕ</div>
          <h2 className="font-orbitron text-3xl font-black text-white mb-4">ГОТОВ К ОБУЧЕНИЮ?</h2>
          <p className="font-plex text-[#5a7a95] mb-8">Изучай материалы, смотри видео, задавай вопросы в обсуждениях</p>
          <button className="btn-neon-filled" onClick={() => onNavigate("discussions")}>
            Войти в сообщество
          </button>
        </div>
      </section>
    </div>
  );
}
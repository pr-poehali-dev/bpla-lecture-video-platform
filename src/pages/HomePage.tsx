import { useState, useEffect } from "react";
import { type Page } from "@/App";
import Icon from "@/components/ui/icon";
import { api } from "@/api";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/7d43b631-9cb0-457c-a9f1-31fabf7fd8fc/files/8f80af7c-9a3d-4495-af57-c7231397ef98.jpg";

const DEFAULT_STATS = [
  { value: "120+", label: "Лекций", icon: "BookOpen" },
  { value: "85+", label: "Видеоматериалов", icon: "Play" },
  { value: "12", label: "Типов БпЛА", icon: "Plane" },
  { value: "3.4K", label: "Участников", icon: "Users" },
];

const DEFAULT_FEATURES = [
  { icon: "BookOpen", title: "Лекции", desc: "Структурированные учебные материалы по тактике и применению БпЛА", page: "lectures" },
  { icon: "Play", title: "Видео", desc: "Практические видеоразборы, полётные миссии, технические обзоры", page: "videos" },
  { icon: "Plane", title: "Типы БпЛА", desc: "Каталог беспилотников: FPV, мультироторы, самолётного типа", page: "drone-types" },
  { icon: "Download", title: "Загрузки и прошивки", desc: "Руководства, схемы, прошивки FPV-КТ и обновления для скачивания", page: "firmware" },
  { icon: "FileText", title: "Материалы", desc: "Тактические карты, регламенты, технические спецификации", page: "materials" },
  { icon: "HeartPulse", title: "Так Мед", desc: "Тактическая медицина: протоколы первой помощи, эвакуация, аптечка", page: "tacmed" },
  { icon: "MessageSquare", title: "Обсуждения", desc: "Форум для обмена опытом и разбора боевых ситуаций", page: "discussions" },
];

interface HeroData { sysLabel: string; title1: string; title2: string; title3: string; subtitle: string; btn1Label: string; btn1Page: string; btn2Label: string; btn2Page: string; }
interface StatItem { value: string; label: string; icon: string; }
interface FeatureItem { icon: string; title: string; desc: string; page: string; }
interface CtaData { label: string; title: string; subtitle: string; btnLabel: string; btnPage: string; }
interface TextData { title: string; content: string; }
interface Block { id: number; type: string; sort_order: number; data: unknown; }

interface Props { onNavigate: (page: Page) => void; }

export default function HomePage({ onNavigate }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    api.admin.getPage("home").then(res => {
      if (res.blocks) setBlocks(res.blocks);
    }).catch(() => {});
  }, []);

  const getBlock = (type: string) => blocks.find(b => b.type === type);

  const hero = (getBlock("hero")?.data ?? null) as HeroData | null;
  const stats = (getBlock("stats")?.data ?? null) as StatItem[] | null;
  const features = (getBlock("features")?.data ?? null) as FeatureItem[] | null;
  const cta = (getBlock("cta")?.data ?? null) as CtaData | null;
  const introVideo = (getBlock("intro-video")?.data ?? null) as { url?: string; caption?: string } | null;
  const textBlocks = blocks.filter(b => b.type === "text");

  const h = hero ?? { sysLabel: "SYS.INIT — БпС v2.6", title1: "БЕСПИЛОТНЫЕ", title2: "СИСТЕМЫ", title3: "", subtitle: "Профессиональная образовательная платформа для изучения тактики, управления и боевого применения беспилотных систем.", btn1Label: "Начать обучение", btn1Page: "lectures", btn2Label: "Смотреть видео", btn2Page: "videos" };
  const s = stats ?? DEFAULT_STATS;
  const f = features ?? DEFAULT_FEATURES;
  const c = cta ?? { label: "// ПРИСОЕДИНЯЙСЯ К ПЛАТФОРМЕ", title: "ГОТОВ К ОБУЧЕНИЮ?", subtitle: "Изучай материалы, смотри видео, задавай вопросы в обсуждениях", btnLabel: "Войти в сообщество", btnPage: "discussions" };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Drone" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #050810 0%, rgba(5,8,16,0.6) 50%, #050810 100%)" }} />
        </div>
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, #00f5ff40, transparent)" }} />
        <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: "linear-gradient(180deg, transparent, #00f5ff30, transparent)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-in">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#00f5ff]" style={{ boxShadow: "0 0 6px #00f5ff" }} />
              <div className="w-2 h-2 bg-[#00ff88]" style={{ boxShadow: "0 0 6px #00ff88" }} />
            </div>
            <span className="font-mono text-[10px] sm:text-xs text-[#00f5ff] tracking-[0.2em] sm:tracking-[0.3em] uppercase">{h.sysLabel}</span>
          </div>

          <h1 className="font-orbitron text-4xl sm:text-5xl md:text-7xl font-black leading-none mb-5 sm:mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {h.title1 && <span className="block text-white">{h.title1}</span>}
            {h.title2 && <span className="block" style={{ color: "#00f5ff", textShadow: "0 0 40px rgba(0,245,255,0.5)" }}>{h.title2}</span>}
            {h.title3 && <span className="block text-white">{h.title3}</span>}
          </h1>

          <p className="font-plex text-base sm:text-lg text-[#7a9bb5] max-w-xl mb-8 sm:mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {h.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <button className="btn-neon-filled w-full sm:w-auto" onClick={() => onNavigate(h.btn1Page as Page)}>{h.btn1Label}</button>
            <button className="btn-neon w-full sm:w-auto" onClick={() => onNavigate(h.btn2Page as Page)}>{h.btn2Label}</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-20 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {s.map((stat) => (
              <div key={stat.label} className="corner-brackets p-3 sm:p-4" style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.1)" }}>
                <div className="font-orbitron text-2xl sm:text-3xl font-black" style={{ color: "#00f5ff" }}>{stat.value}</div>
                <div className="font-plex text-[10px] sm:text-xs text-[#5a7a95] mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden md:flex flex-col items-end gap-1 opacity-30">
          <div className="font-mono text-xs text-[#00f5ff] tracking-widest">COORD: 55.7522° N</div>
          <div className="font-mono text-xs text-[#00f5ff] tracking-widest">37.6156° E</div>
          <div className="font-mono text-xs text-[#00ff88] tracking-widest animate-pulse">◉ ONLINE</div>
        </div>
      </section>

      {/* Intro Video */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <div className="w-8 h-px bg-[#00f5ff] flex-shrink-0" />
          <h2 className="section-title text-lg sm:text-xl text-white whitespace-nowrap">О платформе</h2>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.3), transparent)" }} />
        </div>
        <div
          className="relative w-full rounded-sm overflow-hidden"
          style={{ border: "1px solid rgba(0,245,255,0.2)", background: "#070d18", aspectRatio: "16/9" }}
        >
          {introVideo?.url ? (
            <iframe
              src={introVideo.url}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: "none" }}
            />
          ) : (
            <>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div
                  className="w-20 h-20 flex items-center justify-center rounded-full"
                  style={{ border: "2px solid rgba(0,245,255,0.4)", background: "rgba(0,245,255,0.06)", boxShadow: "0 0 40px rgba(0,245,255,0.15)" }}
                >
                  <Icon name="Play" size={32} className="text-[#00f5ff] ml-1" />
                </div>
                <div className="text-center">
                  <div className="font-orbitron text-sm font-bold text-white tracking-wider mb-2">ИНТРО-ВИДЕО</div>
                  <div className="font-mono text-xs text-[#3a5570] tracking-widest">// СКОРО</div>
                </div>
              </div>
              <div className="absolute top-3 left-3 w-5 h-5 border-t border-l" style={{ borderColor: "rgba(0,245,255,0.4)" }} />
              <div className="absolute top-3 right-3 w-5 h-5 border-t border-r" style={{ borderColor: "rgba(0,245,255,0.4)" }} />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l" style={{ borderColor: "rgba(0,245,255,0.4)" }} />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r" style={{ borderColor: "rgba(0,245,255,0.4)" }} />
              <div className="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] text-[#1a3a50] tracking-widest">REC ◉</div>
            </>
          )}
        </div>
        {introVideo?.caption && (
          <p className="font-plex text-xs text-[#5a7a95] mt-3 text-center">{introVideo.caption}</p>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="flex items-center gap-4 mb-8 sm:mb-12">
          <div className="w-8 h-px bg-[#00f5ff] flex-shrink-0" />
          <h2 className="section-title text-lg sm:text-xl text-white whitespace-nowrap">Разделы платформы</h2>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.3), transparent)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {f.map((feat, i) => (
            <button key={feat.title + i} onClick={() => onNavigate(feat.page as Page)}
              className="card-drone p-4 sm:p-6 text-left group animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.05)" }}>
                  <Icon name={feat.icon} size={16} className="text-[#00f5ff]" fallback="Star" />
                </div>
                <div>
                  <h3 className="font-orbitron text-sm font-bold text-white mb-1 sm:mb-2 tracking-wider group-hover:text-[#00f5ff] transition-colors">{feat.title}</h3>
                  <p className="font-plex text-xs text-[#5a7a95] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center gap-2 text-[#00f5ff] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-mono text-xs">ОТКРЫТЬ</span>
                <Icon name="ArrowRight" size={12} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Custom text blocks */}
      {textBlocks.map(block => {
        const tb = block.data as TextData;
        return (
          <section key={block.id} className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            {tb.title && (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-px bg-[#00f5ff] flex-shrink-0" />
                <h2 className="section-title text-lg sm:text-xl text-white">{tb.title}</h2>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.3), transparent)" }} />
              </div>
            )}
            {tb.content && <p className="font-plex text-base text-[#7a9bb5] leading-relaxed max-w-3xl">{tb.content}</p>}
          </section>
        );
      })}

      {/* CTA */}
      <section className="py-12 sm:py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.03), rgba(0,255,136,0.02))" }}>
        <div className="absolute inset-0" style={{ border: "1px solid rgba(0,245,255,0.08)" }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="font-mono text-[10px] sm:text-xs text-[#00f5ff] tracking-[0.3em] sm:tracking-[0.4em] mb-4">{c.label}</div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-3 sm:mb-4">{c.title}</h2>
          <p className="font-plex text-sm sm:text-base text-[#5a7a95] mb-6 sm:mb-8">{c.subtitle}</p>
          <button className="btn-neon-filled w-full sm:w-auto" onClick={() => onNavigate(c.btnPage as Page)}>{c.btnLabel}</button>
        </div>
      </section>
    </div>
  );
}
import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

export default function Intro({ onDone }: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1600);
    const t4 = setTimeout(() => setPhase(4), 2400);
    const t5 = setTimeout(() => onDone(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center grid-bg overflow-hidden"
      style={{
        background: "#050810",
        opacity: phase === 4 ? 0 : 1,
        transition: phase === 4 ? "opacity 0.9s ease" : "none",
      }}
    >
      {/* Scanning lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-px"
            style={{
              top: `${15 + i * 14}%`,
              background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.06), transparent)",
              transform: `translateX(${phase >= 1 ? "0%" : "-100%"})`,
              transition: `transform 1.2s ease ${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Corner decorations */}
      {[
        { top: "5%", left: "5%" },
        { top: "5%", right: "5%" },
        { bottom: "5%", left: "5%" },
        { bottom: "5%", right: "5%" },
      ].map((style, i) => (
        <div
          key={i}
          className="absolute w-10 h-10"
          style={{
            ...style,
            opacity: phase >= 1 ? 1 : 0,
            transition: `opacity 0.5s ease ${i * 0.1}s`,
            borderTop: i < 2 ? "1px solid rgba(0,245,255,0.4)" : "none",
            borderBottom: i >= 2 ? "1px solid rgba(0,245,255,0.4)" : "none",
            borderLeft: i % 2 === 0 ? "1px solid rgba(0,245,255,0.4)" : "none",
            borderRight: i % 2 === 1 ? "1px solid rgba(0,245,255,0.4)" : "none",
          }}
        />
      ))}

      {/* System text top */}
      <div
        className="absolute top-8 left-0 right-0 flex justify-center"
        style={{ opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.6s ease 0.2s" }}
      >
        <span className="font-mono text-[10px] tracking-[0.4em] text-[#1a3050]">
          SYS.BOOT // v2.6.0 // SECURE CONNECTION ESTABLISHED
        </span>
      </div>

      {/* Main logo block */}
      <div className="flex flex-col items-center gap-6">
        {/* Icon */}
        <div
          className="relative flex items-center justify-center"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1)" : "scale(0.6)",
            transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div
            className="w-20 h-20 flex items-center justify-center"
            style={{
              border: "1px solid rgba(0,245,255,0.5)",
              boxShadow: phase >= 2
                ? "0 0 40px rgba(0,245,255,0.3), 0 0 80px rgba(0,245,255,0.1), inset 0 0 20px rgba(0,245,255,0.05)"
                : "0 0 10px rgba(0,245,255,0.1)",
              transition: "box-shadow 0.8s ease",
            }}
          >
            {/* Crosshair SVG */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="8" stroke="#00f5ff" strokeWidth="1.5"
                strokeDasharray={phase >= 2 ? "50" : "0"}
                style={{ transition: "stroke-dasharray 0.6s ease 0.2s" }}
              />
              <line x1="20" y1="0" x2="20" y2="12" stroke="#00f5ff" strokeWidth="1.5"
                opacity={phase >= 2 ? 1 : 0}
                style={{ transition: "opacity 0.4s ease 0.4s" }}
              />
              <line x1="20" y1="28" x2="20" y2="40" stroke="#00f5ff" strokeWidth="1.5"
                opacity={phase >= 2 ? 1 : 0}
                style={{ transition: "opacity 0.4s ease 0.4s" }}
              />
              <line x1="0" y1="20" x2="12" y2="20" stroke="#00f5ff" strokeWidth="1.5"
                opacity={phase >= 2 ? 1 : 0}
                style={{ transition: "opacity 0.4s ease 0.5s" }}
              />
              <line x1="28" y1="20" x2="40" y2="20" stroke="#00f5ff" strokeWidth="1.5"
                opacity={phase >= 2 ? 1 : 0}
                style={{ transition: "opacity 0.4s ease 0.5s" }}
              />
              <circle cx="20" cy="20" r="2" fill="#00f5ff"
                opacity={phase >= 3 ? 1 : 0}
                style={{ transition: "opacity 0.3s ease" }}
              />
            </svg>
          </div>

          {/* Rotating ring */}
          <div
            className="absolute inset-0 -m-3"
            style={{
              border: "1px solid rgba(0,245,255,0.15)",
              borderRadius: "2px",
              transform: `rotate(${phase >= 2 ? "45deg" : "0deg"})`,
              transition: "transform 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s",
            }}
          />
        </div>

        {/* Title */}
        <div className="text-center overflow-hidden">
          <div
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
            }}
          >
            <div
              className="font-orbitron font-black tracking-[0.3em] leading-none"
              style={{
                fontSize: "clamp(2rem, 8vw, 4.5rem)",
                color: "#00f5ff",
                textShadow: phase >= 3
                  ? "0 0 30px rgba(0,245,255,0.7), 0 0 60px rgba(0,245,255,0.3)"
                  : "none",
                transition: "text-shadow 0.6s ease",
              }}
            >
              DRONE
            </div>
            <div
              className="font-orbitron font-black tracking-[0.3em] leading-none text-white"
              style={{ fontSize: "clamp(2rem, 8vw, 4.5rem)" }}
            >
              ACADEMY
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div className="font-mono text-xs tracking-[0.35em] text-center" style={{ color: "rgba(0,245,255,0.5)" }}>
            ПРОФЕССИОНАЛЬНАЯ ПЛАТФОРМА ОБУЧЕНИЯ БпЛА
          </div>
        </div>

        {/* Loading bar */}
        <div
          className="w-48 h-px mt-4 overflow-hidden"
          style={{
            background: "rgba(0,245,255,0.1)",
            opacity: phase >= 2 ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <div
            className="h-full"
            style={{
              background: "linear-gradient(90deg, transparent, #00f5ff, #00ff88)",
              width: phase >= 3 ? "100%" : phase >= 2 ? "40%" : "0%",
              transition: "width 0.8s ease",
              boxShadow: "0 0 8px #00f5ff",
            }}
          />
        </div>

        {/* Status text */}
        <div
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transition: "opacity 0.4s ease 0.2s",
          }}
        >
          <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#00ff88" }}>
            ◉ SYSTEM READY
          </span>
        </div>
      </div>

      {/* Bottom coordinates */}
      <div
        className="absolute bottom-8 flex gap-8"
        style={{ opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}
      >
        <span className="font-mono text-[10px] text-[#1a3050] tracking-widest">LAT: 55.7522° N</span>
        <span className="font-mono text-[10px] text-[#1a3050] tracking-widest">LON: 37.6156° E</span>
        <span className="font-mono text-[10px] text-[#1a3050] tracking-widest">ALT: 0M</span>
      </div>
    </div>
  );
}

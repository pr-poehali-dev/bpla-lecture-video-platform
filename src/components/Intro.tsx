import { useEffect, useState, useRef, useCallback } from "react";

interface Props {
  onDone: () => void;
}

const BOOT_LINES = [
  "ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ БПС...",
  "ПРОВЕРКА ПРОТОКОЛОВ БЕЗОПАСНОСТИ...",
  "ЗАГРУЗКА УЧЕБНЫХ МОДУЛЕЙ...",
  "УСТАНОВКА ЗАЩИЩЁННОГО СОЕДИНЕНИЯ...",
  "АВТОРИЗАЦИЯ КОМАНДНОГО СОСТАВА...",
  "СИСТЕМА ГОТОВА К РАБОТЕ",
];

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const beep = useCallback((freq: number, duration: number, vol = 0.08, type: OscillatorType = "square") => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) { /* AudioContext недоступен */ }
  }, [getCtx]);

  const tick = useCallback(() => beep(880, 0.04, 0.06, "square"), [beep]);

  const bootLine = useCallback(() => {
    beep(440, 0.03, 0.05, "square");
    setTimeout(() => beep(660, 0.03, 0.04, "square"), 40);
  }, [beep]);

  const glitchSound = useCallback(() => {
    beep(120, 0.08, 0.12, "sawtooth");
    setTimeout(() => beep(80, 0.06, 0.1, "sawtooth"), 60);
    setTimeout(() => beep(2400, 0.04, 0.06, "square"), 100);
  }, [beep]);

  const ready = useCallback(() => {
    beep(523, 0.1, 0.1, "sine");
    setTimeout(() => beep(659, 0.1, 0.1, "sine"), 120);
    setTimeout(() => beep(784, 0.15, 0.12, "sine"), 240);
  }, [beep]);

  const enter = useCallback(() => {
    beep(440, 0.05, 0.08, "square");
    setTimeout(() => beep(880, 0.05, 0.08, "square"), 60);
    setTimeout(() => beep(1320, 0.1, 0.1, "sine"), 120);
  }, [beep]);

  return { tick, bootLine, glitchSound, ready, enter };
}

export default function Intro({ onDone }: Props) {
  const [phase, setPhase] = useState(0);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const linesRef = useRef<HTMLDivElement>(null);
  const audio = useAudio();

  const audioRef = useRef(audio);
  const onDoneRef = useRef(onDone);
  useEffect(() => { audioRef.current = audio; }, [audio]);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const a = audioRef.current;

    const t0 = setTimeout(() => { setPhase(1); a.tick(); }, 200);

    const lineTimers = BOOT_LINES.map((line, i) =>
      setTimeout(() => {
        setBootLines((prev) => [...prev, line]);
        if (linesRef.current) linesRef.current.scrollTop = linesRef.current.scrollHeight;
        if (i === BOOT_LINES.length - 1) a.ready();
        else a.bootLine();
      }, 400 + i * 340)
    );

    let lastTickAt = 0;
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(progressInterval); return 100; }
        const next = p + 2;
        if (Math.floor(next / 25) > Math.floor(lastTickAt / 25)) {
          lastTickAt = next;
          a.tick();
        }
        return next;
      });
    }, 42);

    const tGlitch1 = setTimeout(() => { setGlitch(true); a.glitchSound(); }, 1500);
    const tGlitch2 = setTimeout(() => setGlitch(false), 1650);
    const tGlitch3 = setTimeout(() => setGlitch(true), 1800);
    const tGlitch4 = setTimeout(() => setGlitch(false), 1900);

    const tTitle = setTimeout(() => setTitleVisible(true), 1200);

    const tFinal = setTimeout(() => { setFinalVisible(true); a.tick(); }, 2800);
    const tExit  = setTimeout(() => { a.enter(); setFadeOut(true); }, 4200);
    const tDone  = setTimeout(() => onDoneRef.current(), 4900);

    return () => {
      [t0, ...lineTimers, tGlitch1, tGlitch2, tGlitch3, tGlitch4, tTitle, tFinal, tExit, tDone].forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, []);

  const handleEnter = () => {
    audio.enter();
    setFadeOut(true);
    setTimeout(onDone, 700);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex overflow-hidden select-none"
      style={{
        background: "#020509",
        opacity: fadeOut ? 0 : 1,
        transition: fadeOut ? "opacity 0.7s ease" : "none",
      }}
    >
      {/* Animated grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(2,5,9,0.85) 100%)",
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
          opacity: 0.6,
        }}
      />

      {/* Moving scan beam */}
      <div
        className="absolute left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(0,245,255,0.04), transparent)",
          animation: "scanBeam 4s linear infinite",
        }}
      />

      {/* Corner brackets */}
      {[
        { top: 0, left: 0, borderTop: "2px solid #00f5ff", borderLeft: "2px solid #00f5ff" },
        { top: 0, right: 0, borderTop: "2px solid #00f5ff", borderRight: "2px solid #00f5ff" },
        { bottom: 0, left: 0, borderBottom: "2px solid #00f5ff", borderLeft: "2px solid #00f5ff" },
        { bottom: 0, right: 0, borderBottom: "2px solid #00f5ff", borderRight: "2px solid #00f5ff" },
      ].map((s, i) => (
        <div
          key={i}
          className="absolute w-12 h-12 pointer-events-none"
          style={{
            ...s,
            opacity: phase >= 1 ? 0.6 : 0,
            transition: `opacity 0.4s ease ${i * 0.1}s`,
          }}
        />
      ))}

      {/* Left panel — boot log */}
      <div className="relative z-10 flex flex-col justify-center w-full max-w-2xl mx-auto px-8 lg:px-16 py-16">

        {/* Top label */}
        <div
          className="mb-8 flex items-center gap-3"
          style={{ opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.5em] text-[#1e4060]">
            SECURE BOOT // BPLA LEARNING SYSTEM // v3.0
          </span>
        </div>

        {/* Main title with glitch */}
        <div
          className="mb-10 overflow-hidden"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <div
            className="font-orbitron font-black leading-none mb-2"
            style={{
              fontSize: "clamp(3rem, 12vw, 7rem)",
              color: glitch ? "transparent" : "#00f5ff",
              textShadow: glitch
                ? "3px 0 #ff0040, -3px 0 #00ff88"
                : "0 0 40px rgba(0,245,255,0.5), 0 0 80px rgba(0,245,255,0.2)",
              letterSpacing: "0.15em",
              transition: glitch ? "none" : "text-shadow 0.3s ease",
              WebkitTextStroke: glitch ? "1px #00f5ff" : "0px transparent",
            }}
          >
            БПС
          </div>
          <div
            className="font-orbitron font-bold tracking-[0.12em] text-white"
            style={{
              fontSize: "clamp(0.65rem, 2.5vw, 1.2rem)",
              opacity: 0.85,
              textShadow: "0 0 20px rgba(255,255,255,0.2)",
            }}
          >
            БЕСПИЛОТНЫЕ ПИЛОТИРУЕМЫЕ СИСТЕМЫ
          </div>
        </div>

        {/* Boot log terminal */}
        <div
          className="mb-8"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transition: "opacity 0.4s ease 0.5s",
          }}
        >
          <div
            ref={linesRef}
            className="font-mono text-xs space-y-1.5 overflow-hidden"
            style={{ maxHeight: "160px" }}
          >
            {bootLines.map((line, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{
                  color: i === bootLines.length - 1 ? "#00ff88" : "rgba(0,245,255,0.45)",
                  animation: "fadeInLine 0.3s ease",
                }}
              >
                <span style={{ color: "#1e4060" }}>{">"}</span>
                {line}
                {i === bootLines.length - 1 && (
                  <span
                    className="inline-block w-2 h-3 ml-1"
                    style={{
                      background: "#00f5ff",
                      animation: "blink 0.8s step-end infinite",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div
            className="flex items-center justify-between mb-2"
            style={{ opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.3s ease 0.6s" }}
          >
            <span className="font-mono text-[10px] text-[#1e4060] tracking-widest">ЗАГРУЗКА СИСТЕМЫ</span>
            <span className="font-mono text-[10px] text-[#00f5ff]">{progress}%</span>
          </div>
          <div
            className="w-full h-0.5 overflow-hidden"
            style={{
              background: "rgba(0,245,255,0.08)",
              opacity: phase >= 1 ? 1 : 0,
              transition: "opacity 0.3s ease 0.6s",
            }}
          >
            <div
              className="h-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #00f5ff, #00ff88)",
                boxShadow: "0 0 10px rgba(0,245,255,0.8), 0 0 20px rgba(0,245,255,0.3)",
                transition: "width 0.05s linear",
              }}
            />
          </div>
          {/* Segment ticks */}
          <div className="flex justify-between mt-1">
            {[0, 25, 50, 75, 100].map((tick) => (
              <div
                key={tick}
                className="font-mono text-[8px]"
                style={{ color: progress >= tick ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,0.1)" }}
              >
                {tick}
              </div>
            ))}
          </div>
        </div>

        {/* Enter button */}
        <div
          style={{
            opacity: finalVisible ? 1 : 0,
            transform: finalVisible ? "translateY(0)" : "translateY(15px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <button
            onClick={handleEnter}
            className="group relative flex items-center gap-4 font-mono text-sm tracking-[0.3em] px-8 py-4 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{
              border: "1px solid rgba(0,245,255,0.5)",
              color: "#00f5ff",
              background: "rgba(0,245,255,0.04)",
              boxShadow: "0 0 20px rgba(0,245,255,0.1)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(0,245,255,0.25), inset 0 0 20px rgba(0,245,255,0.05)";
              (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,245,255,0.1)";
              (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.04)";
            }}
          >
            {/* Sweep animation */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.06), transparent)",
                transform: "translateX(-100%)",
                animation: "sweep 2.5s ease infinite",
              }}
            />

            <div className="relative flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-5 h-5 flex items-center justify-center"
                style={{ border: "1px solid rgba(0,245,255,0.4)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              </div>
              ВОЙТИ В СИСТЕМУ
              {/* Arrow */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M3 8H13M9 4l4 4-4 4" stroke="#00f5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          <div className="mt-4 font-mono text-[9px] text-[#1a3050] tracking-[0.3em]">
            НАЖМИТЕ ДЛЯ ПРОДОЛЖЕНИЯ // ДОСТУП ТОЛЬКО ДЛЯ АВТОРИЗОВАННОГО СОСТАВА
          </div>
        </div>
      </div>

      {/* Right side — decorative drone silhouette / grid lines */}
      <div
        className="hidden lg:flex absolute right-0 top-0 bottom-0 w-1/3 items-center justify-center pointer-events-none"
        style={{ opacity: titleVisible ? 1 : 0, transition: "opacity 1s ease 0.5s" }}
      >
        <div className="relative">
          {/* Concentric rings */}
          {[120, 180, 240, 300].map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                border: `1px solid rgba(0,245,255,${0.12 - i * 0.02})`,
                animation: `spin ${12 + i * 6}s linear infinite ${i % 2 === 1 ? "reverse" : ""}`,
              }}
            />
          ))}
          {/* Center crosshair */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0" style={{ border: "1px solid rgba(0,245,255,0.3)" }} />
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="8" stroke="#00f5ff" strokeWidth="1" opacity="0.8" />
              <line x1="20" y1="0" x2="20" y2="10" stroke="#00f5ff" strokeWidth="1" />
              <line x1="20" y1="30" x2="20" y2="40" stroke="#00f5ff" strokeWidth="1" />
              <line x1="0" y1="20" x2="10" y2="20" stroke="#00f5ff" strokeWidth="1" />
              <line x1="30" y1="20" x2="40" y2="20" stroke="#00f5ff" strokeWidth="1" />
              <circle cx="20" cy="20" r="2" fill="#00ff88" />
            </svg>
          </div>
          {/* Corner marks */}
          {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx, dy], i) => (
            <div
              key={i}
              className="absolute w-4 h-4"
              style={{
                top: `calc(50% + ${dy * 130}px - 8px)`,
                left: `calc(50% + ${dx * 130}px - 8px)`,
                borderTop: dy < 0 ? "1px solid rgba(0,245,255,0.3)" : "none",
                borderBottom: dy > 0 ? "1px solid rgba(0,245,255,0.3)" : "none",
                borderLeft: dx < 0 ? "1px solid rgba(0,245,255,0.3)" : "none",
                borderRight: dx > 0 ? "1px solid rgba(0,245,255,0.3)" : "none",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scanBeam {
          0% { top: -128px; }
          100% { top: 100vh; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeInLine {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(200%); }
        }
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
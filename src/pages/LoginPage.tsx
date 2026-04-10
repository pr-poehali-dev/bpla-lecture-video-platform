import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";

interface Props {
  onLogin: (user: object, token: string) => void;
  onRegister: () => void;
}

export default function LoginPage({ onLogin, onRegister }: Props) {
  const [callsign, setCallsign] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    fetch("https://functions.poehali.dev/549cd8d9-b876-4355-9483-609144c1e199/?action=me", {
      signal: AbortSignal.timeout(5000),
    })
      .then((r) => setServerOnline(r.status < 500))
      .catch(() => setServerOnline(false));
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await api.login({ callsign, password });
    setLoading(false);
    if (res.token) {
      localStorage.setItem("drone_token", res.token);
      onLogin(res.user, res.token);
    } else if (res.error === "pending") {
      setError("pending");
    } else if (res.error === "rejected") {
      setError("rejected");
    } else {
      setError(res.error || "Ошибка входа");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg px-4" style={{ background: "#050810" }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 20px rgba(0,245,255,0.4)" }}>
              <Icon name="Crosshair" size={20} className="text-[#00f5ff]" />
            </div>
            <div className="text-left">
              <div className="font-orbitron font-bold text-base tracking-[0.2em] text-[#00f5ff] leading-none">БПС</div>
              <div className="font-orbitron font-bold text-xs tracking-[0.1em] text-white leading-none">БЕСПИЛОТНЫЕ ПИЛОТИРУЕМЫЕ СИСТЕМЫ</div>
            </div>
          </div>

        </div>

        {/* Form */}
        <div className="card-drone p-8" style={{ border: "1px solid rgba(0,245,255,0.2)" }}>
          <div
            className="flex items-center gap-2 mb-6 relative group cursor-default"
            onMouseEnter={() => setHintVisible(true)}
            onMouseLeave={() => setHintVisible(false)}
          >
            <div
              className="w-1 h-5 flex-shrink-0 transition-all duration-500"
              style={{
                background: serverOnline === null ? "#3a5570" : serverOnline ? "#00ff88" : "#ff2244",
                boxShadow: serverOnline === null ? "none" : serverOnline ? "0 0 8px #00ff88" : "0 0 8px #ff2244",
                animation: serverOnline === null ? "pulse 1.5s infinite" : "none",
              }}
            />
            <h2 className="font-orbitron text-sm font-bold tracking-wider text-white">ВХОД В СИСТЕМУ</h2>

            {hintVisible && (
              <div
                className="absolute left-0 top-full mt-2 w-56 p-3 z-50"
                style={{ background: "rgba(5,8,16,0.98)", border: `1px solid ${serverOnline === null ? "#1a2a3a" : serverOnline ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, boxShadow: "0 0 20px rgba(0,0,0,0.5)" }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: serverOnline === null ? "#3a5570" : serverOnline ? "#00ff88" : "#ff2244" }} />
                  <span className="font-mono text-xs font-bold" style={{ color: serverOnline === null ? "#3a5570" : serverOnline ? "#00ff88" : "#ff2244" }}>
                    {serverOnline === null ? "ПРОВЕРКА СВЯЗИ" : serverOnline ? "СИСТЕМА АКТИВНА" : "СЕРВЕР НЕДОСТУПЕН"}
                  </span>
                </div>
                <p className="font-plex text-[10px] text-[#5a7a95] leading-relaxed">
                  {serverOnline === null
                    ? "Устанавливается соединение с сервером..."
                    : serverOnline
                    ? "Сервер работает в штатном режиме. Вход доступен."
                    : "Нет связи с сервером. Вход временно невозможен."}
                </p>
              </div>
            )}
          </div>

          {error === "pending" && (
            <div className="mb-4 p-3 flex items-center gap-2" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.3)" }}>
              <Icon name="Clock" size={14} className="text-[#ff6b00] flex-shrink-0" />
              <span className="font-plex text-xs text-[#ff6b00]">Ваша заявка ожидает одобрения администратора</span>
            </div>
          )}
          {error === "rejected" && (
            <div className="mb-4 p-3 flex items-center gap-2" style={{ background: "rgba(255,34,68,0.08)", border: "1px solid rgba(255,34,68,0.3)" }}>
              <Icon name="ShieldX" size={14} className="text-[#ff2244] flex-shrink-0" />
              <span className="font-plex text-xs text-[#ff2244]">Доступ отклонён администратором</span>
            </div>
          )}
          {error && error !== "pending" && error !== "rejected" && (
            <div className="mb-4 p-3" style={{ background: "rgba(255,34,68,0.08)", border: "1px solid rgba(255,34,68,0.3)" }}>
              <span className="font-plex text-xs text-[#ff2244]">{error}</span>
            </div>
          )}

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ПОЗЫВНОЙ</label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                required
                className="w-full bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060]"
                placeholder="Ваш позывной"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ПАРОЛЬ</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon-filled w-full flex items-center justify-center gap-2 mt-6"
            >
              {loading ? <><Icon name="Loader" size={14} className="animate-spin" />ПРОВЕРКА...</> : <><Icon name="LogIn" size={14} />ВОЙТИ</>}
            </button>
          </form>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid rgba(0,245,255,0.08)" }}>
            <span className="font-plex text-xs text-[#3a5570]">Нет доступа? </span>
            <button onClick={onRegister} className="font-plex text-xs text-[#00f5ff] hover:text-white transition-colors">
              Подать заявку на доступ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
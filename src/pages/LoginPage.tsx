import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";

interface Props {
  onLogin: (user: object, token: string) => void;
  onRegister: () => void;
}

export default function LoginPage({ onLogin, onRegister }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await api.login({ email, password });
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
              <div className="font-orbitron font-bold text-base tracking-[0.2em] text-[#00f5ff] leading-none">DRONE</div>
              <div className="font-orbitron font-bold text-base tracking-[0.2em] text-white leading-none">ACADEMY</div>
            </div>
          </div>
          <div className="font-mono text-xs text-[#3a5570] tracking-[0.3em]">// АВТОРИЗАЦИЯ ДОСТУПА</div>
        </div>

        {/* Form */}
        <div className="card-drone p-8" style={{ border: "1px solid rgba(0,245,255,0.2)" }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-[#00f5ff]" />
            <h2 className="font-orbitron text-sm font-bold tracking-wider text-white">ВХОД В СИСТЕМУ</h2>
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
              <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060]"
                placeholder="operator@example.com"
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
              Подать заявку на регистрацию
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

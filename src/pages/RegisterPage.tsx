import { useState } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { api } from "@/api";

interface Props {
  onBack: () => void;
}

export default function RegisterPage({ onBack }: Props) {
  const [callsign, setCallsign] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await api.register({ callsign, name, email, password });
    setLoading(false);
    if (res.message) {
      setDone(true);
    } else {
      setError(res.error || "Ошибка регистрации");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg px-4" style={{ background: "#050810" }}>
      <div className="w-full max-w-md animate-fade-in">
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
          <div className="font-mono text-xs text-[#3a5570] tracking-[0.3em]">// ЗАПРОС ДОСТУПА</div>
        </div>

        <div className="card-drone p-8" style={{ border: "1px solid rgba(0,245,255,0.2)" }}>
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ border: "1px solid rgba(0,255,136,0.4)", boxShadow: "0 0 30px rgba(0,255,136,0.2)" }}>
                <Icon name="CheckCircle" size={32} className="text-[#00ff88]" />
              </div>
              <h2 className="font-orbitron text-lg font-bold text-white mb-3">ЗАЯВКА ОТПРАВЛЕНА</h2>
              <p className="font-plex text-sm text-[#5a7a95] mb-6 leading-relaxed">
                Ваша заявка передана администратору на рассмотрение. После одобрения вы сможете войти на платформу.
              </p>
              <button onClick={onBack} className="btn-neon flex items-center gap-2 mx-auto">
                <Icon name="ArrowLeft" size={13} />
                Вернуться к входу
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-1 h-5 bg-[#00ff88] flex-shrink-0" />
                <h2 className="font-orbitron text-sm font-bold tracking-wider text-white flex-1">РЕГИСТРАЦИЯ</h2>
                {callsign && (
                  <div className="flex flex-col items-center gap-1">
                    <Avatar callsign={callsign} size={48} />
                    <span className="font-mono text-[9px] text-[#3a5570]">ВАША ИКОНКА</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3" style={{ background: "rgba(255,34,68,0.08)", border: "1px solid rgba(255,34,68,0.3)" }}>
                  <span className="font-plex text-xs text-[#ff2244]">{error}</span>
                </div>
              )}

              <form onSubmit={handle} className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ПОЗЫВНОЙ *</label>
                  <input
                    type="text"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    required
                    className="w-full bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060]"
                    placeholder="Уникальный позывной для входа"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ИМЯ</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060]"
                    placeholder="Имя или псевдоним"
                  />
                </div>
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
                    minLength={6}
                    className="w-full bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060]"
                    placeholder="Минимум 6 символов"
                  />
                </div>

                <div className="p-3 mt-2" style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.1)" }}>
                  <p className="font-plex text-xs text-[#5a7a95] leading-relaxed">
                    Доступ к платформе предоставляется только после ручного одобрения администратором. Заявка будет рассмотрена в ближайшее время.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 font-orbitron text-sm font-bold tracking-wider transition-all"
                  style={{ background: "rgba(0,255,136,0.1)", border: "1px solid #00ff88", color: "#00ff88", boxShadow: loading ? "none" : "0 0 15px rgba(0,255,136,0.15)" }}
                >
                  {loading ? <><Icon name="Loader" size={14} className="animate-spin" />ОТПРАВКА...</> : <><Icon name="Send" size={14} />ПОДАТЬ ЗАЯВКУ НА ДОСТУП</>}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button onClick={onBack} className="font-plex text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors flex items-center gap-1 mx-auto">
                  <Icon name="ArrowLeft" size={11} />
                  Вернуться к входу
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
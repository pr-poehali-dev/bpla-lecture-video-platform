import { useState } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { api } from "@/api";

interface Props {
  onBack: () => void;
}

const RULES = [
  {
    num: "01",
    title: "Конфиденциальность",
    text: "Все материалы платформы являются закрытыми. Запрещено передавать, копировать или публиковать учебные материалы, видео, схемы и любые другие данные платформы третьим лицам.",
  },
  {
    num: "02",
    title: "Достоверность данных",
    text: "При регистрации необходимо указывать реальные данные. Использование чужих данных или ложной информации является основанием для немедленной блокировки.",
  },
  {
    num: "03",
    title: "Дисциплина и уважение",
    text: "В обсуждениях и чате соблюдать воинскую этику. Запрещены оскорбления, провокации, распространение дезинформации и флуд.",
  },
  {
    num: "04",
    title: "Защита данных",
    text: "Запрещено передавать свои учётные данные другим лицам. При подозрении на компрометацию аккаунта — немедленно сообщить администратору.",
  },
  {
    num: "05",
    title: "Использование материалов",
    text: "Материалы платформы предназначены исключительно для учебных и оперативных целей. Использование в личных, коммерческих или иных целях запрещено.",
  },
  {
    num: "06",
    title: "Ответственность",
    text: "Каждый участник несёт личную ответственность за свои действия на платформе. Нарушение правил влечёт блокировку без предупреждения.",
  },
];

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,8,16,0.97)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg flex flex-col animate-fade-in"
        style={{ border: "1px solid rgba(0,245,255,0.3)", background: "#070d18", boxShadow: "0 0 40px rgba(0,245,255,0.15)", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
          <div>
            <div className="font-mono text-[10px] text-[#00f5ff] tracking-[0.3em] mb-0.5">// ДОКУМЕНТ</div>
            <div className="font-orbitron text-sm font-bold text-white tracking-wider">ПРАВИЛА ПЛАТФОРМЫ</div>
          </div>
          <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <p className="font-plex text-xs text-[#5a7a95] leading-relaxed pb-2" style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}>
            Платформа «Беспилотные Пилотируемые Системы» является закрытым учебным ресурсом. Доступ предоставляется только уполномоченным лицам. Регистрируясь, вы принимаете следующие обязательства:
          </p>

          {RULES.map((rule) => (
            <div key={rule.num} className="flex gap-3">
              <div
                className="font-orbitron text-xs font-black flex-shrink-0 mt-0.5"
                style={{ color: "#00f5ff", opacity: 0.4 }}
              >
                {rule.num}
              </div>
              <div>
                <div className="font-orbitron text-xs font-bold text-white mb-1 tracking-wider">{rule.title}</div>
                <p className="font-plex text-xs text-[#5a7a95] leading-relaxed">{rule.text}</p>
              </div>
            </div>
          ))}

          <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}>
            <p className="font-mono text-[10px] text-[#3a5570] leading-relaxed">
              Администрация платформы оставляет за собой право изменять правила без предварительного уведомления. Актуальная версия всегда доступна при регистрации.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,245,255,0.1)" }}>
          <button onClick={onClose} className="w-full font-orbitron text-xs font-bold tracking-wider py-2.5 transition-all"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
            ПОНЯТНО
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage({ onBack }: Props) {
  const [callsign, setCallsign] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
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
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

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

                {/* Согласие с правилами */}
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer transition-all"
                  style={{ border: `1px solid ${agreed ? "rgba(0,255,136,0.3)" : "rgba(0,245,255,0.1)"}`, background: agreed ? "rgba(0,255,136,0.04)" : "transparent" }}
                  onClick={() => setAgreed(!agreed)}
                >
                  <div
                    className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                    style={{ border: `1px solid ${agreed ? "#00ff88" : "rgba(0,245,255,0.3)"}`, background: agreed ? "rgba(0,255,136,0.15)" : "transparent" }}
                  >
                    {agreed && <Icon name="Check" size={10} className="text-[#00ff88]" />}
                  </div>
                  <p className="font-plex text-xs text-[#5a7a95] leading-relaxed select-none">
                    Я ознакомился и согласен с{" "}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowRules(true); }}
                      className="text-[#00f5ff] hover:text-white transition-colors underline underline-offset-2"
                    >
                      правилами платформы
                    </button>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !agreed}
                  className="w-full flex items-center justify-center gap-2 py-2.5 font-orbitron text-sm font-bold tracking-wider transition-all"
                  style={{
                    background: agreed ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.03)",
                    border: `1px solid ${agreed ? "#00ff88" : "rgba(0,255,136,0.2)"}`,
                    color: agreed ? "#00ff88" : "#2a4a3a",
                    boxShadow: agreed && !loading ? "0 0 15px rgba(0,255,136,0.15)" : "none",
                    cursor: agreed ? "pointer" : "not-allowed",
                  }}
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

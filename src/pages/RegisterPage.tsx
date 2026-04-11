import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { api } from "@/api";

interface RuleItem { num: string; title: string; text: string; }

const DEFAULT_RULES: RuleItem[] = [
  { num: "01", title: "Конфиденциальность", text: "Все материалы платформы являются закрытыми. Запрещено передавать, копировать или публиковать учебные материалы, видео, схемы и любые другие данные платформы третьим лицам." },
  { num: "02", title: "Достоверность данных", text: "При регистрации необходимо указывать реальные данные. Использование чужих данных или ложной информации является основанием для немедленной блокировки." },
  { num: "03", title: "Дисциплина и уважение", text: "В обсуждениях и чате соблюдать воинскую этику. Запрещены оскорбления, провокации, распространение дезинформации и флуд." },
  { num: "04", title: "Защита данных", text: "Запрещено передавать свои учётные данные другим лицам. При подозрении на компрометацию аккаунта — немедленно сообщить администратору." },
  { num: "05", title: "Использование материалов", text: "Материалы платформы предназначены исключительно для учебных и оперативных целей. Использование в личных, коммерческих или иных целях запрещено." },
  { num: "06", title: "Ответственность", text: "Каждый участник несёт личную ответственность за свои действия на платформе. Нарушение правил влечёт блокировку без предупреждения." },
];

const DEFAULT_INTRO = "Платформа «Беспилотные Системы» является закрытым учебным ресурсом. Доступ предоставляется только уполномоченным лицам. Регистрируясь, вы принимаете следующие обязательства:";
const DEFAULT_FOOTER = "Администрация платформы оставляет за собой право изменять правила без предварительного уведомления. Актуальная версия всегда доступна при регистрации.";

const RANKS = [
  "Рядовой", "Ефрейтор", "Младший сержант", "Сержант", "Старший сержант",
  "Старшина", "Прапорщик", "Старший прапорщик",
  "Младший лейтенант", "Лейтенант", "Старший лейтенант", "Капитан",
  "Майор", "Подполковник", "Полковник",
  "Генерал-майор", "Генерал-лейтенант", "Генерал-полковник", "Генерал армии",
];

interface Props { onBack: () => void; }

function pwStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (score === 1) return { level: 1, label: "Слабый", color: "#ff2244" };
  if (score === 2) return { level: 2, label: "Средний", color: "#ff6b00" };
  return { level: 3, label: "Сильный", color: "#00ff88" };
}

function RulesModal({ onClose }: { onClose: () => void }) {
  const [rules, setRules] = useState<RuleItem[]>(DEFAULT_RULES);
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    api.admin.getPage("rules").then(res => {
      const rulesBlock = res.blocks?.find((b: { type: string }) => b.type === "rules");
      if (rulesBlock?.data?.length) setRules(rulesBlock.data);
      const headerBlock = res.blocks?.find((b: { type: string }) => b.type === "rules-header");
      if (headerBlock?.data?.intro) setIntro(headerBlock.data.intro);
      if (headerBlock?.data?.footer) setFooter(headerBlock.data.footer);
    }).catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,8,16,0.97)" }} onClick={onClose}>
      <div className="w-full sm:max-w-lg flex flex-col animate-fade-in"
        style={{ border: "1px solid rgba(0,245,255,0.3)", background: "#070d18", boxShadow: "0 0 40px rgba(0,245,255,0.15)", maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
          <div>
            <div className="font-mono text-[10px] text-[#00f5ff] tracking-[0.3em] mb-0.5">// ДОКУМЕНТ</div>
            <div className="font-orbitron text-sm font-bold text-white tracking-wider">ПРАВИЛА ПЛАТФОРМЫ</div>
          </div>
          <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors"><Icon name="X" size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <p className="font-plex text-xs text-[#5a7a95] leading-relaxed pb-2" style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}>{intro}</p>
          {rules.map(rule => (
            <div key={rule.num} className="flex gap-3">
              <div className="font-orbitron text-xs font-black flex-shrink-0 mt-0.5" style={{ color: "#00f5ff", opacity: 0.4 }}>{rule.num}</div>
              <div>
                <div className="font-orbitron text-xs font-bold text-white mb-1 tracking-wider">{rule.title}</div>
                <p className="font-plex text-xs text-[#5a7a95] leading-relaxed">{rule.text}</p>
              </div>
            </div>
          ))}
          <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}>
            <p className="font-mono text-[10px] text-[#3a5570] leading-relaxed">{footer}</p>
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

// Шаг-индикатор
function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className="flex items-center justify-center w-6 h-6 font-mono text-[10px] font-bold flex-shrink-0 transition-all"
            style={{
              border: `1px solid ${i < step ? "#00ff88" : i === step ? "#00f5ff" : "rgba(0,245,255,0.15)"}`,
              background: i < step ? "rgba(0,255,136,0.1)" : i === step ? "rgba(0,245,255,0.1)" : "transparent",
              color: i < step ? "#00ff88" : i === step ? "#00f5ff" : "#3a5570",
            }}>
            {i < step ? <Icon name="Check" size={10} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className="flex-1 h-px" style={{ background: i < step ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.1)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

const STEP_LABELS = ["Учётные данные", "Личные данные", "Правила"];

export default function RegisterPage({ onBack }: Props) {
  const [step, setStep] = useState(0); // 0, 1, 2
  const [callsign, setCallsign] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [rank, setRank] = useState("");
  const [gender, setGender] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Ошибки полей в реальном времени
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched(p => ({ ...p, [field]: true }));

  const pw = pwStrength(password);

  const step0Valid = callsign.trim().length >= 2 && email.includes("@") && password.length >= 6;
  const step1Valid = name.trim().length >= 1 && gender !== "" && rank !== "";

  const nextStep = () => {
    setError("");
    if (step === 0) {
      if (!step0Valid) { setError("Заполните все поля корректно"); return; }
    }
    if (step === 1) {
      if (!step1Valid) { setError("Заполните все поля"); return; }
    }
    setStep(s => s + 1);
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("Примите правила платформы"); return; }
    setLoading(true);
    setError("");
    const res = await api.register({ callsign, name, email, password, rank, gender });
    setLoading(false);
    if (res.message) {
      setDone(true);
    } else {
      setError(res.error || "Ошибка регистрации");
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg px-4" style={{ background: "#050810" }}>
        <div className="w-full max-w-md animate-fade-in text-center">
          <div className="card-drone p-8" style={{ border: "1px solid rgba(0,255,136,0.3)" }}>
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6"
              style={{ border: "1px solid rgba(0,255,136,0.4)", background: "rgba(0,255,136,0.06)", boxShadow: "0 0 30px rgba(0,255,136,0.2)" }}>
              <Icon name="CheckCircle" size={36} className="text-[#00ff88]" />
            </div>
            <div className="font-mono text-[10px] text-[#00ff88] tracking-[0.4em] mb-3">// ЗАЯВКА ПРИНЯТА</div>
            <h2 className="font-orbitron text-xl font-black text-white mb-4 tracking-wider">ЗАЯВКА ОТПРАВЛЕНА</h2>
            <p className="font-plex text-sm text-[#5a7a95] leading-relaxed mb-8">
              Ваша заявка передана администратору на рассмотрение. После одобрения вы сможете войти на платформу.
            </p>
            <button onClick={onBack} className="btn-neon flex items-center gap-2 mx-auto">
              <Icon name="ArrowLeft" size={13} />
              Вернуться к входу
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg px-4" style={{ background: "#050810" }}>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 20px rgba(0,245,255,0.4)" }}>
              <Icon name="Crosshair" size={20} className="text-[#00f5ff]" />
            </div>
            <div className="text-left">
              <div className="font-orbitron font-bold text-base tracking-[0.2em] text-[#00f5ff] leading-none">БпС</div>
              <div className="font-orbitron font-bold text-xs tracking-[0.1em] text-white leading-none">БЕСПИЛОТНЫЕ СИСТЕМЫ</div>
            </div>
          </div>
          <div className="font-mono text-xs text-[#3a5570] tracking-[0.3em]">// ЗАПРОС ДОСТУПА</div>
        </div>

        <div className="card-drone p-5 sm:p-8" style={{ border: "1px solid rgba(0,245,255,0.2)" }}>
          {/* Step indicator */}
          <StepBar step={step} total={3} />

          {/* Step label */}
          <div className="flex items-center gap-3 mb-6">
            {callsign && step >= 1 && (
              <Avatar callsign={callsign} size={36} />
            )}
            <div>
              <div className="font-mono text-[10px] text-[#3a5570] tracking-wider">ШАГ {step + 1} / 3</div>
              <div className="font-orbitron text-sm font-bold text-white tracking-wider">{STEP_LABELS[step].toUpperCase()}</div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3" style={{ background: "rgba(255,34,68,0.08)", border: "1px solid rgba(255,34,68,0.3)" }}>
              <span className="font-plex text-xs text-[#ff2244]">{error}</span>
            </div>
          )}

          {/* ── ШАГ 0: Учётные данные ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ПОЗЫВНОЙ *</label>
                <input
                  autoFocus
                  type="text"
                  value={callsign}
                  onChange={e => setCallsign(e.target.value)}
                  onBlur={() => touch("callsign")}
                  className="w-full bg-[#050810] border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none transition-colors placeholder:text-[#2a4060]"
                  style={{ borderColor: touched.callsign && callsign.length < 2 ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}
                  placeholder="Уникальный позывной для входа"
                />
                {touched.callsign && callsign.length < 2 && (
                  <div className="font-mono text-[10px] text-[#ff2244] mt-1">Минимум 2 символа</div>
                )}
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">EMAIL *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => touch("email")}
                  className="w-full bg-[#050810] border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none transition-colors placeholder:text-[#2a4060]"
                  style={{ borderColor: touched.email && !email.includes("@") ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}
                  placeholder="operator@example.com"
                />
                {touched.email && !email.includes("@") && (
                  <div className="font-mono text-[10px] text-[#ff2244] mt-1">Введите корректный email</div>
                )}
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ПАРОЛЬ *</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => touch("password")}
                    className="w-full bg-[#050810] border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 pr-10 rounded-sm outline-none transition-colors placeholder:text-[#2a4060]"
                    style={{ borderColor: touched.password && password.length < 6 ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}
                    placeholder="Минимум 6 символов"
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-[#00f5ff] transition-colors" tabIndex={-1}>
                    <Icon name={showPw ? "EyeOff" : "Eye"} size={14} />
                  </button>
                </div>
                {/* Индикатор силы пароля */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map(lvl => (
                        <div key={lvl} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: pw.level >= lvl ? pw.color : "rgba(255,255,255,0.08)" }} />
                      ))}
                    </div>
                    <div className="font-mono text-[10px]" style={{ color: pw.color }}>{pw.label}</div>
                  </div>
                )}
                {touched.password && password.length < 6 && (
                  <div className="font-mono text-[10px] text-[#ff2244] mt-1">Минимум 6 символов</div>
                )}
              </div>
              <button type="button" onClick={nextStep}
                className="btn-neon-filled w-full flex items-center justify-center gap-2 mt-2">
                ДАЛЕЕ <Icon name="ChevronRight" size={14} />
              </button>
            </div>
          )}

          {/* ── ШАГ 1: Личные данные ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ИМЯ *</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={() => touch("name")}
                  className="w-full bg-[#050810] border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none transition-colors placeholder:text-[#2a4060]"
                  style={{ borderColor: touched.name && !name.trim() ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}
                  placeholder="Имя или псевдоним"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ПОЛ *</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)]">
                  <option value="">— выберите —</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ЗВАНИЕ *</label>
                <select
                  value={rank}
                  onChange={e => setRank(e.target.value)}
                  className="w-full bg-[#050810] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2.5 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)]">
                  <option value="">— выберите —</option>
                  {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setStep(0)}
                  className="flex-1 font-mono text-xs px-4 py-2.5 text-[#3a5570] hover:text-white transition-colors"
                  style={{ border: "1px solid #1a2a3a" }}>
                  ← НАЗАД
                </button>
                <button type="button" onClick={nextStep}
                  className="flex-1 btn-neon flex items-center justify-center gap-2">
                  ДАЛЕЕ <Icon name="ChevronRight" size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── ШАГ 2: Правила ── */}
          {step === 2 && (
            <form onSubmit={handle}>
              <div className="p-3 mb-4" style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.1)" }}>
                <p className="font-plex text-xs text-[#5a7a95] leading-relaxed">
                  Доступ к платформе предоставляется только после ручного одобрения администратором. Заявка будет рассмотрена в ближайшее время.
                </p>
              </div>

              <div
                className="flex items-start gap-3 p-3 cursor-pointer transition-all mb-4"
                style={{ border: `1px solid ${agreed ? "rgba(0,255,136,0.3)" : "rgba(0,245,255,0.1)"}`, background: agreed ? "rgba(0,255,136,0.04)" : "transparent" }}
                onClick={() => setAgreed(!agreed)}>
                <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                  style={{ border: `1px solid ${agreed ? "#00ff88" : "rgba(0,245,255,0.3)"}`, background: agreed ? "rgba(0,255,136,0.15)" : "transparent" }}>
                  {agreed && <Icon name="Check" size={10} className="text-[#00ff88]" />}
                </div>
                <p className="font-plex text-xs text-[#5a7a95] leading-relaxed select-none">
                  Я ознакомился и согласен с{" "}
                  <button type="button" onClick={e => { e.stopPropagation(); setShowRules(true); }}
                    className="text-[#00f5ff] hover:text-white transition-colors underline underline-offset-2">
                    правилами платформы
                  </button>
                </p>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-shrink-0 font-mono text-xs px-4 py-2.5 text-[#3a5570] hover:text-white transition-colors"
                  style={{ border: "1px solid #1a2a3a" }}>
                  ← НАЗАД
                </button>
                <button type="submit" disabled={loading || !agreed}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 font-orbitron text-sm font-bold tracking-wider transition-all"
                  style={{
                    background: agreed ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.03)",
                    border: `1px solid ${agreed ? "#00ff88" : "rgba(0,255,136,0.2)"}`,
                    color: agreed ? "#00ff88" : "#2a4a3a",
                    boxShadow: agreed && !loading ? "0 0 15px rgba(0,255,136,0.15)" : "none",
                    cursor: agreed ? "pointer" : "not-allowed",
                  }}>
                  {loading
                    ? <><Icon name="Loader" size={14} className="animate-spin" />ОТПРАВКА...</>
                    : <><Icon name="Send" size={14} />ПОДАТЬ ЗАЯВКУ</>}
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 text-center">
            <button onClick={onBack} className="font-plex text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors flex items-center gap-1 mx-auto">
              <Icon name="ArrowLeft" size={11} />
              Вернуться к входу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
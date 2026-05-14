import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import LogoIcon from "@/components/LogoIcon";
import { api } from "@/api";

interface RuleItem { num: string; title: string; text: string; }

const DEFAULT_RULES: RuleItem[] = [
  { num: "01", title: "Конфиденциальность", text: "Все материалы платформы являются закрытыми. Запрещено передавать, копировать или публиковать учебные материалы, видео, схемы и любые другие данные платформы третьим лицам." },
  { num: "02", title: "Режим информационной безопасности", text: "Запрещено обсуждать в открытых каналах: координаты позиций, данные о личном составе, технические характеристики оборудования, планы операций." },
  { num: "03", title: "Достоверность данных", text: "При регистрации необходимо указывать реальные данные. Использование чужих данных является основанием для немедленной блокировки без объяснений." },
  { num: "04", title: "Дисциплина и воинская этика", text: "В обсуждениях и чате соблюдать воинскую этику и субординацию. Запрещены оскорбления, провокации и распространение дезинформации." },
  { num: "05", title: "Защита учётных данных", text: "Запрещено передавать свои учётные данные другим лицам. При подозрении на компрометацию — немедленно сообщить администратору." },
  { num: "06", title: "Ответственность", text: "Каждый участник несёт личную ответственность за свои действия. Нарушение правил влечёт немедленную блокировку без предупреждения." },
];

const DEFAULT_INTRO = "Платформа является закрытым учебным ресурсом для личного состава. Доступ предоставляется только после ручной проверки администратором.";
const DEFAULT_FOOTER = "Администрация оставляет за собой право изменять правила без предварительного уведомления.";
const RULES_UPDATED = "15 мая 2026";

const RANKS = [
  "Рядовой", "Ефрейтор", "Младший сержант", "Сержант", "Старший сержант",
  "Старшина", "Прапорщик", "Старший прапорщик",
  "Младший лейтенант", "Лейтенант", "Старший лейтенант", "Капитан",
  "Майор", "Подполковник", "Полковник",
  "Генерал-майор", "Генерал-лейтенант", "Генерал-полковник", "Генерал армии",
];

const FEATURES = [
  { icon: "BookOpen",      label: "Учебные лекции",        desc: "Теория и методика применения БпЛА" },
  { icon: "Play",          label: "Видеоматериалы",         desc: "Разбор миссий и обучающие записи" },
  { icon: "Plane",         label: "Типы БпЛА",              desc: "Тактико-технические характеристики" },
  { icon: "MessageSquare", label: "Чат с инструкторами",    desc: "Прямая связь и обсуждения" },
  { icon: "FileText",      label: "База документов",        desc: "Приказы, схемы, нормативы" },
  { icon: "HeartPulse",    label: "Тактическая медицина",   desc: "Протоколы оказания помощи" },
];

function pwStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string; hint: string } {
  if (!pw) return { level: 0, label: "", color: "", hint: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (score === 1) return { level: 1, label: "Слабый", color: "#ff2244", hint: "Добавьте цифры или заглавные буквы" };
  if (score === 2) return { level: 2, label: "Средний", color: "#ff6b00", hint: "Удлините пароль до 10+ символов" };
  return { level: 3, label: "Сильный", color: "#00ff88", hint: "Отличный пароль" };
}

function RulesModal({ onClose, onAccept }: { onClose: () => void; onAccept: () => void }) {
  const [rules, setRules] = useState<RuleItem[]>(DEFAULT_RULES);
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.admin.getPage("rules").then(res => {
      const rb = res.blocks?.find((b: { type: string }) => b.type === "rules");
      if (rb?.data?.length) setRules(rb.data);
      const hb = res.blocks?.find((b: { type: string }) => b.type === "rules-header");
      if (hb?.data?.intro) setIntro(hb.data.intro);
      if (hb?.data?.footer) setFooter(hb.data.footer);
    }).catch(() => {});
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setScrolledToEnd(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,8,16,0.97)" }} onClick={onClose}>
      <div className="w-full sm:max-w-lg flex flex-col animate-fade-in"
        style={{ border: "1px solid rgba(0,245,255,0.3)", background: "#070d18", maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
          <div>
            <div className="font-mono text-[10px] text-[#00f5ff] tracking-[0.3em] mb-0.5">// ДОКУМЕНТ</div>
            <div className="font-orbitron text-sm font-bold text-white tracking-wider">ПРАВИЛА ПЛАТФОРМЫ</div>
            <div className="font-mono text-[9px] text-[#3a5570] mt-0.5">Версия от {RULES_UPDATED}</div>
          </div>
          <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {!scrolledToEnd && (
          <div className="flex items-center justify-center gap-2 px-5 py-2 flex-shrink-0"
            style={{ background: "rgba(255,107,0,0.06)", borderBottom: "1px solid rgba(255,107,0,0.12)" }}>
            <Icon name="ArrowDown" size={11} className="text-[#ff6b00] animate-bounce" />
            <span className="font-mono text-[10px] text-[#ff6b00]">Прокрутите до конца чтобы принять</span>
          </div>
        )}

        <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <p className="font-plex text-xs text-[#5a7a95] leading-relaxed pb-2"
            style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}>{intro}</p>
          {rules.map(rule => (
            <div key={rule.num} className="flex gap-3">
              <div className="font-orbitron text-xs font-black flex-shrink-0 mt-0.5"
                style={{ color: "#00f5ff", opacity: 0.4 }}>{rule.num}</div>
              <div>
                <div className="font-orbitron text-xs font-bold text-white mb-1 tracking-wider">{rule.title}</div>
                <p className="font-plex text-xs text-[#5a7a95] leading-relaxed">{rule.text}</p>
              </div>
            </div>
          ))}
          <div className="pt-2" style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}>
            <p className="font-mono text-[10px] text-[#3a5570] leading-relaxed">{footer}</p>
          </div>
        </div>

        <div className="px-5 py-4 flex-shrink-0 space-y-2"
          style={{ borderTop: "1px solid rgba(0,245,255,0.1)" }}>
          <button onClick={() => { onAccept(); onClose(); }} disabled={!scrolledToEnd}
            className="w-full font-orbitron text-xs font-bold tracking-wider py-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: scrolledToEnd ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.02)",
              border: `1px solid ${scrolledToEnd ? "#00ff88" : "rgba(0,255,136,0.15)"}`,
              color: scrolledToEnd ? "#00ff88" : "#2a4a3a",
            }}>
            {scrolledToEnd ? "✓ ПРОЧИТАЛ — ПРИНИМАЮ ПРАВИЛА" : "↓ ПРОКРУТИТЕ ДО КОНЦА"}
          </button>
          <button onClick={onClose}
            className="w-full font-mono text-xs py-2 text-[#3a5570] hover:text-white transition-colors"
            style={{ border: "1px solid rgba(0,245,255,0.08)" }}>
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props { onBack: () => void; }

export default function RegisterPage({ onBack }: Props) {
  const [step, setStep] = useState(0); // 0 = данные, 1 = правила
  const [showRules, setShowRules] = useState(false);

  // Шаг 0
  const [callsign, setCallsign] = useState(() => sessionStorage.getItem("reg_callsign") || "");
  const [email, setEmail] = useState(() => sessionStorage.getItem("reg_email") || "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [dogTag, setDogTag] = useState(() => sessionStorage.getItem("reg_dog_tag") || "");
  const [name, setName] = useState(() => sessionStorage.getItem("reg_name") || "");
  const [rank, setRank] = useState(() => sessionStorage.getItem("reg_rank") || "");
  const [unit, setUnit] = useState(() => sessionStorage.getItem("reg_unit") || "");

  // Шаг 1
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Проверка позывного
  const [callsignStatus, setCallsignStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const callsignTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const touch = (field: string) => setTouched(p => ({ ...p, [field]: true }));
  const pw = pwStrength(password);

  // Сохраняем черновик
  useEffect(() => { sessionStorage.setItem("reg_callsign", callsign); }, [callsign]);
  useEffect(() => { sessionStorage.setItem("reg_email", email); }, [email]);
  useEffect(() => { sessionStorage.setItem("reg_dog_tag", dogTag); }, [dogTag]);
  useEffect(() => { sessionStorage.setItem("reg_name", name); }, [name]);
  useEffect(() => { sessionStorage.setItem("reg_rank", rank); }, [rank]);
  useEffect(() => { sessionStorage.setItem("reg_unit", unit); }, [unit]);

  // Проверка уникальности позывного с debounce
  const checkCallsign = useCallback((val: string) => {
    if (callsignTimer.current) clearTimeout(callsignTimer.current);
    if (val.length < 2) { setCallsignStatus("idle"); return; }
    setCallsignStatus("checking");
    callsignTimer.current = setTimeout(async () => {
      const res = await api.checkCallsign(val).catch(() => null);
      if (!res) { setCallsignStatus("idle"); return; }
      setCallsignStatus(res.available ? "ok" : "taken");
    }, 600);
  }, []);

  const handleCallsignChange = (val: string) => {
    setCallsign(val);
    checkCallsign(val);
  };

  const step0Valid =
    callsign.trim().length >= 2 &&
    callsignStatus !== "taken" &&
    email.includes("@") && email.includes(".") &&
    password.length >= 6 &&
    dogTag.trim().length >= 2 &&
    name.trim().length >= 1 &&
    rank !== "";

  const handleNext = () => {
    setError("");
    if (!step0Valid) { setError("Заполните все обязательные поля корректно"); return; }
    if (callsignStatus === "taken") { setError("Этот позывной уже занят"); return; }
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!agreed) { setError("Примите правила платформы"); return; }
    setLoading(true); setError("");
    const res = await api.register({ callsign, name, email, password, rank, dog_tag: dogTag, unit: unit || undefined });
    setLoading(false);
    if (res.message) {
      sessionStorage.removeItem("reg_callsign");
      sessionStorage.removeItem("reg_email");
      sessionStorage.removeItem("reg_dog_tag");
      sessionStorage.removeItem("reg_name");
      sessionStorage.removeItem("reg_rank");
      sessionStorage.removeItem("reg_unit");
      setDone(true);
    } else {
      setError(res.error || "Ошибка регистрации");
    }
  };

  // ── Экран успеха ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg px-4" style={{ background: "#050810" }}>
        <div className="w-full max-w-lg animate-fade-in">
          <div className="p-8 sm:p-10" style={{ border: "1px solid rgba(0,255,136,0.25)", background: "rgba(4,10,22,0.95)" }}>
            {/* Иконка */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 flex items-center justify-center"
                style={{ border: "1px solid rgba(0,255,136,0.4)", background: "rgba(0,255,136,0.06)", boxShadow: "0 0 40px rgba(0,255,136,0.15)" }}>
                <Icon name="CheckCircle" size={40} className="text-[#00ff88]" />
              </div>
            </div>

            <div className="font-mono text-[10px] text-[#00ff88] tracking-[0.4em] mb-2 text-center">// ЗАЯВКА ПРИНЯТА</div>
            <h2 className="font-orbitron text-2xl font-black text-white mb-2 tracking-wider text-center">ЗАЯВКА ОТПРАВЛЕНА</h2>
            <p className="font-plex text-sm text-[#5a7a95] text-center mb-8 leading-relaxed">
              Ваша заявка передана на рассмотрение. Администратор проверит данные и примет решение.
            </p>

            {/* Что было отправлено */}
            <div className="space-y-2 mb-6 p-4" style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.08)" }}>
              <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-3">ВАШИ ДАННЫЕ</div>
              {[
                { label: "Позывной", value: callsign },
                { label: "№ жетона", value: dogTag },
                { label: "Звание", value: rank },
                { label: "Email", value: email },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#3a5570]">{f.label}</span>
                  <span className="font-plex text-sm text-white">{f.value}</span>
                </div>
              ))}
            </div>

            {/* Что дальше */}
            <div className="space-y-3 mb-8">
              {[
                { n: "1", text: "Администратор проверяет данные", sub: "Срок рассмотрения — до 48 часов" },
                { n: "2", text: "Вы получите уведомление", sub: `На адрес ${email}` },
                { n: "3", text: "Входите с позывным и паролем", sub: "Доступ ко всем разделам платформы" },
              ].map(s => (
                <div key={s.n} className="flex gap-3 items-start">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-bold mt-0.5"
                    style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>{s.n}</div>
                  <div>
                    <div className="font-plex text-sm text-white">{s.text}</div>
                    <div className="font-mono text-[10px] text-[#3a5570]">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={onBack}
              className="w-full flex items-center justify-center gap-2 py-3 font-mono text-xs tracking-wider transition-all"
              style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
              <Icon name="ArrowLeft" size={13} /> ВЕРНУТЬСЯ К ВХОДУ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Основной экран ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid-bg flex" style={{ background: "#050810" }}>
      {showRules && <RulesModal onClose={() => setShowRules(false)} onAccept={() => setAgreed(true)} />}

      {/* Левая информационная панель — только на десктопе */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 px-10 py-12"
        style={{ borderRight: "1px solid rgba(0,245,255,0.08)", background: "rgba(4,10,22,0.6)" }}>

        {/* Лого */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <LogoIcon size={36} />
            <div>
              <div className="font-orbitron font-bold text-base tracking-[0.15em] text-[#00f5ff] leading-none">БпС</div>
              <div className="font-orbitron font-bold text-xs tracking-[0.08em] text-white leading-none mt-0.5">БЕСПИЛОТНЫЕ СИСТЕМЫ</div>
            </div>
          </div>

          <div className="mb-3">
            <div className="font-mono text-[10px] text-[#3a5570] tracking-[0.3em] mb-2">// ЧТО ВАС ЖДЁТ</div>
            <div className="space-y-3">
              {FEATURES.map(f => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(0,245,255,0.04)" }}>
                    <Icon name={f.icon as "BookOpen"} size={14} className="text-[#00f5ff]" />
                  </div>
                  <div>
                    <div className="font-plex text-sm text-white font-medium">{f.label}</div>
                    <div className="font-mono text-[10px] text-[#3a5570]">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Как работает */}
        <div>
          <div className="font-mono text-[10px] text-[#3a5570] tracking-[0.3em] mb-3">// КАК ЭТО РАБОТАЕТ</div>
          <div className="space-y-3">
            {[
              { n: "01", text: "Заполните заявку с реальными данными" },
              { n: "02", text: "Администратор проверяет (до 48 ч)" },
              { n: "03", text: "Получаете доступ ко всем разделам" },
            ].map(s => (
              <div key={s.n} className="flex gap-3 items-center">
                <span className="font-orbitron text-xs font-black flex-shrink-0" style={{ color: "#00f5ff", opacity: 0.4 }}>{s.n}</span>
                <span className="font-plex text-sm text-[#5a7a95]">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Правая форма */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Лого мобиль */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <LogoIcon size={32} />
          <div>
            <div className="font-orbitron font-bold text-sm tracking-[0.15em] text-[#00f5ff] leading-none">БпС</div>
            <div className="font-orbitron font-bold text-xs tracking-[0.08em] text-white leading-none mt-0.5">БЕСПИЛОТНЫЕ СИСТЕМЫ</div>
          </div>
        </div>

        <div className="w-full max-w-md animate-fade-in">

          {/* Шаг-индикатор */}
          <div className="flex items-center gap-3 mb-6">
            {["Данные бойца", "Правила"].map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0"
                    style={{
                      border: `1px solid ${i < step ? "#00ff88" : i === step ? "#00f5ff" : "rgba(0,245,255,0.15)"}`,
                      background: i < step ? "rgba(0,255,136,0.1)" : i === step ? "rgba(0,245,255,0.1)" : "transparent",
                      color: i < step ? "#00ff88" : i === step ? "#00f5ff" : "#3a5570",
                    }}>
                    {i < step ? <Icon name="Check" size={10} /> : i + 1}
                  </div>
                  <span className="font-mono text-[10px] hidden sm:inline"
                    style={{ color: i === step ? "#00f5ff" : "#3a5570" }}>{label.toUpperCase()}</span>
                </div>
                {i < 1 && (
                  <div className="flex-1 h-px mx-2" style={{ background: step > i ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.1)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Заголовок шага */}
          <div className="mb-5">
            <div className="font-mono text-[10px] text-[#3a5570] tracking-[0.3em] mb-0.5">// ЗАПРОС ДОСТУПА</div>
            <h1 className="font-orbitron text-xl font-black text-white tracking-wider">
              {step === 0 ? "ДАННЫЕ БОЙЦА" : "ПРАВИЛА ПЛАТФОРМЫ"}
            </h1>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-4 p-3 flex items-center gap-2"
              style={{ background: "rgba(255,34,68,0.07)", border: "1px solid rgba(255,34,68,0.3)" }}>
              <Icon name="AlertCircle" size={13} className="text-[#ff2244] flex-shrink-0" />
              <span className="font-plex text-xs text-[#ff2244]">{error}</span>
            </div>
          )}

          {/* ── ШАГ 0: Данные бойца ─────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-0" style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,10,22,0.8)" }}>

              {/* Блок: учётные данные */}
              <div className="px-5 py-4 space-y-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
                <div className="font-mono text-[9px] text-[#3a5570] tracking-[0.25em]">УЧЁТНЫЕ ДАННЫЕ</div>

                {/* Позывной */}
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">
                    ПОЗЫВНОЙ *
                  </label>
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      value={callsign}
                      onChange={e => handleCallsignChange(e.target.value)}
                      onBlur={() => touch("callsign")}
                      className="w-full bg-transparent border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 pr-10 outline-none transition-colors placeholder:text-[#2a4060]"
                      style={{ borderColor: callsignStatus === "taken" ? "rgba(255,34,68,0.5)" : callsignStatus === "ok" ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.15)" }}
                      placeholder="Уникальный позывной для входа"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {callsignStatus === "checking" && <Icon name="Loader" size={13} className="text-[#3a5570] animate-spin" />}
                      {callsignStatus === "ok" && <Icon name="Check" size={13} className="text-[#00ff88]" />}
                      {callsignStatus === "taken" && <Icon name="X" size={13} className="text-[#ff2244]" />}
                    </div>
                  </div>
                  {callsignStatus === "taken" && (
                    <div className="font-mono text-[10px] text-[#ff2244] mt-1">Этот позывной уже занят</div>
                  )}
                  {callsignStatus === "ok" && (
                    <div className="font-mono text-[10px] text-[#00ff88] mt-1">Позывной свободен</div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">EMAIL *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => touch("email")}
                    className="w-full bg-transparent border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 outline-none transition-colors placeholder:text-[#2a4060]"
                    style={{ borderColor: touched.email && !email.includes("@") ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}
                    placeholder="operator@example.com"
                  />
                  {touched.email && !email.includes("@") && (
                    <div className="font-mono text-[10px] text-[#ff2244] mt-1">Введите корректный email</div>
                  )}
                  <div className="font-mono text-[9px] text-[#2a4060] mt-1">На этот адрес придёт уведомление об одобрении</div>
                </div>

                {/* Пароль */}
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ПАРОЛЬ *</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onBlur={() => touch("password")}
                      className="w-full bg-transparent border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 pr-10 outline-none transition-colors placeholder:text-[#2a4060]"
                      style={{ borderColor: touched.password && password.length < 6 ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}
                      placeholder="Минимум 6 символов"
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                      <Icon name={showPw ? "EyeOff" : "Eye"} size={14} />
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3].map(lvl => (
                          <div key={lvl} className="flex-1 h-1 transition-all duration-300"
                            style={{ background: pw.level >= lvl ? pw.color : "rgba(255,255,255,0.06)" }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-[10px]" style={{ color: pw.color }}>{pw.label}</div>
                        <div className="font-mono text-[10px] text-[#3a5570]">{pw.hint}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Блок: личные данные */}
              <div className="px-5 py-4 space-y-4" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
                <div className="font-mono text-[9px] text-[#3a5570] tracking-[0.25em]">ЛИЧНЫЕ ДАННЫЕ</div>

                {/* Имя */}
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ИМЯ / ПОЗЫВНОЕ ИМЯ *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={() => touch("name")}
                    className="w-full bg-transparent border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 outline-none transition-colors placeholder:text-[#2a4060]"
                    style={{ borderColor: touched.name && !name.trim() ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}
                    placeholder="Фамилия И. О. или имя"
                  />
                </div>

                {/* Звание */}
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ВОИНСКОЕ ЗВАНИЕ *</label>
                  <select
                    value={rank}
                    onChange={e => setRank(e.target.value)}
                    onBlur={() => touch("rank")}
                    className="w-full bg-[#050810] border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 outline-none"
                    style={{ borderColor: touched.rank && !rank ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}>
                    <option value="">— выберите звание —</option>
                    {RANKS.map(r => <option key={r} value={r} style={{ background: "#050810" }}>{r}</option>)}
                  </select>
                </div>

                {/* Жетон */}
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">
                    НОМЕР ЖЕТОНА *
                    <span className="ml-2 text-[#2a4060] normal-case tracking-normal">(личный номер военнослужащего)</span>
                  </label>
                  <input
                    type="text"
                    value={dogTag}
                    onChange={e => setDogTag(e.target.value)}
                    onBlur={() => touch("dogTag")}
                    className="w-full bg-transparent border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 outline-none transition-colors placeholder:text-[#2a4060]"
                    style={{ borderColor: touched.dogTag && dogTag.trim().length < 2 ? "rgba(255,34,68,0.5)" : "rgba(0,245,255,0.15)" }}
                    placeholder="Например: А-123456"
                  />
                  {touched.dogTag && dogTag.trim().length < 2 && (
                    <div className="font-mono text-[10px] text-[#ff2244] mt-1">Укажите номер жетона</div>
                  )}
                </div>

                {/* Подразделение */}
                <div>
                  <label className="font-mono text-[10px] text-[#3a5570] tracking-widest block mb-1.5">ПОДРАЗДЕЛЕНИЕ / ЧАСТЬ</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-transparent border text-[#e0f4ff] font-plex text-sm px-3 py-2.5 outline-none transition-colors placeholder:text-[#2a4060]"
                    style={{ borderColor: "rgba(0,245,255,0.1)" }}
                    placeholder="В/ч 00000 или позывное подразделения"
                  />
                </div>
              </div>

              {/* Кнопки */}
              <div className="px-5 py-4 flex gap-3">
                <button type="button" onClick={onBack}
                  className="font-mono text-xs px-4 py-2.5 text-[#3a5570] hover:text-white transition-colors"
                  style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
                  ← НАЗАД
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!step0Valid}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 font-orbitron text-sm font-bold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: step0Valid ? "rgba(0,245,255,0.1)" : "rgba(0,245,255,0.03)",
                    border: `1px solid ${step0Valid ? "rgba(0,245,255,0.5)" : "rgba(0,245,255,0.15)"}`,
                    color: step0Valid ? "#00f5ff" : "#2a4a5a",
                    boxShadow: step0Valid ? "0 0 12px rgba(0,245,255,0.12)" : "none",
                  }}>
                  ДАЛЕЕ <Icon name="ChevronRight" size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── ШАГ 1: Правила ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4" style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.1)" }}>
                <p className="font-plex text-xs text-[#5a7a95] leading-relaxed">
                  Доступ предоставляется только после ручного одобрения администратором.
                  Убедитесь что указали реальные данные — заявки с ложной информацией отклоняются.
                </p>
              </div>

              {/* Чекбокс принятия правил */}
              <button
                type="button"
                onClick={() => !agreed && setShowRules(true)}
                className="w-full flex items-start gap-3 p-4 text-left transition-all"
                style={{
                  border: `1px solid ${agreed ? "rgba(0,255,136,0.35)" : "rgba(0,245,255,0.12)"}`,
                  background: agreed ? "rgba(0,255,136,0.04)" : "rgba(4,10,22,0.6)",
                }}>
                <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                  style={{
                    border: `1px solid ${agreed ? "#00ff88" : "rgba(0,245,255,0.3)"}`,
                    background: agreed ? "rgba(0,255,136,0.15)" : "transparent",
                  }}>
                  {agreed && <Icon name="Check" size={11} className="text-[#00ff88]" />}
                </div>
                <div className="flex-1">
                  <div className="font-plex text-sm text-white mb-0.5">
                    Я ознакомился и принимаю{" "}
                    <span
                      className="text-[#00f5ff] underline underline-offset-2 cursor-pointer"
                      onClick={e => { e.stopPropagation(); setShowRules(true); }}>
                      правила платформы
                    </span>
                  </div>
                  {!agreed && (
                    <div className="font-mono text-[10px] text-[#3a5570]">
                      Нажмите чтобы открыть и прочитать правила
                    </div>
                  )}
                  {agreed && (
                    <div className="font-mono text-[10px] text-[#00ff88]">
                      ✓ Правила прочитаны и приняты
                    </div>
                  )}
                </div>
              </button>

              {/* Кнопки */}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(0)}
                  className="font-mono text-xs px-4 py-2.5 text-[#3a5570] hover:text-white transition-colors"
                  style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
                  ← НАЗАД
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!agreed || loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 font-orbitron text-sm font-bold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: agreed ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.02)",
                    border: `1px solid ${agreed ? "#00ff88" : "rgba(0,255,136,0.15)"}`,
                    color: agreed ? "#00ff88" : "#2a4a3a",
                    boxShadow: agreed && !loading ? "0 0 16px rgba(0,255,136,0.12)" : "none",
                  }}>
                  {loading
                    ? <><Icon name="Loader" size={14} className="animate-spin" /> ОТПРАВКА...</>
                    : <><Icon name="Send" size={14} /> ПОДАТЬ ЗАЯВКУ</>}
                </button>
              </div>
            </div>
          )}

          {/* Ссылка на вход */}
          <div className="mt-5 text-center">
            <button onClick={onBack}
              className="font-plex text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors flex items-center gap-1 mx-auto">
              <Icon name="ArrowLeft" size={11} /> Уже есть заявка? Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
